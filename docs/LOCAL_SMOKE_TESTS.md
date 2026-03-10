# Realty Tunax - Local Smoke Tests

Run through this before every production deployment. All must pass locally first.

---

## Prerequisites

- Docker: postgis and redis containers running
- apps/api/.env filled in
- apps/web/.env.local filled in
- API running: cd apps/api && npm run start:dev
- Worker running: cd apps/worker && npm run start:dev
- Web running: cd apps/web && npm run dev

---

## Test 1: Environment Validation

Start the API. Check logs for:
- No "[Tunax] Environment validation failed" messages
- "[Tunax] DB CONNECT => localhost:5432/tunax schema=public user=tunax" present

Run the web build:
  cd apps/web && npm run build
Expected: no "Missing required environment variables" error in output.

---

## Test 2: Auth - Login

### Admin login

  curl -s -X POST http://localhost:3001/api/auth/login
    -H "Content-Type: application/json"
    -d '{"email":"admin@arep.local","password":"Admin123!"}'

Expected: JSON with "accessToken" field starting with "eyJ"

### Consultant login

  curl -s -X POST http://localhost:3001/api/auth/login
    -H "Content-Type: application/json"
    -d '{"email":"consultant@arep.local","password":"Consultant123!"}'

Expected: JSON with "accessToken" field

### Wrong password

  curl -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/auth/login
    -H "Content-Type: application/json"
    -d '{"email":"admin@arep.local","password":"wrong"}'

Expected: 401

---

## Test 3: Role Guards

### No token on admin route
  curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/admin/moderation
  Expected: 401

### Consultant token on admin route
  curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/admin/moderation
    -H "Authorization: Bearer CONSULTANT_TOKEN_HERE"
  Expected: 403

### Admin token on admin route
  curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/admin/moderation
    -H "Authorization: Bearer ADMIN_TOKEN_HERE"
  Expected: 200

### Internal endpoint without key
  curl -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/admin/moderation/test-id/score
  Expected: 401

### Internal endpoint with correct key
  curl -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/admin/moderation/test-id/score
    -H "x-internal-api-key: dev-internal-key-001"
    -H "Content-Type: application/json"
    -d '{"scores":{}}'
  Expected: 200 or 404 (not 401, not 403)

---

## Test 4: Public Listings

### Public list (no auth)
  curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/listings
  Expected: 200

### Create without auth
  curl -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/listings
    -H "Content-Type: application/json"
    -d '{"title":"Test"}'
  Expected: 401

---

## Test 5: S3 Presign

  curl -s -X POST http://localhost:3001/api/media/presign
    -H "Authorization: Bearer CONSULTANT_TOKEN_HERE"
    -H "Content-Type: application/json"
    -d '{"listingId":"LISTING_ID","fileName":"test.jpg","contentType":"image/jpeg","order":0}'

Expected: JSON with "uploadUrl", "publicUrl", "s3Key", "expiresIn" fields

---

## Test 6: CORS Headers

### Allowed origin
  curl -s -I -X OPTIONS http://localhost:3001/api/listings
    -H "Origin: http://localhost:3000"
    -H "Access-Control-Request-Method: GET"
  Expected header: access-control-allow-origin: http://localhost:3000

### Disallowed origin
  curl -s -I -X OPTIONS http://localhost:3001/api/listings
    -H "Origin: http://evil.example.com"
    -H "Access-Control-Request-Method: GET"
  Expected: access-control-allow-origin header absent or not "http://evil.example.com"

---

## Test 7: Security Headers on Web

  curl -s -I http://localhost:3000/

Expected headers (all must be present):
  x-content-type-options: nosniff
  x-frame-options: SAMEORIGIN
  x-xss-protection: 1; mode=block
  referrer-policy: strict-origin-when-cross-origin

---

## Test 8: Swagger Availability

### When FEATURE_SWAGGER_ENABLED=true (dev default)
  curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/docs
  Expected: 200

### When FEATURE_SWAGGER_ENABLED=false (production simulation)
  Temporarily set FEATURE_SWAGGER_ENABLED=false in apps/api/.env, restart API, then:
  curl -o /dev/null -w "%{http_code}" http://localhost:3001/api/docs
  Expected: 404

---

## Test 9: DB and Redis

  redis-cli -u redis://localhost:6379 ping
  Expected: PONG

  Check API startup logs for:
    [AREP] DB tables OK (listings, listing_locations, users present)

---

## Pass/Fail Checklist

- [ ] API starts without env validation errors
- [ ] Web builds without env validation errors
- [ ] Admin login returns accessToken
- [ ] Consultant login returns accessToken
- [ ] Wrong password returns 401
- [ ] No-token admin route returns 401
- [ ] Consultant on admin route returns 403
- [ ] Admin on admin route returns 200
- [ ] Internal endpoint without key returns 401
- [ ] Internal endpoint with correct key returns 200 or 404
- [ ] Public listings return 200 without token
- [ ] Create listing without token returns 401
- [ ] Presign returns uploadUrl (S3 connected)
- [ ] CORS allows localhost:3000
- [ ] CORS blocks unknown origins
- [ ] Security headers present on web pages
- [ ] Swagger accessible in dev, blocked when flag off
- [ ] Redis ping returns PONG
- [ ] DB tables confirmed in API logs

If any item fails: fix before deploying to production.
