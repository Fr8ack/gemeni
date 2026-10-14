# Aurora 5.0 — AI chat integration

The existing v4.3 site remains intact. Added weather-ai.js and weather-ai.css, floating assistant in index.html, and bumped the service worker shell cache.

## Deploy
1. Upload the entire ZIP contents as static assets to the site Worker (not tabarjal-gemini-api).
2. Keep the Gemini secret ONLY in the separate API Worker.
3. The chat sends POST requests to https://tabarjal-gemini-api.fr8ack-s.workers.dev/api/weather-chat.
4. The API Worker currently allows only two origins: frosty-shape-ecc7 and withered-grass-08ca. Any new domain must be added to allowedOrigins on the API Worker.
5. BEFORE public launch: configure Cloudflare rate limiting and server-verified Turnstile. Origin checks alone do not secure API usage.

## Notes
- Uses approximate Tabarjal coordinates by default; does not silently access GPS.
- Existing rule-based weather analyzer remains unchanged.
- AI requests require online access and are not cached.
- Validate on a test deployment before production.
- No live browser/end-to-end tests were performed during packaging.
