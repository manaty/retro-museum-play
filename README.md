# Manaty Play

Default public room host for independently versioned Manaty game repositories, including Tanks, UNO, Kart, Monopoly, Werewolf, ZX80, Quiz, Marbble, Sketch and Chess. There is no binary puzzle. Each dependency is pinned to an immutable public commit; game implementation lives in its own repository.

```sh
npm ci
npm run build:zx80
npm start
```

Open `http://localhost:8080` or `/g/tanks`, `/g/uno`, `/g/kart`, `/g/monopoly`, `/g/werewolf-village`, `/g/zx80`. Each game page creates a room in one click. Invite phones by QR or link; no museum admin account is required.

The catalog separates **Play solo** (one-player games and games with robot opponents)
from **Play together**, with mode filters and title/description search. Solo opens
the player view on the same device, adding the public screen when required.
UNO and Chess robot packages complete missing seats automatically. The organiser
can add, remove or change each robot’s level before starting. The creator can
configure, start, pause and replay there; no second device or QR scan is needed.
Shared-screen organisers can also choose **Play on this device**. Player invitation
links retain their own identity and never carry organiser credentials.

To preview UI changes alongside a sibling `retro-museum-sdk` checkout, install its
dependencies, then run `npm run dev` here. This rebuilds and loads that local SDK;
`RETRO_MUSEUM_SDK_DIR` can select another checkout. `npm start` and production builds
keep using the immutable SDK dependency. Releasing the updated UI requires
publishing the SDK/game commits and updating their dependencies and lockfile.
To include local game checkouts, set `RETRO_MUSEUM_GAME_DIRS` to a JSON object of
game names and directories; these are rebuilt and resolved only in dev mode:

```sh
RETRO_MUSEUM_GAME_DIRS='{"uno":"../game-uno-play-bots","chess":"../game-chess-play-bots"}' npm run dev
```

Set `PUBLIC_ORIGIN` to the reachable HTTPS origin, `PORT` to the listening port, and optionally `ROOM_BUCKET` to a **private** Google Cloud Storage bucket. Without a bucket, checkpoints use `.local/rooms`. Checkpoints contain private roles, hands and player session credentials and must never be public. The host service account needs object access only to that bucket.

Deploy one room-owner instance with CPU available between requests. Independent randomly balanced replicas would split WebSocket clients into different room states. A larger deployment requires room-aware routing or separate dedicated hosts. `MAX_ROOMS` defaults to 32. Preserve the bucket between deployments. Avoid deploying over an active tournament; a server restart pauses retained games until players reconnect, while game packages are pinned to each room's version.

Players can use **Invite a player** to display a scannable QR code and copy the invitation link. The dialog also offers manual copying and an explicit system share button when supported. The invitation opens the same room with the new player's own identity; it contains no host or player credentials.

The shared host and validation toolkit live in [retro-museum-sdk](https://github.com/manaty/retro-museum-sdk). Set `CATALOG_ORIGIN` to the trusted HTTPS marketplace origin to make approved community games available at `/g/GAME_ID` automatically. The host verifies the published package hash and manifest and executes community engines in QuickJS. It never builds submitted repositories. Catalog updates are checked every minute and on requests for an unknown game. Withdrawn games stop accepting new rooms; existing rooms retain their pinned package.

Players with a single device can enable **Screen + controls**, or open their invitation with `?view=combined`. The public display and private controller stay separate: opening the personal display does not create a second player or expose private cards or roles. Turning the preview off keeps the controller connected.

Public rollout verified on 2026-09-08: host 1.2.0, Cloud Run revision `retro-museum-games-00004-zwg`, serving all traffic. A new Tanks room was created through the public page; its joined player rendered both the public game screen and private controls from `play.retro-museum.net`.

Version 1.3.0 adds `/g/quizz` and approved questionnaire activities from the marketplace. Quiz supports ranking, elimination with continued practice, and cooperative voting, with configurable question count, duration and ordering. `QUIZ_PLAYER_CAPACITY` sets its host limit (default 128, accepted 1–1000); this is an admission setting, not a measured network capacity. Other games retain their existing limits. Quiz engines receive only their own questionnaire and send private answers only to the corresponding player.

Host 1.4.0 includes Quiz 1.1.0 with indicative difficulty levels. Its organiser can set the minimum and maximum level; custom percentage mixtures are prepared in the marketplace or the museum administration. Banks may contain 1,000 questions (10 MB), with a session drawing 1–100. Existing rooms keep their pinned packages and saved question order.

## Shared room expiry (1.5.0)

After the last authenticated player or organiser disconnects, the server frees the room slot and disposes its game engine at 30 seconds. An authenticated organiser’s shared board keeps the room available, including while paused; public displays do not hold a slot open. The saved game, participant credentials and pinned package can be resumed for ten minutes from that disconnect; reconnecting a player or organiser requires a free slot. At ten minutes, the private checkpoint is deleted from the room bucket. Restarting does not renew an abandoned room’s deadline.

The public health endpoint separates active `rooms`, dormant `savedRooms`, `connectedPlayers` and `playingRooms`. The shared 32-room limit counts active slots only. Dedicated paid rooms are planned separately; there is no paid bypass in this release.

## Direct Tara quizzes

Open Tara's **Play together**, choose a practice selection and press **Play in
Retro Museum**. `/tara` receives the versioned compressed link, previews the
questions and creates an unlisted room with the selected rules. No file download,
upload, catalog submission or relabeling of Tara's CC BY-SA 4.0 content occurs.
The route is provided by the pinned `game-quizz/tara-transfer` module; SDK 1.11
pins the private package with its room instead of registering a public game.
The host's existing origin, room capacity and creation limits apply. Active rooms
retain their hash-bound package after restart.

**Use another device** opens a QR code or link for the public board or the current player’s private controls. Personal transfers are single use and expire after five minutes. The source device retains organiser controls in board-only view. Invitations remain available while paused on mobile and desktop.
