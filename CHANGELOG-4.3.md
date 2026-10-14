# Aurora 4.3 — Stability patch

- GPS: retry with approximate browser geolocation after TIMEOUT/POSITION_UNAVAILABLE, not after permission denial.
- Service Worker: network-first weather remains; cached weather can be used offline for up to 24 hours with a clearly labelled fallback. No claim of live weather. Older data is removed.
- Radar: report tile loading errors without equating missing tiles to clear skies.
- Added Cloudflare Pages `_headers` for basic hardening. **Important:** Cloudflare Workers static-asset deployments may not apply `_headers`; verify response headers after deployment. CSP is deliberately deferred until all external dependencies and inline scripts are inventoried, to avoid breaking radar/Quran.
- No changes to Quran content, prayer calculations, or navigation.
- Static JS syntax checks only. Browser, GPS device, Cloudflare header and live API tests remain required.
