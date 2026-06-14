# RidesBooking API Flow

This file lists the APIs used from `screens/Booking/RidesBooking.js` up to driver search.

## APIs Used in `RidesBooking.js`

### 1. `GET /get-address`
Used to reverse-geocode latitude/longitude into an address.

**Call**
```js
ApiRequestUtils.getWithQueryParam(API_ROUTES.GET_ADDRESS, {
  lat,
  long: lng,
});
```

**Payload / query params**
```js
{
  lat,
  long
}
```

### 2. `GET /riders`
Used to load saved rider contacts.

**Call**
```js
ApiRequestUtils.get(API_ROUTES.GET_RIDERS);
```

**Payload**
```js
none
```

### 3. `POST /add-rider`
Used to add a new rider from the selected contact.

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

### 4. `GET /get-distance`
Used to validate ride distance.

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

**Payload / query params**
```js
{
  pickupLat,
  pickupLong,
  dropLat,
  dropLong,
  serviceType: "RIDES"
}
```

### 5. `GET /check-location`
Used for city limit validation.

**Call**
```js
ApiRequestUtils.getWithQueryParam(API_ROUTES.CITY_LIMIT_CHECKING, {
  pickupLat: pickupLocationValue?.latitude,
  pickupLong: pickupLocationValue?.longitude,
  dropLat: dropLocationValue?.latitude,
  dropLong: dropLocationValue?.longitude,
});
```

**Payload / query params**
```js
{
  pickupLat,
  pickupLong,
  dropLat,
  dropLong
}
```

### 6. `GET /zone-packages`
Used to check zone and service availability.

**Call**
```js
ApiRequestUtils.getWithQueryParam(API_ROUTES.PACKGES_LOCATION_BASED, {
  serviceType: "RIDES",
  zone: params?.serviceLocation,
  lat: pickupLocationValue?.latitude,
  long: pickupLocationValue?.longitude,
});
```

**Payload / query params**
```js
{
  serviceType: "RIDES",
  zone,
  lat,
  long
}
```

### 7. `POST /add-rides-booking`
This is the main booking creation API in `RidesBooking.js`.

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

**Final payload**
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

## Address Payload Shape

`buildAddressPayload(name, placeId)` returns:

```js
{
  name,
  placeId?: string
}
```

## Flow After Booking

`RidesBooking.js` does **not** call the driver-search API directly.

Flow:

1. `RidesBooking.js` creates the ride with `POST /add-rides-booking`
2. On success, it navigates to `RideSelectionEstimationPage`
3. That screen confirms the booking with `PUT /confirm-booking`
4. Then it navigates to `RidesDriverSearch`
5. `RidesDriverSearch` calls the driver search API

### Confirm Booking API

`screens/SelectRide/RideSelectionEstimationPage.js`

**Call**
```js
ApiRequestUtils.update(API_ROUTES.CONFIRM_BOOKING, reqBody);
```

**Payload**
```js
{
  status: BOOKING_STATUS.CONFIRMED,
  bookingId,
  serviceType: requestServiceType,
  carType?: string,
  packageId?: string,
  isPremiumService?: true
}
```

**Payload construction rules**
- `serviceType` is `selectedRide?.serviceType || "RIDES"`
- `carType` is omitted when the raw car type is `AUTO`
- `packageId` is added when present in `selectedRide` or `bookingDetails`
- `isPremiumService` is added only for premium rides

### Driver Search API

`screens/Search/RidesDriverSearch.js`

**1. `GET /bookingConfirmation/:bookingId`**
```js
ApiRequestUtils.get(API_ROUTES.GET_CONFIRMATION_BOOKING_BY_ID + '/' + bookingId);
```

**2. `POST /assign/driver`**
```js
ApiRequestUtils.post(API_ROUTES.GET_CAB_DRIVERS, {
  bookingId,
  distance: searchAttemptRef.current === 1 ? 1 : 2,
});
```

**Driver search payload**
```js
{
  bookingId,
  distance: 1 | 2
}
```

## Short Summary

- `RidesBooking.js` main booking API: `POST /add-rides-booking`
- Driver search itself happens later in `RidesDriverSearch.js`
- Driver search payload is:

```js
{
  bookingId,
  distance: 1 | 2
}
```
