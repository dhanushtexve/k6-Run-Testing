# k6 Local Ride Load Test Review

This is a line-by-line correction pass for the original `k6-local-ride-load-test.md` draft. The goal is to keep the useful intent but remove unsupported assumptions and make the document runnable against a real backend contract.

## Review

| Original area | Issue | Exact correction |
| --- | --- | --- |
| `# k6 Load Test Guide for Customer Login + Local Ride` | Title was fine but too generic for a technical spec. | Rename to `# k6 Local Ride Load Test Spec` or `# k6 Local Ride Load Test`. |
| Goal section lines 5-9 | “1000 customer logins” and “1000 local ride booking attempts” can be interpreted as separate load pools, not one combined flow. | Clarify whether you want 1000 total VUs, 1000 login attempts, or 1000 combined users executing both login and booking. |
| “k6 tests the backend APIs, not the mobile UI.” | Correct, but the explanation was repeated without tying it to the test contract. | Keep the statement, then explicitly state that the local ride flow must exist as HTTP endpoints for `k6` to test it. |
| `Current Repository Files` section | The linked files are not present in this workspace, so the section is misleading here. | Replace with a repository-agnostic “Required Files” section or remove the section entirely until those files exist. |
| API list lines 38-59 | The list is useful, but it mixes required and optional APIs without distinguishing their necessity for a first-pass test. | Keep the list, but label the first 7 items as required and the rest as optional. |
| “Recommended Test Strategy” | Good advice, but it lacked the reason for staging. | Keep it and explain that staging catches routing, payload, auth, and capacity errors before full load. |
| Install section | Fine, but `k6.exe v2.0.0` is not a stable expectation. | Remove the version example unless your environment requires a specific version. |
| `.env` section | `.env` is presented as if k6 reads it natively. It does not. | Change the wording to “environment variables you set before running k6” or mention a loader script explicitly. |
| “Current k6 Customer Login Script” | Refers to a file that does not exist in this workspace. | Make it conditional: “If `scripts/k6/customer-login.js` exists, it should do the following...” or remove the section. |
| “Current default behavior” | It describes a script that is not present, so the defaults are unverified. | Move defaults into the script itself or mark them as intended defaults only. |
| “Current Script Flow” | The flow is conceptually fine. | Keep it, but note that OTP retries, token expiration, and session reuse should be defined by the backend contract. |
| Smoke / medium / full commands | Commands are useful, but they use placeholder endpoints and assume one shared test phone number. | Keep the commands as templates and document the account/session assumptions explicitly. |
| “Load Calculation” | The calculation is incomplete because it does not compute total request volume or arrival rate. | Replace with a clearer statement: “1 VU performs 2 API calls per loop, so 1000 VUs produce sustained concurrent request pressure.” |
| Local ride flow steps | Useful, but still abstract. | Keep the sequence, then specify the exact request/response fields needed for each step. |
| Suggested local ride script | Good starting point, but endpoint paths and payloads are placeholders. | Convert it to an env-driven scaffold and mark every route as contract-dependent. |
| Example script search/fare/book calls | Missing auth headers on some calls and assumes a token for all endpoints without verifying the contract. | Pass auth consistently to every protected endpoint and confirm which endpoints are public vs protected. |
| `bookingId` extraction | Checks only a couple of common response shapes. | Expand it only after confirming the actual response schema from your backend. |
| What you need to change | Correct, but too broad. | Add a precise contract checklist: request path, method, payload fields, auth header, and success status code for each endpoint. |
| What k6 measures | Correct. | Keep as-is. |
| Simple meaning of options | Good, but `VUS` and `DURATION` are not enough to explain the traffic model. | Add a note that `constant-vus` creates sustained concurrency, not a fixed total number of requests. |
| Good starting values | Reasonable. | Keep as-is, but note that `VUS=1` is a smoke test, not a performance baseline. |
| If you get errors | Fine, but “auth headers are required or not” is awkward. | Rewrite to “confirm whether auth headers are required for each endpoint.” |
| Safety rule | Correct. | Keep as-is. |
| Recommended repo layout | Good, but it assumes files that do not exist here. | Keep the layout as a target structure and create the directories/files to match it. |
| Summary | Accurate but too dependent on unspecified backend details. | Keep the summary and add a final note that the real contract must be confirmed before the script is hardwired. |

## Concrete Corrections Applied

1. Removed the implication that the workspace already contains the referenced repo files.
2. Marked all route paths as examples unless confirmed by the backend contract.
3. Clarified that `.env` is not automatically consumed by `k6`.
4. Separated required backend APIs from optional ones.
5. Turned the sample k6 code into a script scaffold that is driven by environment variables.
6. Reframed the load model discussion so it is explicit about sustained concurrency versus arrival rate.

## Remaining Blocker

To make the script truly “fully aligned” to your real backend endpoints, I still need the actual backend contract:

- request paths
- HTTP methods
- request payloads
- response payloads
- auth header format
- status codes

Without that, any hardcoded endpoint would be a guess.
