# Feral Hosting qBittorrent Setup

This app now expects qBittorrent's Web API for torrent control and a separate HTTP path for streaming files.

## What Changed

- Torrent control now uses qBittorrent Web API login plus `/api/v2/...` endpoints.
- The preferred environment variables are `SEEDBOX_API_URL`, `SEEDBOX_API_USER`, and `SEEDBOX_API_PASSWORD`.
- The old `SEEDBOX_RPC_*` variables are still accepted as compatibility aliases while you migrate local config.
- File playback still depends on `SEEDBOX_HTTP_BASE_URL` pointing at a web-accessible view of the downloaded files.

## Feral Notes

Feral has a current qBittorrent install guide and documents qBittorrent as an alternative to rTorrent, Deluge, and Transmission. Their install script prints the qBittorrent URL, username, and password after setup. Use those exact values for this app instead of guessing the final Web UI path.

Practical rule:

- `SEEDBOX_API_URL` should be the qBittorrent Web UI base URL from the Feral install output.
- `SEEDBOX_API_USER` and `SEEDBOX_API_PASSWORD` should be the Web UI credentials from the same output.
- Leave `SEEDBOX_HTTP_*` pointed at whatever authenticated file-serving path actually exposes the downloaded media tree.

## Environment Shape

Start from this:

```bash
SEEDBOX_API_URL=
SEEDBOX_API_USER=
SEEDBOX_API_PASSWORD=

SEEDBOX_HTTP_BASE_URL=
SEEDBOX_HTTP_PATH_ROOT=
SEEDBOX_HTTP_USER=
SEEDBOX_HTTP_PASSWORD=
```

If you still have old local config, these aliases remain supported:

```bash
SEEDBOX_RPC_URL=
SEEDBOX_RPC_USER=
SEEDBOX_RPC_PASSWORD=
```

## Validation

Validate in this order after updating `.env.local`:

1. Start the app locally.
2. Open `/debug/seedbox`.
3. Confirm the qBittorrent client version and torrent list load.
4. Submit a test magnet from `/debug/seedbox`.
5. Open the torrent detail page and verify file listing works.
6. Select a single playable file and confirm only that file is prioritized.
7. Confirm the generated `/api/stream` URL resolves and supports seeking.

If torrent control works but playback fails, the likely issue is still `SEEDBOX_HTTP_BASE_URL` or its path mapping, not the qBittorrent API connection.
