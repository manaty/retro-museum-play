# Manaty's shared host

The public host runs in the Nexlink GCP project (`nexlink-a61b6`), region `asia-southeast1`, as Cloud Run service `retro-museum-games`. The collection is a separate `retro-museum-marketplace` service.

- Games: `https://play.retro-museum.net`
- Collection: `https://retro-museum.net`
- Previous game hostname remains supported: `https://retro-museum-games-482805962191.asia-southeast1.run.app`

Google-managed certificates are attached through Cloud Run domain mappings. Gandi DNS uses the records returned by those mappings. The apex has four A and four AAAA records; `play` and `www` are CNAMEs to `ghs.googlehosted.com.`. Existing mail records are preserved. Domain and certificate status can be inspected with `gcloud beta run domain-mappings describe`.

## Release

Update the immutable SDK/game dependency commits, run `npm ci --ignore-scripts` and `npm run build:zx80`, and exercise display/controller flows before deploying. Publish matching source commits and refresh the collection's version/hash metadata.

```sh
gcloud builds submit . --project nexlink-a61b6 \
  --tag asia-southeast1-docker.pkg.dev/nexlink-a61b6/cloud-run-source-deploy/retro-museum-games:VERSION
gcloud run deploy retro-museum-games --project nexlink-a61b6 \
  --region asia-southeast1 \
  --image asia-southeast1-docker.pkg.dev/nexlink-a61b6/cloud-run-source-deploy/retro-museum-games:VERSION \
  --env-vars-file cloud-run.env.yaml \
  --service-account retro-museum-play@nexlink-a61b6.iam.gserviceaccount.com \
  --cpu 1 --memory 2Gi --no-cpu-throttling \
  --min-instances 1 --max-instances 1 --concurrency 1000 --timeout 3600
```

The service account has `roles/storage.objectUser` on the private bucket `nexlink-a61b6-retro-museum-games`. It needs no general project storage access. Public access is prevented on this bucket. Cloud Run's service itself permits public browser access.

Do not replace the storage bucket between releases. It holds private room checkpoints and immutable game packages. Check for active games before deployment. Retained games resume after players reconnect; this is not a zero-downtime tournament deployment. Dedicated installations may use a different project, service and private bucket, or the filesystem store on their own server.

`PUBLIC_ORIGIN` is the primary address. `ALLOWED_ORIGINS` is a comma-separated list of prior recognised origins: invitations and browser requests stay on the hostname the visitor used, preserving their existing local player profile during migration.

`CATALOG_ORIGIN` selects the trusted publisher of approved community packages. The host fetches only its catalog and immutable package paths, verifies hashes and manifests, and refuses community native engines. The six bundled games have protected IDs. Community capacity is 64 games and 128 MiB of package source per host; a catalog outage preserves already loaded games. Withdrawal removes the game from new-room creation while existing rooms keep their archived version. A process restart restores those room archives from the same private bucket.
