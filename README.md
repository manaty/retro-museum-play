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

The shared host and validation toolkit live in [retro-museum-sdk](https://github.com/manaty/retro-museum-sdk). Community submissions remain subject to the separate marketplace review policy. This host is configured with the six first-party releases and does not install unreviewed repositories supplied by visitors.
