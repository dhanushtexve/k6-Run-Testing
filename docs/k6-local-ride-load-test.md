# k6 Local Ride Load Test Spec

## Purpose

Define a load test for:

- 1000 customer login attempts
- 1000 local ride booking attempts
- executed concurrently against backend APIs

This document is a technical spec and implementation guide for `k6`, not a mobile UI automation guide.

## Scope

`k6` should be used for backend HTTP APIs only.

Use it for:

- OTP request
- OTP verification
- place search or autocomplete
- fare calculation or route validation
- booking creation
- booking status polling

Do not use `k6` for:

- Android UI automation
- iOS UI automation
- deep app navigation

If the local ride flow exists only in the mobile app and not as HTTP APIs, this test cannot cover the full flow.

## What Must Exist In The Backend

To support a realistic local ride test, the backend should expose:

1. OTP request API
2. OTP verify API
3. Auth token response
4. Place search or autocomplete API
5. Local fare validation API
6. Booking creation API
7. Booking status API
8. Optional driver assignment or matching API

Optional but commonly present:

- payment API
- cancel booking API
- trip status API
- rating API

## Accuracy Notes

The earlier draft of this guide contained placeholder paths and assumptions. Those are useful as examples, but they are not guaranteed to match your backend.

Use these notes to avoid false assumptions:

- `../scripts/k6/customer-login.js` and similar repository links are only valid if those files actually exist in your repo.
- `/places/search`, `/rides/local/fare`, `/rides/local/book`, and `/rides/status` are example paths, not confirmed endpoints.
- A shared phone number and shared OTP may not represent real concurrent customers if your backend enforces per-user session rules.
- `k6` does not automatically load `.env` files. Environment variables must be set by your shell, CI, or a helper script.

## Recommended Test Design

Use a staged rollout instead of going directly to 1000 VUs.

1. Smoke test with 1 VU
2. Medium test with 50 to 100 VUs
3. Full test with 1000 VUs

This lets you catch:

- wrong API paths
- invalid payloads
- auth failures
- rate limits
- backend bottlenecks

## Load Model

For your use case, `constant-vus` is a reasonable baseline if you want sustained concurrency.

Use it when:

- you want a fixed number of active users
- each virtual user performs the same sequence repeatedly
- you want to measure steady-state behavior

Consider a ramping or arrival-rate model if:

- you want to simulate users arriving over time
- you want a burst pattern
- you need a more realistic booking surge profile

## Implementation Contract

Before writing the script, confirm these items:

- base backend URL
- exact OTP request endpoint
- exact OTP verify endpoint
- request and response JSON field names
- auth header format
- booking request payload
- booking response field containing the booking ID
- status endpoint and path structure
- whether search and booking endpoints require the same token

## Suggested Environment Variables

Use environment variables instead of hardcoding values:

```env
BASE_URL=https://uat.api.c4d.smartapis.cyou
TEST_CUSTOMER_PHONE=9900000001
TEST_CUSTOMER_OTP=1234
TEST_CUSTOMER_PHONES=919900000021,919900000022,919900000023,919900000024,919900000025,919900000026,919900000027,919900000028,919900000029,919900000030
CUSTOMER_USER=CUSTOMER
FORCE_LOGOUT=false
REQUEST_OTP_PATH=/verify
VERIFY_OTP_PATH=/otp-verify
LOGIN_ONLY=true
SEARCH_PATH=/places/search
LOCAL_FARE_PATH=/rides/local/fare
BOOKING_PATH=/rides/local/book
STATUS_PATH=/rides/status
VUS=1000
DURATION=10m
SUMMARY_LOG=true
RAW_DEBUG_LOG=false
```

These are examples. Replace them with the actual backend contract.

## k6 Script Layout

Create a dedicated script such as:

- `scripts/k6/customer-local-ride.js`

Recommended structure:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    local_ride_load: {
      executor: 'shared-iterations',
      vus: Number(__ENV.VUS || 1),
      iterations: Number(__ENV.ITERATIONS || 1),
      maxDuration: __ENV.DURATION || '10m',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE_URL = (__ENV.BASE_URL || '').replace(/\/+$/, '');
const PHONE = __ENV.TEST_CUSTOMER_PHONE || '9900000001';
const OTP = __ENV.TEST_CUSTOMER_OTP || '1234';
const REQUEST_OTP_PATH = __ENV.REQUEST_OTP_PATH || '/auth/customer/request-otp';
const VERIFY_OTP_PATH = __ENV.VERIFY_OTP_PATH || '/auth/customer/verify-otp';
const SEARCH_PATH = __ENV.SEARCH_PATH || '/places/search';
const LOCAL_FARE_PATH = __ENV.LOCAL_FARE_PATH || '/rides/local/fare';
const BOOKING_PATH = __ENV.BOOKING_PATH || '/rides/local/book';
const STATUS_PATH = __ENV.STATUS_PATH || '/rides/status';
const SUMMARY_LOG = String(__ENV.SUMMARY_LOG || 'true').toLowerCase() === 'true';
const RAW_DEBUG_LOG = String(__ENV.RAW_DEBUG_LOG || 'false').toLowerCase() === 'true';

function postJson(path, payload, headers = {}) {
  return http.post(`${BASE_URL}${path}`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function getToken() {
  const otpRequest = postJson(REQUEST_OTP_PATH, { phoneNumber: PHONE });
  check(otpRequest, {
    'otp request accepted': (r) => r.status === 200 || r.status === 201,
  });

  const otpVerify = postJson(VERIFY_OTP_PATH, {
    phoneNumber: PHONE,
    otp: OTP,
  });
  check(otpVerify, {
    'otp verified': (r) => r.status === 200,
  });

  const body = otpVerify.json() || {};
  return body.token || body.accessToken || body.data?.token || '';
}

export default function () {
  const token = getToken();
  check(token, { 'token exists': (value) => !!value });

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const searchRes = http.get(`${BASE_URL}${SEARCH_PATH}?q=Perungudi`, {
    headers: authHeaders,
  });
  check(searchRes, {
    'search ok': (r) => r.status === 200,
  });

  const fareRes = postJson(
    LOCAL_FARE_PATH,
    {
      pickup: 'Current location',
      drop: 'Perungudi',
    },
    authHeaders,
  );
  check(fareRes, {
    'fare ok': (r) => r.status === 200,
  });

  const bookRes = postJson(
    BOOKING_PATH,
    {
      pickup: 'Current location',
      drop: 'Perungudi',
    },
    authHeaders,
  );
  check(bookRes, {
    'booking created': (r) => r.status === 200 || r.status === 201,
  });

  const bookingBody = bookRes.json() || {};
  const bookingId =
    bookingBody.bookingId ||
    bookingBody.data?.bookingId ||
    bookingBody.data?.id ||
    '';

  if (bookingId) {
    const statusRes = http.get(`${BASE_URL}${STATUS_PATH}/${bookingId}`, {
      headers: authHeaders,
    });
    check(statusRes, {
      'status ok': (r) => r.status === 200,
    });
  }

  sleep(1);
}
```

## How To Run

### Smoke test

```powershell
k6 run -e BASE_URL=https://uat.api.c4d.smartapis.cyou -e TEST_CUSTOMER_PHONE=9900000001 -e TEST_CUSTOMER_OTP=1234 scripts/k6/customer-local-ride.js
```

### Medium test

```powershell
k6 run -e BASE_URL=https://uat.api.c4d.smartapis.cyou -e VUS=100 -e DURATION=5m -e TEST_CUSTOMER_PHONE=9900000001 -e TEST_CUSTOMER_OTP=1234 scripts/k6/customer-local-ride.js
```

### Full test

```powershell
k6 run -e BASE_URL=https://uat.api.c4d.smartapis.cyou -e VUS=1000 -e DURATION=10m -e TEST_CUSTOMER_PHONE=9900000001 -e TEST_CUSTOMER_OTP=1234 scripts/k6/customer-local-ride.js
```

## Logging

The current script supports two log modes:

- `SUMMARY_LOG=true` for concise booking and assignment summaries
- `RAW_DEBUG_LOG=true` for full response dumps

Use summary logs by default. Enable raw debug only when you need payload-level investigation.

## What k6 Reports

During execution, `k6` provides:

- response time
- failure rate
- requests per second
- p95 latency
- HTTP status distribution
- check pass/fail counts

## Validation Checklist

Before running a large test, verify:

- `k6` is installed and on `PATH`
- `BASE_URL` points to the correct environment
- endpoints match the actual backend routes
- JSON payload field names match the API contract
- auth token format is correct
- OTP values are valid for the test environment
- test accounts are not production customer accounts

## Safety Rule

Do not use a real customer number for load testing.

Use only:

- a dedicated test customer number
- a staging number
- a controlled dummy account

## Recommended Repo Layout

```text
scripts/
  k6/
    customer-login.js
    customer-local-ride.js
docs/
  k6-local-ride-load-test.md
  k6-local-ride-load-test-review.md
```

## Bottom Line

To test 1000 concurrent login and local ride attempts, you need:

- a backend API contract you trust
- dedicated test data
- a login script
- a local ride script
- staged execution from smoke test to full load

If you want the mobile app flow tested end to end, use Appium or WebdriverIO alongside `k6`.
