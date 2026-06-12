# Customer Login + Local Ride API Reference

This file is based on the current app source in this repo.

## Base URL

The app builds requests with `getBaseUrl()` from `utils/constants.js`.

- `url_dev`: `https://fox-kinship-mournful.ngrok-free.dev`
- `url`: `https://api.c4d.smartapis.cyou`
- `url_uat`: `https://uat.api.c4d.smartapis.cyou`
- `url_sit`: `https://sit.api.c4d.smartapis.cyou`
- `url_prepod`: `https://c4d-pre-prod-1089104308138.us-central1.run.app`

In the app, requests usually go to:

- `{{baseUrl}}/api/customer/dev`

## Common Headers

Most requests use these headers through `ApiRequestUtils`:

- `Content-Type: application/json`
- `token: <session-token>`

`multipart/form-data` is only used by `postFormData()`, but I did not see it in the login or local ride flow.

## Customer Login Flow

### 1) Start session

- Screen / file: `App.js`
- Method: `GET`
- Route: `SESSION_START`
- Path: `/session/start`
- Body: none

Example:

```http
GET {{baseUrl}}/session/start
```

Expected response usage:

- App reads `response.data.sid`
- Saves it in async storage key `token`

### 2) Check device registration for the current session

- Screen / file: `App.js`
- Method: `POST`
- Route: `SESSION_CHECK_DEVICE`
- Path: `/session/check-device`

Request body:

```json
{
  "phoneNumber": "+91XXXXXXXXXX",
  "user": "CUSTOMER",
  "deviceId": "<static-device-id>",
  "deviceUniqueId": "<static-device-id>",
  "lastActiveDeviceId": "<optional-last-device-id>",
  "deviceToken": "<optional-fcm-token>"
}
```

Notes:

- `phoneNumber` comes from async storage.
- `deviceId` and `deviceUniqueId` are both set to `Utils.getStaticDeviceId()`.
- `lastActiveDeviceId` and `deviceToken` are only included when available.
- Header token is the session token from step 1.

### 3) Request OTP for customer login

- Screen / file: `screens/UserRegistration/MobileNumberVerification.js`
- Method: `POST`
- Route: `MOBILENUMBER_VERIFICATION`
- Path: `/verify`

Request body:

```json
{
  "phoneNumber": "+91XXXXXXXXXX",
  "user": "CUSTOMER",
  "deviceToken": "<fcm-token>",
  "deviceId": "<static-device-id>"
}
```

Force logout variant:

```json
{
  "phoneNumber": "+91XXXXXXXXXX",
  "user": "CUSTOMER",
  "deviceToken": "<fcm-token>",
  "deviceId": "<static-device-id>",
  "logoutAllDevices": true
}
```

Notes:

- If the backend returns `action === "LOGOUT_ALL_DEVICES"`, the app opens the force-logout modal.
- The same endpoint is also used for OTP resend from the OTP screen, with this body:

```json
{
  "phoneNumber": "+91XXXXXXXXXX",
  "user": "CUSTOMER"
}
```

### 4) Verify OTP

- Screen / file: `screens/UserRegistration/OTPVerification.js`
- Method: `POST`
- Route: `OTP_VERIFICATION`
- Path: `/otp-verify`

Request body:

```json
{
  "otp": 1234,
  "deviceToken": "<fcm-token>",
  "deviceId": "<static-device-id>"
}
```

Force logout variant:

```json
{
  "otp": 1234,
  "deviceToken": "<fcm-token>",
  "deviceId": "<static-device-id>",
  "logoutAllDevices": true
}
```

Notes:

- OTP is sent as a number in the request body.
- The request still requires the session `token` header from `GET /session/start`.
- The current backend schema requires only `otp` and `deviceToken`.
- `deviceId` is supported and can be included when available.
- `logoutAllDevices` is optional.
- `1234` only works if the backend is in test-bypass mode for that session/customer.
- `OTP_MISMATCH` means the backend rejected the session/state combination, not the JSON shape.
- On success, the app stores the customer object in async storage key `user`.
- If the backend says the customer is new, the app navigates to the personal info screen.

### 5) Register customer profile

- Screen / file: `screens/UserRegistration/PersonalInformation.js`
- Method: `POST`
- Route: `REGISTER_CUSTOMER`
- Path: `/register`

The form currently submits these user fields:

```json
{
  "firstName": "John",
  "referralCode": "OPTIONAL"
}
```

The app injects these fields before sending the request:

```json
{
  "phoneNumber": "+91XXXXXXXXXX",
  "deviceToken": "<fcm-token>",
  "ipAddress": "1.2.3.4"
}
```

Final request body shape:

```json
{
  "firstName": "John",
  "referralCode": "OPTIONAL",
  "phoneNumber": "+91XXXXXXXXXX",
  "deviceToken": "<fcm-token>",
  "ipAddress": "1.2.3.4"
}
```

### 6) Validate referral code during registration

- Screen / file: `components/PersonalInformationForm.js`
- Method: `GET`
- Route: `CUSTOMER_REFERRAL_VALIDATE`
- Path: `/validate-referral-code`

Query params:

```http
GET {{baseUrl}}/validate-referral-code?referralCode=ABC123
```

Notes:

- This is a helper validation call while typing the referral code.

### 7) Logout with pending force-logout

- Screen / file: `App.js`
- Method: `POST`
- Route: `LOGOUT`
- Path: `/logout`

Request body:

```json
{
  "deviceId": "<static-device-id>"
}
```

Notes:

- This is used when a pending force logout is detected in async storage.
- If `deviceId` is unavailable, the app may send no body.

### 8) App version check

- Screen / file: `App.js`
- Method: `GET`
- Route: `VERSION_CHECK`
- Path: `/get-current-version`

Query params:

```http
GET {{baseUrl}}/get-current-version?applicationFor=CUSTOMER
```

Notes:

- This is app bootstrap logic, not the login form itself.

## Local Ride Flow

This section covers the local ride booking flow up to driver search.

### 1) Resolve address from coordinates

- Screen / file: `screens/Booking/RidesBooking.js`
- Method: `GET`
- Route: `GET_ADDRESS`
- Path: `/get-address`

Query params:

```http
GET {{baseUrl}}/get-address?lat=12.9716&long=77.5946
```

### 2) Check distance

- Screen / file: `screens/Booking/RidesBooking.js`
- Method: `GET`
- Route: `DISTANCE_CHECKING`
- Path: `/get-distance`

Query params:

```http
GET {{baseUrl}}/get-distance?pickupLat=12.9716&pickupLong=77.5946&dropLat=12.9352&dropLong=77.6245&serviceType=RIDES
```

### 3) Check city limit

- Screen / file: `screens/Booking/RidesBooking.js`
- Method: `GET`
- Route: `CITY_LIMIT_CHECKING`
- Path: `/check-location`

Query params:

```http
GET {{baseUrl}}/check-location?pickupLat=12.9716&pickupLong=77.5946&dropLat=12.9352&dropLong=77.6245
```

### 4) Check package/zone availability

- Screen / file: `screens/Booking/RidesBooking.js`
- Method: `GET`
- Route: `PACKGES_LOCATION_BASED`
- Path: `/zone-packages`

Query params:

```http
GET {{baseUrl}}/zone-packages?serviceType=RIDES&zone=Bangalore&lat=12.9716&long=77.5946
```

### 5) Fetch rider list for "booking for someone else"

- Screen / file: `screens/Booking/RidesBooking.js`
- Method: `GET`
- Route: `GET_RIDERS`
- Path: `/riders`

Request body: none

Notes:

- Optional, only if the user opens the rider selector.

### 6) Add a new rider

- Screen / file: `screens/Booking/RidesBooking.js`
- Method: `POST`
- Route: `ADD_RIDER`
- Path: `/add-rider`

Request body:

```json
{
  "name": "Rider Name",
  "phoneNumber": "+919876543210"
}
```

### 7) Create local ride booking

- Screen / file: `screens/Booking/RidesBooking.js`
- Method: `POST`
- Route: `ADD_NEW_RIDES_BOOKING`
- Path: `/add-rides-booking`

Request body:

```json
{
  "pickupLat": 12.9716,
  "pickupLong": 77.5946,
  "pickupAddress": {
    "name": "MG Road, Bengaluru",
    "placeId": "optional-place-id"
  },
  "dropLat": 12.9352,
  "dropLong": 77.6245,
  "dropAddress": {
    "name": "Indiranagar, Bengaluru",
    "placeId": "optional-place-id"
  },
  "zone": "Bangalore",
  "riderId": 123
}
```

Notes:

- `pickupAddress` and `dropAddress` are built by `buildAddressPayload()`.
- `placeId` is included only when available.
- `riderId` is included only when the user selected a rider.
- The response returns a booking `id`, which is passed to the estimation page.

### 8) Fetch estimation details for the created booking

- Screen / file: `screens/SelectRide/RideSelectionEstimationPage.js`
- Method: `GET`
- Route: `ESTIMATION_SCREEN_DETAILS`
- Path: `/bookings/service-estimates`

Query params:

```http
GET {{baseUrl}}/bookings/service-estimates?bookingId=123
```

### 9) Confirm the ride booking

- Screen / file: `screens/SelectRide/RideSelectionEstimationPage.js`
- Method: `PUT`
- Route: `CONFIRM_BOOKING`
- Path: `/confirm-booking`

Request body:

```json
{
  "status": "CONFIRMED",
  "bookingId": 123,
  "serviceType": "RIDES",
  "carType": "Mini",
  "packageId": 55,
  "isPremiumService": true
}
```

Notes:

- `carType` is omitted if the selected option is `AUTO`.
- `packageId` is included when available.
- `isPremiumService` is included only for premium ride options.
- After success, the app navigates to `RidesDriverSearch` for RIDES.

### 10) Fetch confirmation booking details before driver search

- Screen / file: `screens/Search/RidesDriverSearch.js`
- Method: `GET`
- Route: `GET_CONFIRMATION_BOOKING_BY_ID`
- Path: `/bookingConfirmation/{bookingId}`

Example:

```http
GET {{baseUrl}}/bookingConfirmation/123
```

### 11) Search for drivers

- Screen / file: `screens/Search/RidesDriverSearch.js`
- Method: `POST`
- Route: `GET_CAB_DRIVERS`
- Path: `/assign/driver`

Request body:

```json
{
  "bookingId": 123,
  "distance": 1
}
```

Second search attempt body:

```json
{
  "bookingId": 123,
  "distance": 2
}
```

Notes:

- The app sends the first search with `distance: 1`.
- If no driver is found, it retries with `distance: 2`.
- The screen runs a second search after about 30 seconds and assigns to support after about 60 seconds if still unresolved.

### 12) Assign booking to support when no driver is available

- Screen / file: `screens/Search/RidesDriverSearch.js`
- Method: `PUT`
- Route: `ASSIGN_TO_SUPPORT`
- Path: `/change-ownership`

Request body:

```json
{
  "bookingId": 123,
  "ownership": "ASSIGNED_TO_SUPPORT"
}
```

### 13) Cancel booking from search screen

- Screen / file: `screens/Search/RidesDriverSearch.js`
- Method: `PUT`
- Route: `CANCEL_BOOKING`
- Path: `/booking-cancel`

Request body:

```json
{
  "status": "CUSTOMER_CANCELLED",
  "bookingId": 123,
  "cancelReason": "Selected Wrong Location"
}
```

## Quick Postman Order

### Login

1. `GET /session/start`
2. `POST /session/check-device`
3. `POST /verify`
4. `POST /otp-verify`
5. `POST /register` if new customer

### Local ride

1. `GET /get-address`
2. `GET /get-distance`
3. `GET /check-location`
4. `GET /zone-packages`
5. `POST /add-rides-booking`
6. `GET /bookings/service-estimates`
7. `PUT /confirm-booking`
8. `GET /bookingConfirmation/{bookingId}`
9. `POST /assign/driver`

If you want, I can also turn this into a Postman collection JSON or a Thunder Client export next.
