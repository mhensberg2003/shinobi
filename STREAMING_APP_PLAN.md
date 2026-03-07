# Shinobi Streaming App Plan

## Product Goal

Build a personal streaming web app that connects to an existing seedbox and feels like a private Netflix for anime, TV shows, and movies.

Primary flow:

1. User opens the web app.
2. User finds a title through metadata sourced from AniList or TMDB.
3. User pastes a magnet link for the release they want.
4. The app adds the torrent to the seedbox via ruTorrent/rTorrent integration.
5. The app detects which media file should be played.
6. Once the file is sufficiently available, playback starts in the web app using the seedbox's direct HTTP file URL.
7. If the player is closed, the torrent remains active for 10 minutes to allow quick resume.
8. After that grace period, the app may stop or clean up the torrent according to policy.

## Product Direction

### Experience

- Desktop-first web app
- Dark-only v1
- Clean, premium, minimal UI
- Light anime styling, not full neon otaku aesthetic
- Visual direction: Vercel/YC founder polish with liquid-glass surfaces and cinematic media presentation

### UX Priorities

- Fast path from title discovery to playback
- Strong title pages for anime, shows, and movies
- Good metadata and grouping by series/season/episode
- Subtitles and audio track selection in v1
- Watch progress and continue-watching support

## Confirmed Requirements

- Seedbox exposes ruTorrent publicly behind username/password
- Seedbox files are reachable by direct HTTP URLs
- HTTP range requests are assumed available
- SFTP access is available
- Browser-playable source files are assumed for v1
- No transcoding in v1
- Metadata sources:
  - AniList for anime
  - TMDB for movies and TV
- Torrent selection in v1 is manual via magnet link
- User picks the correct file to stream if a torrent contains multiple playable files
- Desktop browser only in v1
- Must-have player controls in v1:
  - subtitles
  - audio track selection
- Subtitle support in v1:
  - `.srt`
- Auth can wait until core flow works
- Preferred stack:
  - Next.js
  - Neon Postgres if practical
- No Docker requirement for v1
- Seedbox is a separate server
- Admin views are not needed in v1

## Assumptions To Validate Early

These are the main technical unknowns and should be confirmed before implementation gets deep:

1. ruTorrent can be automated reliably
   - We need a dependable way to log in and add magnets programmatically.
   - Best case: ruTorrent exposes request endpoints we can call directly.
   - Fallback: emulate the same network requests the web UI uses.

2. rTorrent is the actual backend
   - Likely true, but still worth confirming.

3. Seedbox HTTP file URLs are directly consumable by browser video elements
   - Need to verify range requests, content types, and cross-origin behavior.

4. Media files become playable before torrent completion
   - This depends on piece order and whether the early parts of the file are downloaded in a useful sequence.
   - Sequential download behavior may need configuration or plugin support.

5. Torrent cleanup can be controlled safely
   - We need to decide whether "cleanup" means stop, remove, or remove data.
   - For safety, v1 should default to stopping or removing the torrent but not deleting downloaded files unless explicitly intended.

## Recommended Architecture

## High-Level Shape

- `Next.js` app as the main product surface
- `Postgres` on Neon for app state and metadata mapping
- Server-side integration layer for seedbox and metadata APIs
- HTML5 video-based player for direct-play media

## Core Services

### 1. Web App

Responsibilities:

- Render browse and detail pages
- Handle continue-watching and watch progress
- Provide the player shell
- Manage torrent initiation flow
- Display torrent readiness state before playback

Recommendation:

- Next.js App Router
- TypeScript
- Server actions and route handlers for integration points

### 2. Metadata Service Layer

Responsibilities:

- Search and fetch anime metadata from AniList
- Search and fetch movie/TV metadata from TMDB
- Normalize titles into a common internal shape
- Map titles to seasons, episodes, runtime, posters, backdrops, synopsis, genres

Recommendation:

- Keep raw provider IDs in database
- Use a normalized internal `media_item` model with provider-specific child fields

### 3. Seedbox Integration Layer

Responsibilities:

- Store seedbox credentials securely
- Authenticate to ruTorrent
- Add a magnet link
- Poll torrent state and file list
- Detect the playable file URL
- Schedule delayed cleanup after player exit

Recommendation:

- Implement as Next.js server-only modules
- No browser-to-seedbox direct credential handling

### 4. Playback Coordination Layer

Responsibilities:

- Decide when a torrent is "ready enough" to attempt playback
- Resolve the chosen file to a streamable URL
- Track session state while the player is open
- Start the 10-minute grace timer on exit

## Data Model Proposal

Neon Postgres is a good fit because watch history, session state, metadata references, and torrent mappings are relational and will grow quickly beyond what is comfortable in ad hoc local state.

Suggested tables:

### `users`

- `id`
- `email` or `username`
- `created_at`

Note:
- Can exist from day one even if auth is deferred.
- For early development, a single local default user can be seeded.

### `media_items`

- `id`
- `kind` (`anime`, `movie`, `show`)
- `title`
- `original_title`
- `description`
- `poster_url`
- `backdrop_url`
- `release_year`
- `provider` (`anilist`, `tmdb`)
- `provider_id`
- `created_at`
- `updated_at`

### `seasons`

- `id`
- `media_item_id`
- `season_number`
- `title`

### `episodes`

- `id`
- `media_item_id`
- `season_id`
- `episode_number`
- `title`
- `runtime_seconds`
- `thumbnail_url`
- `air_date`

### `torrent_sessions`

- `id`
- `user_id`
- `media_item_id`
- `episode_id` nullable
- `magnet_link`
- `seedbox_torrent_id`
- `status`
- `selected_file_path`
- `selected_file_url`
- `cleanup_at`
- `created_at`
- `updated_at`

### `watch_progress`

- `id`
- `user_id`
- `media_item_id`
- `episode_id` nullable
- `progress_seconds`
- `duration_seconds`
- `completed`
- `last_watched_at`

### `playback_sessions`

- `id`
- `user_id`
- `torrent_session_id`
- `started_at`
- `last_heartbeat_at`
- `closed_at`

## Functional Scope

## MVP

The smallest useful v1 should prove the full end-to-end streaming loop.

### Must-Have

- Browse/search media using AniList and TMDB
- View title detail page
- Paste magnet link for a chosen title
- Add torrent to seedbox
- Poll torrent status
- Show torrent file list
- Let user pick the correct playable file
- Start playback in browser from seedbox HTTP URL
- Support subtitle selection for basic `.srt`
- Support audio track selection when browser/player exposes it
- Track watch progress
- Continue watching row on home screen
- Keep torrent active for 10 minutes after player exit

### Explicitly Deferred

- Transcoding
- ASS subtitle rendering
- Mobile and TV-specific UI optimization
- Auto torrent search inside the app
- Full auth and multi-user
- Admin dashboard
- Automatic scan of all existing seedbox files
- Advanced cleanup automation

## Post-MVP

- Full authentication and profiles
- Auto-search torrent indexers via Jackett/Prowlarr/Torznab
- Better file auto-selection heuristics
- Anime ASS subtitle support
- Server-side transcoding fallback
- Existing library scan and import
- Quality/source/release ranking
- Mobile and TV layouts

## UX / Screen Plan

## 1. Home

Purpose:
- Personal streaming dashboard

Sections:
- Continue Watching
- Trending Anime
- Popular TV
- Popular Movies
- Recently Added by You

Design direction:
- Cinematic hero module
- Liquid-glass nav and content rails
- Dense but premium card presentation

## 2. Search / Discover

Purpose:
- Find titles from AniList and TMDB

Capabilities:
- Search by title
- Filter media type
- Open detail page

## 3. Title Detail Page

Purpose:
- Central page for metadata and play initiation

Capabilities:
- Poster/backdrop
- Synopsis, genre, release info
- Season/episode list
- Paste magnet link
- Show recent torrent session if one exists
- Resume button if progress exists

## 4. Torrent File Selection Modal

Purpose:
- Let user choose the correct file in multi-file torrents

Capabilities:
- Show file names and sizes
- Highlight likely playable files
- Ignore samples/extras by default

## 5. Playback Page

Purpose:
- Direct web playback

Capabilities:
- Video player
- Subtitle selection
- Audio track selection
- Progress sync
- Exit handling with delayed cleanup

## 6. Continue Watching / History Layer

Purpose:
- Preserve viewing state across sessions

Capabilities:
- Resume from last timestamp
- Mark complete
- Move to next episode manually in v1

## Critical Technical Decisions

## 1. Direct Play First

Reason:
- Lowest complexity
- Fastest path to proving the product
- Seedbox already exposes files over HTTP

Tradeoff:
- Some media will fail in browser due to codec/container/subtitle limitations.

Decision:
- Accept this in v1 and add transcoding later only when necessary.

## 2. Server-Side Seedbox Mediation

Reason:
- Seedbox credentials should not live in the browser
- Torrent control is app logic, not client logic

Decision:
- All ruTorrent communication should go through server-only code.

## 3. Manual Magnet Entry First

Reason:
- Removes indexer and legality complexity
- Lets us validate playback pipeline first

Decision:
- V1 should not include torrent search from public/private trackers.

## 4. Neon Postgres

Reason:
- Cleaner long-term fit than SQLite for remote app deployment and relational state
- Good fit for watch progress and media/session mapping

Tradeoff:
- Slightly more setup than SQLite

Decision:
- Use Neon unless seedbox-hosted-only constraints make network access awkward.

## Main Risks

## 1. ruTorrent Automation Fragility

Risk:
- ruTorrent may not have stable documented endpoints for the operations we need.

Mitigation:
- Inspect the UI's actual network calls first.
- Build a small adapter with isolated integration tests or recorded request fixtures.

## 2. Streaming Before Full Download

Risk:
- Torrent file may not be usable early enough for smooth playback.

Mitigation:
- Verify whether sequential download or high-priority first/last pieces can be triggered.
- If not feasible, redefine "play when ready" more conservatively in early versions.

## 3. Browser Codec Support

Risk:
- Browser playback may fail for some source files.

Mitigation:
- Start with MP4/H.264-friendly content during testing.
- Design the architecture so transcoding can slot in later.

## 4. Cross-Origin / Auth Constraints

Risk:
- Browser may not be able to fetch the seedbox file URL cleanly due to CORS or auth restrictions.

Mitigation:
- If needed, proxy stream requests through Next.js route handlers.
- Only add this if direct play from origin fails.

## 5. File Matching Complexity

Risk:
- Mapping a torrent's contents to the right movie/episode can get messy quickly.

Mitigation:
- Require manual file selection in v1.
- Add heuristics later for auto-picking.

## Implementation Plan

## Phase 0: Technical Validation

Goal:
- Prove the hard integration points before building polished UI.

Tasks:
- Confirm ruTorrent login and magnet-add flow programmatically
- Inspect torrent status/file list endpoints
- Confirm direct file playback via browser
- Confirm subtitle sidecar loading path for `.srt`
- Verify what "cleanup" can safely mean in the seedbox client

Deliverable:
- Small seedbox integration prototype or script

## Phase 1: App Skeleton

Goal:
- Set up the product foundation

Tasks:
- Initialize Next.js app
- Set up Neon Postgres
- Add schema and migrations
- Add AniList and TMDB API clients
- Create shared media models

Deliverable:
- App can browse metadata and persist state

## Phase 2: Discovery and Detail Pages

Goal:
- Build the browsing experience

Tasks:
- Home page
- Search/discover page
- Title detail page
- Episode and season presentation

Deliverable:
- User can find a title and open its detail view

## Phase 3: Torrent Session Flow

Goal:
- Connect the title page to the seedbox

Tasks:
- Magnet input UX
- Add torrent action
- Poll torrent status
- File selection modal
- Store torrent session in database

Deliverable:
- User can initiate a torrent from the app and select the stream file

## Phase 4: Playback

Goal:
- Deliver the core streaming experience

Tasks:
- Build player page
- Add subtitle handling for `.srt`
- Add audio track selection where supported
- Save watch progress
- Implement player close heartbeat and delayed cleanup timer

Deliverable:
- End-to-end stream from magnet to browser playback

## Phase 5: Polish

Goal:
- Make it feel like a real product

Tasks:
- Continue watching rail
- Resume behavior
- Better loading states
- Richer media art direction
- Better file-pick hints

Deliverable:
- Usable and visually polished desktop v1

## Recommended Technical Stack

- Frontend/App: `Next.js` + TypeScript
- Styling: `Tailwind CSS`
- UI primitives: likely `shadcn/ui` selectively, heavily customized
- Database: `Neon Postgres`
- ORM: `Drizzle` or `Prisma`
- Data fetching: native Next.js patterns
- Validation: `Zod`
- Video player: start with native HTML5 video plus a thin custom control layer

Recommendation:
- Prefer `Drizzle` for a tighter, lower-overhead schema-first setup.

## Open Questions For Build Start

These do not block planning, but they matter before coding:

1. What exact requests does ruTorrent make for:
   - login
   - add magnet
   - list torrents
   - list files
   - stop/remove torrent

2. Is direct browser playback from the seedbox origin allowed without CORS trouble?

3. Can the seedbox prioritize streaming-friendly download behavior?

4. For cleanup after 10 minutes, should the default action be:
   - stop torrent only
   - remove torrent but keep data
   - remove torrent and data

Recommended default:
- remove torrent from client but keep data

## First Build Recommendation

Before building the polished app, implement a narrow proof of concept:

1. Manually enter a magnet
2. Add it to ruTorrent
3. Poll files
4. Pick one file
5. Load the direct HTTP URL in a browser player

If this works reliably, the rest is a standard product build.

## Summary

This product should be built as a metadata-driven streaming shell around your seedbox, not as a full Plex/Jellyfin clone. The fastest route is:

- direct-play only
- manual magnet input
- manual file selection
- AniList/TMDB-powered browsing
- watch progress and continue-watching

That gives a credible v1 while keeping the hardest unknowns contained to ruTorrent automation and stream readiness.
