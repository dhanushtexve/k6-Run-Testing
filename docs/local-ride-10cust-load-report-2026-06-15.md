# Local Ride 10-Customer Load Report

Date: `2026-06-15`

Script:
- `scripts/k6/customer-local-ride.js`

Environment:
- Base backend: `https://uat.api.c4d.smartapis.cyou/api/customer/dev`
- Service type: `RIDES`
- Zone: `Chennai`
- Route: `Sholinganallur, Chennai -> Egattur, Chennai`
- Car type: `Mini`

## Test Configuration

- `VUS=10`
- `ITERATIONS=10`
- Executor: `shared-iterations`
- `DURATION=2m`

Meaning:
- 10 virtual customers were started.
- 10 total booking flows were attempted.
- The ride route was the same for all customers.

## Performance Summary

- HTTP failures: `0.00%`
- p95 response time: `864.8ms`
- Average response time: `514.87ms`
- Total HTTP requests: `117`
- Total iterations completed: `10`
- Total run time: `1m11.3s`

Interpretation:
- The backend was available throughout the run.
- The API layer stayed responsive under this small concurrent load.

## Business Outcome

- Booking creation succeeded for `1/10` attempts
- Booking creation failed for `9/10` attempts
- Check success rate overall: `92.30%`
- Check failure rate overall: `7.69%`

Interpretation:
- Most API calls were reachable and returned valid HTTP responses.
- But most customers did not complete the full booking flow successfully.
- The main failure point was booking creation.

Exact failure signature from the latest run:

- Endpoint: `POST /add-rides-booking`
- HTTP status: `200`
- Response body flag: `success=false`
- Message: `Internal Server Error`

Meaning:

- The backend accepted the request at the HTTP layer.
- The backend booking creation logic failed internally.
- This is why `http_req_failed` stayed `0.00%` while `booking created` still failed for `9/10` users.

## Successful Booking Snapshot

Observed successful booking:

- `bookingId=6352`
- Status before dispatch: `CONFIRMED`
- Status after dispatch: `REQUEST_DRIVER`
- Final status: `REQUEST_DRIVER`
- Driver assigned: `No`
- `driverId=null`
- `packageId=25`
- Estimated price: `171`

Resolved booking details:

- Pickup: `Vaikund Govardhan, Rajiv Gandhi Salai, Ezhil Nagar, Sholinganallur, Chennai, Tamil Nadu 600119, India`
- Drop: `BLOCK-C, EMAMI TEJOMAYA, Egattur, Tamil Nadu 600130, India`

Interpretation:
- One booking was created and confirmed.
- Driver search started successfully.
- Retry search also ran.
- A driver was not assigned by the end of the polling window.

## Driver Matching Observation

The successful booking summary showed:

- `driverWithinDistance=0`

Interpretation:
- The backend did not find an eligible nearby driver for this booking during the test window.
- This explains why the booking remained in `REQUEST_DRIVER` with `driverId=null`.

## Key Findings

1. The UAT backend stayed online and handled concurrent API traffic without HTTP-level failures.
2. Login, address resolution, distance check, location check, and zone/package checks were stable.
3. Booking creation is the main bottleneck under 10 concurrent customers.
4. The booking creation failure is specifically an internal backend error on `POST /add-rides-booking`, surfaced as `HTTP 200` with `success:false`.
5. The one successful booking did not get a final driver assignment during the observed window.
6. This run is a partial technical success, but not a business-flow success.

## Plain-Language Conclusion

This test shows that the server is reachable and technically healthy under a 10-customer smoke load.
However, the full local ride business journey is not reliable under this load:

- only 1 customer out of 10 got a booking created
- the other 9 customers failed with `Internal Server Error` during booking creation
- that booking still did not receive a driver assignment

So the current result is:

- API availability: `Pass`
- Booking creation reliability: `Fail`
- Driver assignment completion: `Fail`

## Recommended Next Step

Use the new summary log label added to the script:

- `booking-create-failure-summary`

That summary now shows the response message, code, and booking context for each failed booking creation attempt. In the current run, it confirmed the 9 failed bookings were rejected by the backend with `Internal Server Error`.
