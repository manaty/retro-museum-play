# Manaty Play

Default public room host for the six independently versioned Manaty game repositories: Tanks, UNO, Kart, Monopoly, Werewolf and ZX80. There is no binary puzzle. Each dependency is pinned to an immutable public commit; game implementation lives in its own repository.

```sh
npm ci
npm run build:zx80
npm start
```

Open `http://localhost:8080` or `/g/tanks`, `/g/uno`, `/g/kart`, `/g/monopoly`, `/g/werewolf-village`, `/g/zx80`. Each game page creates a room in one click. Invite phones by QR or link; no museum admin account is required.

Set `PUBLIC_ORIGIN` to the reachable HTTPS origin, `PORT` to the listening port, and optionally `ROOM_BUCKET` to a **private** Google Cloud Storage bucket. Without a bucket, checkpoints use `.local/rooms`. Checkpoints contain private roles, hands and player session credentials and must never be public. The host service account needs object access only to that bucket.

Deploy one room-owner instance with CPU available between requests. Independent randomly balanced replicas would split WebSocket clients into different room states. A larger deployment requires room-aware routing or separate dedicated hosts. `MAX_ROOMS` defaults to 32. Preserve the bucket between deployments. Avoid deploying over an active tournament; a server restart pauses retained games until players reconnect, while game packages are pinned to each room's version.

Players can use **Invite a player** on their phone to open the system share sheet. Browsers without native sharing offer a copyable link. The invitation opens the same room with the new player's own identity; it contains no host or player credentials.

The shared host and validation toolkit live in [retro-museum-sdk](https://github.com/manaty/retro-museum-sdk). Set `CATALOG_ORIGIN` to the trusted HTTPS marketplace origin to make approved community games available at `/g/GAME_ID` automatically. The host verifies the published package hash and manifest and executes community engines in QuickJS. It never builds submitted repositories. Catalog updates are checked every minute and on requests for an unknown game. Withdrawn games stop accepting new rooms; existing rooms retain their pinned package.

Players with a single device can enable **Screen + controls**, or open their invitation with `?view=combined`. The public display and private controller stay separate: opening the personal display does not create a second player or expose private cards or roles. Turning the preview off keeps the controller connected.

Public rollout verified on 2026-09-08: host 1.2.0, Cloud Run revision `retro-museum-games-00004-zwg`, serving all traffic. A new Tanks room was created through the public page; its joined player rendered both the public game screen and private controls from `play.retro-museum.net`.
