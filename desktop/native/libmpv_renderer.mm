#define GL_SILENCE_DEPRECATION

#include <node_api.h>

#include <AppKit/AppKit.h>
#include <Foundation/Foundation.h>
#include <OpenGL/OpenGL.h>
#include <OpenGL/gl3.h>
#include <dispatch/dispatch.h>
#include <dlfcn.h>

#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <memory>
#include <mutex>
#include <optional>
#include <sstream>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

#include <mpv/client.h>
#include <mpv/render.h>
#include <mpv/render_gl.h>

class Player;

static napi_ref g_constructor_ref = nullptr;
static std::mutex g_players_mutex;
static std::unordered_map<int32_t, std::unique_ptr<Player>> g_players;
static int32_t g_next_player_id = 1;

const char *kOpenGLLibraryPath = "/System/Library/Frameworks/OpenGL.framework/OpenGL";

std::string ErrorString(const std::string &message) {
  return message;
}

std::string MpvErrorString(int status) {
  const char *error = mpv_error_string(status);
  std::ostringstream stream;
  stream << (error ? error : "unknown error") << " (" << status << ")";
  return stream.str();
}

void ThrowTypeError(napi_env env, const char *message) {
  napi_throw_type_error(env, nullptr, message);
}

void ThrowError(napi_env env, const std::string &message) {
  napi_throw_error(env, nullptr, message.c_str());
}

bool GetBool(napi_env env, napi_value value) {
  bool result = false;
  napi_get_value_bool(env, value, &result);
  return result;
}

double GetNumber(napi_env env, napi_value value) {
  double result = 0;
  napi_get_value_double(env, value, &result);
  return result;
}

bool IsArray(napi_env env, napi_value value) {
  bool result = false;
  napi_is_array(env, value, &result);
  return result;
}

std::string GetString(napi_env env, napi_value value) {
  size_t length = 0;
  napi_get_value_string_utf8(env, value, nullptr, 0, &length);
  std::string result(length, '\0');
  napi_get_value_string_utf8(env, value, result.data(), result.size() + 1, &length);
  result.resize(length);
  return result;
}

std::string ValueToCommandPart(napi_env env, napi_value value) {
  napi_valuetype type = napi_undefined;
  napi_typeof(env, value, &type);

  switch (type) {
    case napi_string:
      return GetString(env, value);
    case napi_number: {
      double number = GetNumber(env, value);
      if (std::isfinite(number) && std::floor(number) == number) {
        return std::to_string(static_cast<long long>(number));
      }
      std::ostringstream stream;
      stream << number;
      return stream.str();
    }
    case napi_boolean:
      return GetBool(env, value) ? "yes" : "no";
    case napi_null:
      return "null";
    default:
      ThrowTypeError(env, "Unsupported command argument type");
      return "";
  }
}

std::vector<std::string> ValueToCommandParts(napi_env env, napi_value value) {
  if (!IsArray(env, value)) {
    ThrowTypeError(env, "Command arguments must be an array");
    return {};
  }

  uint32_t length = 0;
  napi_get_array_length(env, value, &length);

  std::vector<std::string> parts;
  parts.reserve(length);

  for (uint32_t index = 0; index < length; index++) {
    napi_value entry;
    napi_get_element(env, value, index, &entry);
    parts.push_back(ValueToCommandPart(env, entry));
    bool pending = false;
    napi_is_exception_pending(env, &pending);
    if (pending) return {};
  }

  return parts;
}

struct PropertyValue {
  mpv_format format = MPV_FORMAT_NONE;
  std::string string_value;
  int flag_value = 0;
  int64_t int_value = 0;
  double double_value = 0;
  void *data = nullptr;
};

std::optional<PropertyValue> ValueToPropertyValue(napi_env env, napi_value value) {
  napi_valuetype type = napi_undefined;
  napi_typeof(env, value, &type);

  PropertyValue result;

  switch (type) {
    case napi_string:
      result.format = MPV_FORMAT_STRING;
      result.string_value = GetString(env, value);
      result.data = result.string_value.data();
      return result;
    case napi_boolean:
      result.format = MPV_FORMAT_FLAG;
      result.flag_value = GetBool(env, value) ? 1 : 0;
      result.data = &result.flag_value;
      return result;
    case napi_number: {
      double number = GetNumber(env, value);
      if (std::isfinite(number) && std::floor(number) == number) {
        result.format = MPV_FORMAT_INT64;
        result.int_value = static_cast<int64_t>(number);
        result.data = &result.int_value;
      } else {
        result.format = MPV_FORMAT_DOUBLE;
        result.double_value = number;
        result.data = &result.double_value;
      }
      return result;
    }
    case napi_null:
      result.format = MPV_FORMAT_NONE;
      result.data = nullptr;
      return result;
    default:
      ThrowTypeError(env, "Unsupported property value type");
      return std::nullopt;
  }
}

napi_value NodeToJs(napi_env env, const mpv_node *node);

napi_value NodeListToArray(napi_env env, const mpv_node_list *list) {
  napi_value array;
  napi_create_array_with_length(env, list ? list->num : 0, &array);

  if (!list) return array;

  for (int index = 0; index < list->num; index++) {
    napi_value item = NodeToJs(env, &list->values[index]);
    napi_set_element(env, array, index, item);
  }

  return array;
}

napi_value NodeMapToObject(napi_env env, const mpv_node_list *list) {
  napi_value object;
  napi_create_object(env, &object);

  if (!list) return object;

  for (int index = 0; index < list->num; index++) {
    napi_value item = NodeToJs(env, &list->values[index]);
    napi_set_named_property(env, object, list->keys[index], item);
  }

  return object;
}

napi_value NodeToJs(napi_env env, const mpv_node *node) {
  if (!node) {
    napi_value null_value;
    napi_get_null(env, &null_value);
    return null_value;
  }

  switch (node->format) {
    case MPV_FORMAT_NONE: {
      napi_value null_value;
      napi_get_null(env, &null_value);
      return null_value;
    }
    case MPV_FORMAT_STRING: {
      napi_value value;
      napi_create_string_utf8(env, node->u.string ? node->u.string : "", NAPI_AUTO_LENGTH, &value);
      return value;
    }
    case MPV_FORMAT_FLAG: {
      napi_value value;
      napi_get_boolean(env, node->u.flag != 0, &value);
      return value;
    }
    case MPV_FORMAT_INT64: {
      napi_value value;
      napi_create_double(env, static_cast<double>(node->u.int64), &value);
      return value;
    }
    case MPV_FORMAT_DOUBLE: {
      napi_value value;
      napi_create_double(env, node->u.double_, &value);
      return value;
    }
    case MPV_FORMAT_NODE_ARRAY:
      return NodeListToArray(env, node->u.list);
    case MPV_FORMAT_NODE_MAP:
      return NodeMapToObject(env, node->u.list);
    default: {
      napi_value null_value;
      napi_get_null(env, &null_value);
      return null_value;
    }
  }
}

void *GetOpenGLProcAddress(void *, const char *name) {
  static void *handle = dlopen(kOpenGLLibraryPath, RTLD_LAZY | RTLD_LOCAL);
  return handle ? dlsym(handle, name) : nullptr;
}

void RunOnMain(dispatch_block_t block) {
  if ([NSThread isMainThread]) {
    block();
    return;
  }
  dispatch_sync(dispatch_get_main_queue(), block);
}

@interface ShinobiMpvOpenGLView : NSOpenGLView
@property(nonatomic, assign) Player *player;
@end

class Player {
 public:
  explicit Player(NSView *host_view) : host_view_(host_view) {}

  ~Player() {
    destroy();
  }

  std::optional<std::string> initialize() {
    if (!host_view_) return ErrorString("Missing host view");

    mpv_ = mpv_create();
    if (!mpv_) return ErrorString("Failed to create libmpv instance");

    mpv_set_option_string(mpv_, "vo", "libmpv");
    mpv_set_option_string(mpv_, "hwdec", "auto-safe");
    mpv_set_option_string(mpv_, "osc", "no");
    mpv_set_option_string(mpv_, "osd-bar", "no");
    mpv_set_option_string(mpv_, "keep-open", "yes");
    mpv_set_option_string(mpv_, "cursor-autohide", "no");
    mpv_set_option_string(mpv_, "input-default-bindings", "no");
    mpv_set_option_string(mpv_, "config", "no");
    mpv_set_option_string(mpv_, "background-color", "#000000");

    int status = mpv_initialize(mpv_);
    if (status < 0) return ErrorString("mpv_initialize failed: " + MpvErrorString(status));

    std::optional<std::string> view_error = createView();
    if (view_error) return view_error;

    std::optional<std::string> render_error = createRenderContext();
    if (render_error) return render_error;

    return std::nullopt;
  }

  std::optional<std::string> loadFile(const std::string &url, std::optional<double> start_time) {
    if (!mpv_) return ErrorString("Player is not initialized");

    std::vector<std::string> parts = {"loadfile", url};
    if (start_time && *start_time > 0) {
      std::ostringstream stream;
      stream << "start=" << *start_time;
      parts.push_back("replace");
      parts.push_back(stream.str());
    }

    std::vector<const char *> args;
    args.reserve(parts.size() + 1);
    for (const std::string &part : parts) args.push_back(part.c_str());
    args.push_back(nullptr);

    int status = mpv_command_async(mpv_, 0, args.data());
    if (status < 0) return ErrorString("mpv async loadfile failed: " + MpvErrorString(status));
    return std::nullopt;
  }

  std::optional<std::string> command(const std::vector<std::string> &parts, mpv_node *result) {
    if (!mpv_) return ErrorString("Player is not initialized");

    std::vector<const char *> args;
    args.reserve(parts.size() + 1);
    for (const std::string &part : parts) args.push_back(part.c_str());
    args.push_back(nullptr);

    int status = mpv_command_ret(mpv_, args.data(), result);
    if (status < 0) return ErrorString("mpv command failed: " + MpvErrorString(status));
    return std::nullopt;
  }

  std::optional<std::string> getProperty(const std::string &name, mpv_node *result) {
    if (!mpv_) return ErrorString("Player is not initialized");
    int status = mpv_get_property(mpv_, name.c_str(), MPV_FORMAT_NODE, result);
    if (status < 0) return ErrorString("mpv get_property failed: " + MpvErrorString(status));
    return std::nullopt;
  }

  std::optional<std::string> setProperty(const std::string &name, const PropertyValue &value) {
    if (!mpv_) return ErrorString("Player is not initialized");
    int status = mpv_set_property(mpv_, name.c_str(), value.format, value.data);
    if (status < 0) return ErrorString("mpv set_property failed: " + MpvErrorString(status));
    return std::nullopt;
  }

  bool isAlive() const {
    return mpv_ != nullptr && view_ != nil;
  }

  void requestRedraw() {
    RunOnMain(^{
      if (view_) [view_ setNeedsDisplay:YES];
    });
  }

  void draw() {
    if (!render_context_ || !view_) return;

    NSOpenGLContext *context = [view_ openGLContext];
    if (!context) return;

    [context makeCurrentContext];
    NSRect backing = [view_ convertRectToBacking:view_.bounds];
    int width = std::max(1, static_cast<int>(std::round(backing.size.width)));
    int height = std::max(1, static_cast<int>(std::round(backing.size.height)));

    glViewport(0, 0, width, height);
    glClearColor(0.f, 0.f, 0.f, 1.f);
    glClear(GL_COLOR_BUFFER_BIT);

    mpv_opengl_fbo fbo = {0, width, height, 0};
    int flip = 1;
    int block_for_target_time = 0;
    mpv_render_param params[] = {
      {MPV_RENDER_PARAM_OPENGL_FBO, &fbo},
      {MPV_RENDER_PARAM_FLIP_Y, &flip},
      {MPV_RENDER_PARAM_BLOCK_FOR_TARGET_TIME, &block_for_target_time},
      {MPV_RENDER_PARAM_INVALID, nullptr},
    };

    mpv_render_context_render(render_context_, params);
    [context flushBuffer];
    mpv_render_context_report_swap(render_context_);
  }

  void destroy() {
    if (destroyed_) return;
    destroyed_ = true;

    RunOnMain(^{
      if (render_context_) {
        mpv_render_context_set_update_callback(render_context_, nullptr, nullptr);
        mpv_render_context_free(render_context_);
        render_context_ = nullptr;
      }

      if (view_) {
        view_.player = nullptr;
        [view_ removeFromSuperview];
        view_ = nil;
      }
    });

    if (mpv_) {
      mpv_terminate_destroy(mpv_);
      mpv_ = nullptr;
    }
  }

 private:
  std::optional<std::string> createView() {
    __block std::optional<std::string> error;

    RunOnMain(^{
      if (!host_view_) {
        error = ErrorString("Missing host view");
        return;
      }

      NSOpenGLPixelFormatAttribute attributes[] = {
        NSOpenGLPFAOpenGLProfile, NSOpenGLProfileVersion3_2Core,
        NSOpenGLPFAColorSize, 24,
        NSOpenGLPFAAlphaSize, 8,
        NSOpenGLPFADoubleBuffer,
        NSOpenGLPFAAccelerated,
        0,
      };

      NSOpenGLPixelFormat *format = [[NSOpenGLPixelFormat alloc] initWithAttributes:attributes];
      if (!format) {
        error = ErrorString("Failed to create OpenGL pixel format");
        return;
      }

      view_ = [[ShinobiMpvOpenGLView alloc] initWithFrame:host_view_.bounds pixelFormat:format];
      if (!view_) {
        error = ErrorString("Failed to create OpenGL view");
        return;
      }

      view_.player = this;
      view_.autoresizingMask = NSViewWidthSizable | NSViewHeightSizable;
      view_.wantsBestResolutionOpenGLSurface = YES;
      [host_view_ addSubview:view_];
    });

    return error;
  }

  std::optional<std::string> createRenderContext() {
    __block std::optional<std::string> error;

    RunOnMain(^{
      if (!view_) {
        error = ErrorString("OpenGL view was not created");
        return;
      }

      NSOpenGLContext *context = [view_ openGLContext];
      if (!context) {
        error = ErrorString("OpenGL context is unavailable");
        return;
      }

      [context makeCurrentContext];

      mpv_opengl_init_params gl_init_params = {
        .get_proc_address = GetOpenGLProcAddress,
        .get_proc_address_ctx = nullptr,
      };

      mpv_render_param render_params[] = {
        {MPV_RENDER_PARAM_API_TYPE, const_cast<char *>(MPV_RENDER_API_TYPE_OPENGL)},
        {MPV_RENDER_PARAM_OPENGL_INIT_PARAMS, &gl_init_params},
        {MPV_RENDER_PARAM_INVALID, nullptr},
      };

      int status = mpv_render_context_create(&render_context_, mpv_, render_params);
      if (status < 0) {
        error = ErrorString("mpv_render_context_create failed: " + MpvErrorString(status));
        return;
      }

      mpv_render_context_set_update_callback(render_context_, &Player::OnMpvUpdate, this);
    });

    return error;
  }

  static void OnMpvUpdate(void *context) {
    Player *player = static_cast<Player *>(context);
    if (!player) return;
    player->requestRedraw();
  }

  NSView *host_view_ = nil;
  ShinobiMpvOpenGLView *view_ = nil;
  mpv_handle *mpv_ = nullptr;
  mpv_render_context *render_context_ = nullptr;
  bool destroyed_ = false;
};

@implementation ShinobiMpvOpenGLView

- (BOOL)isOpaque {
  return YES;
}

- (void)drawRect:(NSRect)dirtyRect {
  [super drawRect:dirtyRect];
  if (self.player) self.player->draw();
}

@end

Player *RequirePlayer(napi_env env, int32_t player_id) {
  std::lock_guard<std::mutex> lock(g_players_mutex);
  auto found = g_players.find(player_id);
  if (found == g_players.end()) {
    ThrowError(env, "Unknown libmpv player id");
    return nullptr;
  }
  return found->second.get();
}

bool ParsePlayerId(napi_env env, napi_value value, int32_t *result) {
  napi_status status = napi_get_value_int32(env, value, result);
  if (status != napi_ok) {
    ThrowTypeError(env, "Expected player id");
    return false;
  }
  return true;
}

napi_value CreatePlayer(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
  if (argc != 1) {
    ThrowTypeError(env, "createPlayer(handle) expects one argument");
    return nullptr;
  }

  std::string handle_string = GetString(env, argv[0]);
  uintptr_t handle_value = static_cast<uintptr_t>(std::stoull(handle_string));
  NSView *host_view = (__bridge NSView *)reinterpret_cast<void *>(handle_value);
  if (!host_view) {
    ThrowError(env, "Invalid macOS native window handle");
    return nullptr;
  }

  auto player = std::make_unique<Player>(host_view);
  if (std::optional<std::string> error = player->initialize()) {
    ThrowError(env, *error);
    return nullptr;
  }

  int32_t player_id;
  {
    std::lock_guard<std::mutex> lock(g_players_mutex);
    player_id = g_next_player_id++;
    g_players.emplace(player_id, std::move(player));
  }

  napi_value result;
  napi_create_int32(env, player_id, &result);
  return result;
}

napi_value LoadFile(napi_env env, napi_callback_info info) {
  size_t argc = 3;
  napi_value argv[3];
  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
  if (argc < 2) {
    ThrowTypeError(env, "loadFile(playerId, url, startTime?) expects at least two arguments");
    return nullptr;
  }

  int32_t player_id = 0;
  if (!ParsePlayerId(env, argv[0], &player_id)) return nullptr;

  Player *player = RequirePlayer(env, player_id);
  if (!player) return nullptr;

  std::string url = GetString(env, argv[1]);
  std::optional<double> start_time;
  if (argc >= 3) {
    napi_valuetype type = napi_undefined;
    napi_typeof(env, argv[2], &type);
    if (type != napi_undefined && type != napi_null) {
      start_time = GetNumber(env, argv[2]);
    }
  }

  if (std::optional<std::string> error = player->loadFile(url, start_time)) {
    ThrowError(env, *error);
    return nullptr;
  }

  napi_value result;
  napi_get_undefined(env, &result);
  return result;
}

napi_value Command(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value argv[2];
  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
  if (argc != 2) {
    ThrowTypeError(env, "command(playerId, args) expects two arguments");
    return nullptr;
  }

  int32_t player_id = 0;
  if (!ParsePlayerId(env, argv[0], &player_id)) return nullptr;

  Player *player = RequirePlayer(env, player_id);
  if (!player) return nullptr;

  std::vector<std::string> parts = ValueToCommandParts(env, argv[1]);
  bool pending = false;
  napi_is_exception_pending(env, &pending);
  if (pending) return nullptr;

  mpv_node result_node;
  if (std::optional<std::string> error = player->command(parts, &result_node)) {
    ThrowError(env, *error);
    return nullptr;
  }

  napi_value result = NodeToJs(env, &result_node);
  mpv_free_node_contents(&result_node);
  return result;
}

napi_value GetProperty(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value argv[2];
  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
  if (argc != 2) {
    ThrowTypeError(env, "getProperty(playerId, name) expects two arguments");
    return nullptr;
  }

  int32_t player_id = 0;
  if (!ParsePlayerId(env, argv[0], &player_id)) return nullptr;

  Player *player = RequirePlayer(env, player_id);
  if (!player) return nullptr;

  std::string name = GetString(env, argv[1]);
  mpv_node result_node;
  if (std::optional<std::string> error = player->getProperty(name, &result_node)) {
    ThrowError(env, *error);
    return nullptr;
  }

  napi_value result = NodeToJs(env, &result_node);
  mpv_free_node_contents(&result_node);
  return result;
}

napi_value SetProperty(napi_env env, napi_callback_info info) {
  size_t argc = 3;
  napi_value argv[3];
  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
  if (argc != 3) {
    ThrowTypeError(env, "setProperty(playerId, name, value) expects three arguments");
    return nullptr;
  }

  int32_t player_id = 0;
  if (!ParsePlayerId(env, argv[0], &player_id)) return nullptr;

  Player *player = RequirePlayer(env, player_id);
  if (!player) return nullptr;

  std::string name = GetString(env, argv[1]);
  std::optional<PropertyValue> property_value = ValueToPropertyValue(env, argv[2]);
  bool pending = false;
  napi_is_exception_pending(env, &pending);
  if (pending || !property_value) return nullptr;

  if (std::optional<std::string> error = player->setProperty(name, *property_value)) {
    ThrowError(env, *error);
    return nullptr;
  }

  napi_value result;
  napi_get_undefined(env, &result);
  return result;
}

napi_value DestroyPlayer(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
  if (argc != 1) {
    ThrowTypeError(env, "destroyPlayer(playerId) expects one argument");
    return nullptr;
  }

  int32_t player_id = 0;
  if (!ParsePlayerId(env, argv[0], &player_id)) return nullptr;

  std::unique_ptr<Player> player;
  {
    std::lock_guard<std::mutex> lock(g_players_mutex);
    auto found = g_players.find(player_id);
    if (found != g_players.end()) {
      player = std::move(found->second);
      g_players.erase(found);
    }
  }

  if (player) player->destroy();

  napi_value result;
  napi_get_undefined(env, &result);
  return result;
}

napi_value IsAlive(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value argv[1];
  napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);
  if (argc != 1) {
    ThrowTypeError(env, "isAlive(playerId) expects one argument");
    return nullptr;
  }

  int32_t player_id = 0;
  if (!ParsePlayerId(env, argv[0], &player_id)) return nullptr;

  Player *player = RequirePlayer(env, player_id);
  if (!player) return nullptr;

  napi_value result;
  napi_get_boolean(env, player->isAlive(), &result);
  return result;
}

napi_value Init(napi_env env, napi_value exports) {
  napi_property_descriptor descriptors[] = {
    {"createPlayer", nullptr, CreatePlayer, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"loadFile", nullptr, LoadFile, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"command", nullptr, Command, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"getProperty", nullptr, GetProperty, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"setProperty", nullptr, SetProperty, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"destroyPlayer", nullptr, DestroyPlayer, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"isAlive", nullptr, IsAlive, nullptr, nullptr, nullptr, napi_default, nullptr},
  };

  napi_define_properties(env, exports, sizeof(descriptors) / sizeof(*descriptors), descriptors);
  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Init)
