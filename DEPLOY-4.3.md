# Deploy / verification
1. Back up the current deployed Aurora 4.2 release.
2. Upload the **contents** of this ZIP to your Cloudflare deployment (do not upload the ZIP as one static asset).
3. Hard refresh, verify weather, radar, Quran, prayer, navigation, and GPS permissions.
4. Test GPS with location permission denied: there must be no second prompt/retry.
5. Test offline weather after prior online visit: stale data should show a warning, never be represented as live.
6. Check the live response headers; `_headers` may not apply in Workers static assets mode.
7. Do not enable strict CSP without first testing external sources and inline JS/CSS.
