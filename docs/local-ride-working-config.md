# Local Ride Working Config

This file records the current `k6` customer local ride setup that successfully created a booking and showed the ride on the driver app in UAT.

## Environment

- Backend: `https://uat.api.c4d.smartapis.cyou/api/customer/dev`
- Service type: `RIDES`
- Zone: `Chennai`
- Car type: `Mini`

## Working Route Reference

- Pickup: `Sholinganallur, Chennai`
- Drop: `Egattur, Chennai`

Current `.env` values:

```env
PICKUP_LAT=12.8996
PICKUP_LONG=80.2279
DROP_LAT=12.8386
DROP_LONG=80.2306
PICKUP_ADDRESS_NAME=Sholinganallur, Chennai
DROP_ADDRESS_NAME=Egattur, Chennai
SERVICE_ZONE=Chennai
CAR_TYPE=Mini
RUN_DRIVER_ASSIGNMENT=true
DRIVER_SEARCH_DISTANCE=2
DRIVER_SEARCH_RETRY=true
DRIVER_SEARCH_RETRY_DISTANCE=3
```

## Default Logging

The script now separates summary logs from raw response dumps.

Use these defaults for normal runs:

```env
SUMMARY_LOG=true
RAW_DEBUG_LOG=false
DEBUG_LOG=false
```

Summary labels to watch:

- `booking-draft-summary`
- `estimate-summary`
- `booking-confirmation-before-assign-summary`
- `booking-confirmation-final-summary`

## Multi-Customer Safe Run

Use dedicated test numbers only. Do not reuse one customer account across many VUs when validating dispatch behavior.

Recommended smoke-to-scale path:

1. `VUS=1`, `ITERATIONS=1`
2. `VUS=5`, `ITERATIONS=5`
3. `VUS=10`, `ITERATIONS=10`

Recommended env pattern:

```env
TEST_CUSTOMER_PHONES=9900000021,9900000022,9900000023,9900000024,9900000025
TEST_CUSTOMER_NAMES=John,Wick,Roman,Sarah,Anna
VUS=5
ITERATIONS=5
LOGIN_ONLY=false
RUN_DRIVER_ASSIGNMENT=true
SUMMARY_LOG=true
RAW_DEBUG_LOG=false
```

Notes:

- Keep one phone number per VU when testing concurrent login + booking.
- If dispatch validation matters, keep the pickup/drop route fixed first and change only customer count.
- If driver matching becomes unstable, reduce concurrency and confirm whether the failure is load-related or route-related.
