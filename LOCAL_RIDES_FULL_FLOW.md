# Local Rides Full Flow

This document explains the local rides flow end to end, with each API, why it is used, and the payload/query params it sends.

## Flow Overview

1. Resolve or set pickup location
2. Validate pickup and drop locations
3. Check zone/package availability
4. Optionally load or add a rider for "booking for someone else"
5. Create the local ride booking
6. Load estimation details
7. Confirm the booking
8. Move to driver search
9. Poll booking confirmation and request a driver

## 1) Resolve Address From Coordinates

- Screen: `screens/Booking/RidesBooking.js`
- API: `GET /get-address`
- Route constant: `GET_ADDRESS`
- Why: Converts GPS coordinates to a readable address for pickup selection.

**Call**
```js
ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ADDRESS, {
  lat,
  long: lng,
});
```

**Query params**
```js
{
  lat,
  long
}
```

## 2) Check Ride Distance

- Screen: `screens/Booking/RidesBooking.js`
- API: `GET /get-distance`
- Route constant: `DISTANCE_CHECKING`
- Why: Verifies whether the selected pickup and drop points are valid for the ride distance rules.

**Call**
```js
ApiRequestUtils.getWithQueryParam(API_ROUTES.DISTANCE_CHECKING, {
  pickupLat: pickupLocationValue?.latitude,
  pickupLong: pickupLocationValue?.longitude,
  dropLat: dropLocationValue?.latitude,
  dropLong: dropLocationValue?.longitude,
  serviceType: "RIDES",
});
```

**Query params**
```js
{
  pickupLat,
  pickupLong,
  dropLat,
  dropLong,
  serviceType: "RIDES"
}
```

## 3) Check City Limit

- Screen: `screens/Booking/RidesBooking.js`
- API: `GET /check-location`
- Route constant: `CITY_LIMIT_CHECKING`
- Why: Ensures the selected trip falls inside the supported city or service area.

**Call**
```js
ApiRequestUtils.getWithQueryParam(API_ROUTES.CITY_LIMIT_CHECKING, {
  pickupLat: pickupLocationValue?.latitude,
  pickupLong: pickupLocationValue?.longitude,
  dropLat: dropLocationValue?.latitude,
  dropLong: dropLocationValue?.longitude,
});
```

**Query params**
```js
{
  pickupLat,
  pickupLong,
  dropLat,
  dropLong
}
```

## 4) Check Zone And Package Availability

- Screen: `screens/Booking/RidesBooking.js`
- API: `GET /zone-packages`
- Route constant: `PACKGES_LOCATION_BASED`
- Why: Detects the zone for the pickup point and checks whether local ride services are available there.

**Call**
```js
ApiRequestUtils.getWithQueryParam(API_ROUTES.PACKGES_LOCATION_BASED, {
  serviceType: "RIDES",
  zone: params?.serviceLocation,
  lat: pickupLocationValue?.latitude,
  long: pickupLocationValue?.longitude,
});
```

**Query params**
```js
{
  serviceType: "RIDES",
  zone,
  lat,
  long
}
```

## 5) Load Saved Riders

- Screen: `screens/Booking/RidesBooking.js`
- API: `GET /riders`
- Route constant: `GET_RIDERS`
- Why: Used only when the user wants to book for someone else and pick from saved riders.

**Call**
```js
ApiRequestUtils.get(API_ROUTES.GET_RIDERS);
```

**Payload**
```js
none
```

## 6) Add A New Rider

- Screen: `screens/Booking/RidesBooking.js`
- API: `POST /add-rider`
- Route constant: `ADD_RIDER`
- Why: Adds a new rider contact from the phone contacts screen.

**Call**
```js
ApiRequestUtils.post(API_ROUTES.ADD_RIDER, {
  name: contactName,
  phoneNumber: normalizedPhone,
});
```

**Payload**
```js
{
  name: string,
  phoneNumber: string
}
```

## 7) Create Local Ride Booking

- Screen: `screens/Booking/RidesBooking.js`
- API: `POST /add-rides-booking`
- Route constant: `ADD_NEW_RIDES_BOOKING`
- Why: This creates the actual local ride booking record before estimate/confirmation.

**Call**
```js
const bookingData = {
  pickupLat: pickupLocationValue.latitude,
  pickupLong: pickupLocationValue.longitude,
  pickupAddress: buildAddressPayload(
    pickupAddressValue,
    pickupAddressPlaceId,
  ),
  dropLat: dropLocationValue.latitude,
  dropLong: dropLocationValue.longitude,
  dropAddress: buildAddressPayload(
    dropAddressValue,
    dropAddressPlaceId,
  ),
  zone: zoneCheckUp,
};

if (selectedRider?.type === "RIDER" && selectedRider?.riderId) {
  bookingData.riderId = selectedRider.riderId;
}

ApiRequestUtils.post(API_ROUTES.ADD_NEW_RIDES_BOOKING, bookingData);
```

**Payload**
```js
{
  pickupLat: number,
  pickupLong: number,
  pickupAddress: {
    name: string,
    placeId?: string
  },
  dropLat: number,
  dropLong: number,
  dropAddress: {
    name: string,
    placeId?: string
  },
  zone: string,
  riderId?: number | string
}
```

### Address Payload Helper

`buildAddressPayload(name, placeId)` returns:

```js
{
  name,
  placeId?: string
}
```

## 8) Load Estimation Details

- Screen: `screens/SelectRide/RideSelectionEstimationPage.js`
- API: `GET /bookings/service-estimates`
- Route constant: `ESTIMATION_SCREEN_DETAILS`
- Why: Fetches fare/service estimates for the newly created booking.

**Call**
```js
ApiRequestUtils.getWithQueryParam(API_ROUTES.ESTIMATION_SCREEN_DETAILS, {
  bookingId,
});
```

**Query params**
```js
{
  bookingId
}
```

## 9) Confirm Booking

- Screen: `screens/SelectRide/RideSelectionEstimationPage.js`
- API: `PUT /confirm-booking`
- Route constant: `CONFIRM_BOOKING`
- Why: Confirms the selected ride option and moves the booking into confirmed state.

**Call**
```js
const reqBody = {
  status: BOOKING_STATUS.CONFIRMED,
  bookingId: bookingId,
  serviceType: requestServiceType,
  ...(requestCarType ? { carType: requestCarType } : {}),
  ...(requestPackageId ? { packageId: requestPackageId } : {}),
  ...((selectedRide?.isPremium || selectedRide?.isPremiumCab)
    ? { isPremiumService: true }
    : {}),
};

ApiRequestUtils.update(API_ROUTES.CONFIRM_BOOKING, reqBody);
```

**Payload**
```js
{
  status: "CONFIRMED",
  bookingId: number | string,
  serviceType: string,
  carType?: string,
  packageId?: number | string,
  isPremiumService?: true
}
```

**Payload rules**
- `serviceType` defaults to `"RIDES"`
- `carType` is skipped when the raw value is `AUTO`
- `packageId` is included when present
- `isPremiumService` is included only for premium rides

## 10) Load Booking Confirmation

- Screen: `screens/Search/RidesDriverSearch.js`
- API: `GET /bookingConfirmation/{bookingId}`
- Route constant: `GET_CONFIRMATION_BOOKING_BY_ID`
- Why: Reads the confirmed booking before attempting driver assignment.

**Call**
```js
ApiRequestUtils.get(API_ROUTES.GET_CONFIRMATION_BOOKING_BY_ID + '/' + bookingId);
```

**Payload**
```js
none
```

## 11) Request Driver Assignment

- Screen: `screens/Search/RidesDriverSearch.js`
- API: `POST /assign/driver`
- Route constant: `GET_CAB_DRIVERS`
- Why: Starts driver matching for the confirmed booking.

**Call**
```js
ApiRequestUtils.post(API_ROUTES.GET_CAB_DRIVERS, {
  bookingId,
  distance: searchAttemptRef.current === 1 ? 1 : 2,
});
```

**Payload**
```js
{
  bookingId: number | string,
  distance: 1 | 2
}
```

### Retry Behavior

- First attempt sends `distance: 1`
- Second attempt sends `distance: 2`
- If no driver is available, the screen can move the booking to support

## 12) Assign To Support When No Driver Is Found

- Screen: `screens/Search/RidesDriverSearch.js`
- API: `PUT /change-ownership`
- Route constant: `ASSIGN_TO_SUPPORT`
- Why: Used as a fallback when no driver is matched in time.

**Call**
```js
ApiRequestUtils.update(API_ROUTES.ASSIGN_TO_SUPPORT, {
  bookingId: route?.params?.bookingId,
  ownership: "ASSIGNED_TO_SUPPORT",
});
```

**Payload**
```js
{
  bookingId: number | string,
  ownership: "ASSIGNED_TO_SUPPORT"
}
```

## Optional Cancel Flow

- Screen: `screens/Search/RidesDriverSearch.js`
- API: `PUT /booking-cancel`
- Route constant: `CANCEL_BOOKING`
- Why: Cancels the booking from the driver search screen when the user chooses to cancel.

**Call**
```js
ApiRequestUtils.update(API_ROUTES.CANCEL_BOOKING, {
  status: "CUSTOMER_CANCELLED",
  bookingId: route?.params?.bookingId,
  cancelReason: "Selected Wrong Location",
});
```

**Payload**
```js
{
  status: "CUSTOMER_CANCELLED",
  bookingId: number | string,
  cancelReason: string
}
```

## Short Flow Summary

```text
GET /get-address
GET /get-distance
GET /check-location
GET /zone-packages
GET /riders (optional)
POST /add-rider (optional)
POST /add-rides-booking
GET /bookings/service-estimates
PUT /confirm-booking
GET /bookingConfirmation/{bookingId}
POST /assign/driver
```

## Notes

- `RidesBooking.js` handles trip setup and booking creation.
- `RideSelectionEstimationPage.js` handles booking confirmation.
- `RidesDriverSearch.js` handles driver assignment and fallback handling.
- The backend can still show `CONFIRMED` with `driverId = null` if no driver is assigned yet.
