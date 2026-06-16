import http from 'k6/http';
import { check, sleep } from 'k6';

const DOTENV = parseDotenv(readTextFile('../../.env'));
const API_BASE_PATH = '/api/customer/dev';

export const options = {
  scenarios: {
    local_ride_load: {
      executor: 'shared-iterations',
      vus: Number(getEnv('VUS', '1')),
      iterations: Number(getEnv('ITERATIONS', '1')),
      maxDuration: getEnv('DURATION', '10m'),
      gracefulStop: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE_HOST = getEnv('ROOTCABS_BASE_URL', getEnv('BASE_URL', '')).replace(/\/+$/, '');
const BASE_URL = BASE_HOST ? `${BASE_HOST}${API_BASE_PATH}` : '';
const OTP = getEnv('OTP_OVERRIDE', getEnv('TEST_CUSTOMER_OTP', '1234'));
const LOGIN_ONLY = String(getEnv('LOGIN_ONLY', 'false')).toLowerCase() === 'true';
const CUSTOMER_USER = getEnv('CUSTOMER_USER', 'CUSTOMER');
const CUSTOMER_PHONES = (
  getEnv(
    'TEST_CUSTOMER_PHONES',
  '919900000021,919900000022,919900000023,919900000024,919900000025,919900000026,919900000027,919900000028,919900000029,919900000030'
  )
  )
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const FORCE_LOGOUT = String(getEnv('FORCE_LOGOUT', 'false')).toLowerCase() === 'true';
const CHECK_DEVICE_BEFORE_LOGIN = String(getEnv('CHECK_DEVICE_BEFORE_LOGIN', 'false')).toLowerCase() === 'true';
const CUSTOMER_NAMES = (
  getEnv(
    'TEST_CUSTOMER_NAMES',
    'John,Wick,Roman,Sarah,Anna,David,James,Michael,Sophia,Emma',
  )
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const SESSION_START_PATH = getEnv('SESSION_START_PATH', '/session/start');
const SESSION_CHECK_DEVICE_PATH = getEnv('SESSION_CHECK_DEVICE_PATH', '/session/check-device');
const SESSION_TOKEN_OVERRIDE = getEnv('SESSION_TOKEN_OVERRIDE', '');
const OTP_REQUEST_PATH = getEnv('REQUEST_OTP_PATH', '/verify');
const OTP_VERIFY_PATH = getEnv('VERIFY_OTP_PATH', '/otp-verify');
const REGISTER_CUSTOMER_PATH = getEnv('REGISTER_CUSTOMER_PATH', '/register');
const GET_ADDRESS_PATH = getEnv('GET_ADDRESS_PATH', '/get-address');
const GET_RIDERS_PATH = getEnv('GET_RIDERS_PATH', '/riders');
const ADD_RIDER_PATH = getEnv('ADD_RIDER_PATH', '/add-rider');
const GET_DISTANCE_PATH = getEnv('GET_DISTANCE_PATH', '/get-distance');
const CHECK_LOCATION_PATH = getEnv('CHECK_LOCATION_PATH', '/check-location');
const ZONE_PACKAGES_PATH = getEnv('ZONE_PACKAGES_PATH', '/zone-packages');
const ADD_RIDES_BOOKING_PATH = getEnv('ADD_RIDES_BOOKING_PATH', '/add-rides-booking');
const ESTIMATION_DETAILS_PATH = getEnv('ESTIMATION_DETAILS_PATH', '/bookings/service-estimates');
const CONFIRM_BOOKING_PATH = getEnv('CONFIRM_BOOKING_PATH', '/confirm-booking');
const BOOKING_CONFIRMATION_PATH = getEnv('BOOKING_CONFIRMATION_PATH', '/bookingConfirmation');
const ASSIGN_DRIVER_PATH = getEnv('ASSIGN_DRIVER_PATH', '/assign/driver');
const RUN_DRIVER_ASSIGNMENT = String(getEnv('RUN_DRIVER_ASSIGNMENT', 'false')).toLowerCase() === 'true';
const ASSIGN_TO_SUPPORT_PATH = getEnv('ASSIGN_TO_SUPPORT_PATH', '/change-ownership');
const CANCEL_BOOKING_PATH = getEnv('CANCEL_BOOKING_PATH', '/booking-cancel');
const SERVICE_TYPE = getEnv('SERVICE_TYPE', 'RIDES');
// Use the backend's canonical zone label casing by default.
const SERVICE_ZONE = getEnv('SERVICE_ZONE', 'Chennai');
const PICKUP_LAT = Number(getEnv('PICKUP_LAT', '12.9716'));
const PICKUP_LONG = Number(getEnv('PICKUP_LONG', '80.2433'));
const DROP_LAT = Number(getEnv('DROP_LAT', '12.9815'));
const DROP_LONG = Number(getEnv('DROP_LONG', '80.2519'));
const PICKUP_ADDRESS_NAME = getEnv('PICKUP_ADDRESS_NAME', 'Perungudi, Chennai');
const PICKUP_ADDRESS_PLACE_ID = getEnv('PICKUP_ADDRESS_PLACE_ID', '');
const DROP_ADDRESS_NAME = getEnv('DROP_ADDRESS_NAME', 'Thoraipakkam, Chennai');
const DROP_ADDRESS_PLACE_ID = getEnv('DROP_ADDRESS_PLACE_ID', '');
const RIDER_ID = getEnv('RIDER_ID', '');
const ADD_RIDER = String(getEnv('ADD_RIDER', 'false')).toLowerCase() === 'true';
const RIDER_NAME = getEnv('RIDER_NAME', 'Test Rider');
const RIDER_PHONE = getEnv('RIDER_PHONE', '');
const DRIVER_SEARCH_DISTANCE = Number(getEnv('DRIVER_SEARCH_DISTANCE', '1'));
const BOOKING_STATUS = getEnv('BOOKING_STATUS', 'CONFIRMED');
const CAR_TYPE = getEnv('CAR_TYPE', 'Mini');
const PACKAGE_ID = getEnv('PACKAGE_ID', '');
const IS_PREMIUM_SERVICE = String(getEnv('IS_PREMIUM_SERVICE', 'false')).toLowerCase() === 'true';
const CUSTOMER_IP_ADDRESS = getEnv('CUSTOMER_IP_ADDRESS', '1.2.3.4');
const REFERRAL_CODE = getEnv('REFERRAL_CODE', '');
const DRIVER_SEARCH_RETRY = String(getEnv('DRIVER_SEARCH_RETRY', 'true')).toLowerCase() === 'true';
const DRIVER_SEARCH_RETRY_DISTANCE = Number(getEnv('DRIVER_SEARCH_RETRY_DISTANCE', '2'));
const DRIVER_SEARCH_RETRY_DELAY_MS = Number(getEnv('DRIVER_SEARCH_RETRY_DELAY_MS', '30000'));
const DRIVER_ASSIGNMENT_POLL_ATTEMPTS = Number(getEnv('DRIVER_ASSIGNMENT_POLL_ATTEMPTS', '10'));
const DRIVER_ASSIGNMENT_POLL_INTERVAL_MS = Number(getEnv('DRIVER_ASSIGNMENT_POLL_INTERVAL_MS', '5000'));
const ASSIGN_TO_SUPPORT_IF_UNRESOLVED = String(getEnv('ASSIGN_TO_SUPPORT_IF_UNRESOLVED', 'false')).toLowerCase() === 'true';
const ASSIGN_TO_SUPPORT_DELAY_MS = Number(getEnv('ASSIGN_TO_SUPPORT_DELAY_MS', '60000'));
const CANCEL_BOOKING_AFTER_SEARCH = String(getEnv('CANCEL_BOOKING_AFTER_SEARCH', 'false')).toLowerCase() === 'true';
const CANCEL_REASON = getEnv('CANCEL_REASON', 'Selected Wrong Location');
const BOOKING_CREATION_STAGGER_SECONDS = Number(getEnv('BOOKING_CREATION_STAGGER_SECONDS', '0'));
const USE_FORWARDED_IP_HEADERS = String(getEnv('USE_FORWARDED_IP_HEADERS', 'false')).toLowerCase() === 'true';
const FORWARDED_IP_BASE = getEnv('FORWARDED_IP_BASE', '10.10.10');
const FORWARDED_IP_START = Number(getEnv('FORWARDED_IP_START', '21'));
const SUMMARY_LOG = String(getEnv('SUMMARY_LOG', 'true')).toLowerCase() === 'true';
const RAW_DEBUG_LOG = String(getEnv('RAW_DEBUG_LOG', getEnv('DEBUG_LOG', 'false'))).toLowerCase() === 'true';

function postJson(path, payload, headers = {}) {
  return http.post(`${BASE_URL}${path}`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
  });
}

function putJson(path, payload, headers = {}) {
  return http.put(`${BASE_URL}${path}`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
  });
}

function getWithQuery(path, query, headers = {}) {
  const queryString = Object.entries(query)
    .filter(([, value]) => value !== '' && value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  const url = queryString ? `${BASE_URL}${path}?${queryString}` : `${BASE_URL}${path}`;

  return http.get(url, {
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  });
}

function isSuccessfulResponse(response, allowedStatuses = [200]) {
  if (!allowedStatuses.includes(response.status)) {
    return false;
  }

  const body = safeJson(response);
  if (!body || typeof body !== 'object') {
    return true;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'success')) {
    return body.success !== false;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'code')) {
    return Number(body.code) < 400;
  }

  return true;
}

function safeJson(response) {
  try {
    return response.json();
  } catch (error) {
    return null;
  }
}

function debugResponse(label, response) {
  if (!RAW_DEBUG_LOG) {
    return;
  }

  const body = safeJson(response);
  const bodyText = body ? JSON.stringify(body) : response.body;
  console.log(`[${label}] status=${response.status} body=${bodyText}`);
}

function startSession(phoneNumber, deviceContext, forwardedIp) {
  if (SESSION_TOKEN_OVERRIDE) {
    if (RAW_DEBUG_LOG) {
      console.log(`[session-start] using override sid=${SESSION_TOKEN_OVERRIDE}`);
    }
    return SESSION_TOKEN_OVERRIDE;
  }

  const sessionStartRes = http.get(`${BASE_URL}${SESSION_START_PATH}`, {
    headers: {
      Accept: 'application/json',
      ...getForwardedHeaders(forwardedIp),
    },
  });
  debugResponse('session-start', sessionStartRes);
  check(sessionStartRes, {
    'session start ok': (r) => isSuccessfulResponse(r, [200]),
  });

  const sessionStartBody = safeJson(sessionStartRes) || {};
  const sid =
    sessionStartBody.data?.sid ||
    sessionStartBody.sid ||
    sessionStartBody.data?.token ||
    sessionStartBody.token ||
    '';

  if (CHECK_DEVICE_BEFORE_LOGIN) {
    const sessionHeaders = getTokenHeaders(sid, forwardedIp);
    const checkDeviceRes = postJson(
      SESSION_CHECK_DEVICE_PATH,
      {
        phoneNumber: `+91${phoneNumber}`,
        user: CUSTOMER_USER,
        deviceId: deviceContext.deviceId,
        deviceUniqueId: deviceContext.deviceUniqueId,
        ...(deviceContext.lastActiveDeviceId ? { lastActiveDeviceId: deviceContext.lastActiveDeviceId } : {}),
        ...(deviceContext.deviceToken ? { deviceToken: deviceContext.deviceToken } : {}),
      },
      sessionHeaders,
    );
    check(checkDeviceRes, {
      'check device ok': (r) => isSuccessfulResponse(r, [200]),
    });
  }

  return sid;
}

function loginCustomer() {
  const customerProfile = getCustomerProfile();
  const phoneNumber = customerProfile.phoneNumber;
  const deviceContext = getDeviceContext(phoneNumber);
  const forwardedIp = getForwardedIp(__VU);
  // The OTP verify call depends on the session token returned here.
  const sid = startSession(phoneNumber, deviceContext, forwardedIp);
  const sessionHeaders = getTokenHeaders(sid, forwardedIp);

  if (RAW_DEBUG_LOG) {
    console.log(
      `[login] vu=${__VU} phone=${phoneNumber} sid=${sid} deviceId=${deviceContext.deviceId} deviceToken=${deviceContext.deviceToken}`,
    );
  }
  logForwardedIpSummary('forwarded-ip-summary', {
    vu: __VU,
    phoneNumber,
    forwardedIp,
  });

  const otpRequest = postJson(OTP_REQUEST_PATH, {
    phoneNumber: `+91${phoneNumber}`,
    user: CUSTOMER_USER,
    deviceToken: deviceContext.deviceToken,
    deviceId: deviceContext.deviceId,
    ...(FORCE_LOGOUT ? { logoutAllDevices: true } : {}),
  }, sessionHeaders);
  debugResponse('verify', otpRequest);
  check(otpRequest, {
    'otp request accepted': (r) => isSuccessfulResponse(r, [200, 201]),
  });

  let otpVerify = postJson(OTP_VERIFY_PATH, {
    otp: Number(OTP),
    deviceToken: deviceContext.deviceToken,
    ...(deviceContext.deviceId ? { deviceId: deviceContext.deviceId } : {}),
    ...(FORCE_LOGOUT ? { logoutAllDevices: true } : {}),
  }, sessionHeaders);
  debugResponse('otp-verify', otpVerify);

  let body = safeJson(otpVerify) || {};
  if (shouldRetryOtpWithLogoutAllDevices(body)) {
    if (RAW_DEBUG_LOG) {
      console.log(`[otp-verify] retrying with logoutAllDevices=true for phone=${phoneNumber}`);
    }

    otpVerify = postJson(OTP_VERIFY_PATH, {
      otp: Number(OTP),
      deviceToken: deviceContext.deviceToken,
      ...(deviceContext.deviceId ? { deviceId: deviceContext.deviceId } : {}),
      logoutAllDevices: true,
    }, sessionHeaders);
    debugResponse('otp-verify-retry', otpVerify);
    body = safeJson(otpVerify) || {};
  }

  check(otpVerify, {
    'otp verified': (r) => isSuccessfulResponse(r, [200]),
  });

  if (RAW_DEBUG_LOG) {
    console.log(`[otp-verify-body] ${JSON.stringify(body)}`);
  }
  const otpVerified = isSuccessfulResponse(otpVerify, [200]);
  if (body.success === true && shouldRegisterCustomer(body)) {
    const registerRes = postJson(
      REGISTER_CUSTOMER_PATH,
      {
        firstName: customerProfile.firstName,
        ...(REFERRAL_CODE ? { referralCode: REFERRAL_CODE } : {}),
        phoneNumber: `+91${phoneNumber}`,
        deviceToken: deviceContext.deviceToken,
        ipAddress: CUSTOMER_IP_ADDRESS,
      },
      sessionHeaders,
    );
    debugResponse('register', registerRes);
    check(registerRes, {
      'register customer ok': (r) => isSuccessfulResponse(r, [200, 201]),
    });
  }

  const loginComplete = otpVerified;
  return {
    sid,
    token: loginComplete
      ? (body.token || body.accessToken || body.data?.token || body.data?.accessToken || sid)
      : '',
    loginComplete,
  };
}

export default function () {
  if (!BASE_HOST) {
    throw new Error('ROOTCABS_BASE_URL or BASE_URL is required');
  }

  if (!session.loginComplete) {
    const loginState = loginCustomer();
    session.sid = loginState.sid;
    session.token = loginState.token;
    session.loginComplete = loginState.loginComplete;
  }

  const token = session.token;
  check(token, { 'token exists': (value) => !!value });
  if (!token) {
    sleep(1);
    return;
  }

  if (LOGIN_ONLY) {
    sleep(1);
    return;
  }

  const authHeaders = getTokenHeaders(token);

  const pickupAddressRes = getWithQuery(
    GET_ADDRESS_PATH,
    { lat: PICKUP_LAT, long: PICKUP_LONG },
    authHeaders,
  );
  debugResponse('pickup-address', pickupAddressRes);
  check(pickupAddressRes, {
    'pickup address ok': (r) => isSuccessfulResponse(r, [200]),
  });

  const dropAddressRes = getWithQuery(
    GET_ADDRESS_PATH,
    { lat: DROP_LAT, long: DROP_LONG },
    authHeaders,
  );
  debugResponse('drop-address', dropAddressRes);
  check(dropAddressRes, {
    'drop address ok': (r) => isSuccessfulResponse(r, [200]),
  });

  const ridersRes = http.get(`${BASE_URL}${GET_RIDERS_PATH}`, {
    headers: authHeaders,
  });
  check(ridersRes, {
    'riders ok': (r) => isSuccessfulResponse(r, [200]),
  });

  let selectedRiderId = RIDER_ID;
  if (ADD_RIDER && RIDER_PHONE) {
    const addRiderRes = postJson(
      ADD_RIDER_PATH,
      {
        name: RIDER_NAME,
        phoneNumber: RIDER_PHONE,
      },
      authHeaders,
    );
    check(addRiderRes, {
      'add rider ok': (r) => isSuccessfulResponse(r, [200, 201]),
    });

    const riderBody = safeJson(addRiderRes) || {};
    selectedRiderId =
      riderBody.riderId ||
      riderBody.data?.riderId ||
      riderBody.data?.id ||
      selectedRiderId;
  }

  const distanceRes = getWithQuery(
    GET_DISTANCE_PATH,
    {
      pickupLat: PICKUP_LAT,
      pickupLong: PICKUP_LONG,
      dropLat: DROP_LAT,
      dropLong: DROP_LONG,
      serviceType: SERVICE_TYPE,
    },
    authHeaders,
  );
  debugResponse('distance', distanceRes);
  check(distanceRes, {
    'distance ok': (r) => isSuccessfulResponse(r, [200]),
  });

  const locationRes = getWithQuery(
    CHECK_LOCATION_PATH,
    {
      pickupLat: PICKUP_LAT,
      pickupLong: PICKUP_LONG,
      dropLat: DROP_LAT,
      dropLong: DROP_LONG,
    },
    authHeaders,
  );
  debugResponse('check-location', locationRes);
  check(locationRes, {
    'location ok': (r) => isSuccessfulResponse(r, [200]),
  });

  const zoneRes = getWithQuery(
    ZONE_PACKAGES_PATH,
    {
      serviceType: SERVICE_TYPE,
      zone: SERVICE_ZONE,
      lat: PICKUP_LAT,
      long: PICKUP_LONG,
    },
    authHeaders,
  );
  debugResponse('zone-packages', zoneRes);
  check(zoneRes, {
    'zone packages ok': (r) => isSuccessfulResponse(r, [200]),
  });

  const pickupAddressPayload = resolveAddressPayload(
    pickupAddressRes,
    PICKUP_ADDRESS_NAME,
    PICKUP_ADDRESS_PLACE_ID,
  );
  const dropAddressPayload = resolveAddressPayload(
    dropAddressRes,
    DROP_ADDRESS_NAME,
    DROP_ADDRESS_PLACE_ID,
  );
  const bookingZone = resolveBookingZone(zoneRes, SERVICE_ZONE);
  logBookingDraftSummary('booking-draft-summary', {
    serviceType: SERVICE_TYPE,
    zone: bookingZone,
    pickupLat: PICKUP_LAT,
    pickupLong: PICKUP_LONG,
    dropLat: DROP_LAT,
    dropLong: DROP_LONG,
    pickupAddress: pickupAddressPayload,
    dropAddress: dropAddressPayload,
    riderId: selectedRiderId || null,
  });

  const bookingPayload = {
    pickupLat: PICKUP_LAT,
    pickupLong: PICKUP_LONG,
    pickupAddress: pickupAddressPayload,
    dropLat: DROP_LAT,
    dropLong: DROP_LONG,
    dropAddress: dropAddressPayload,
    zone: bookingZone,
  };
  if (selectedRiderId) {
    bookingPayload.riderId = selectedRiderId;
  }

  if (RAW_DEBUG_LOG) {
    console.log(`[add-rides-booking-request] ${JSON.stringify(bookingPayload)}`);
  }

  const bookingCreationDelaySeconds = Math.max((__VU - 1) * BOOKING_CREATION_STAGGER_SECONDS, 0);
  if (bookingCreationDelaySeconds > 0) {
    logBookingCreationDelay('booking-create-delay-summary', {
      vu: __VU,
      delaySeconds: bookingCreationDelaySeconds,
    });
    sleep(bookingCreationDelaySeconds);
  }

  const bookRes = postJson(ADD_RIDES_BOOKING_PATH, bookingPayload, authHeaders);
  debugResponse('add-rides-booking', bookRes);
  const bookingCreated = check(bookRes, {
    'booking created': (r) => isSuccessfulResponse(r, [200, 201]),
  });

  const bookingBody = safeJson(bookRes) || {};
  if (!bookingCreated) {
    logBookingCreationFailure('booking-create-failure-summary', bookRes, {
      serviceType: SERVICE_TYPE,
      zone: bookingZone,
      pickupLat: PICKUP_LAT,
      pickupLong: PICKUP_LONG,
      dropLat: DROP_LAT,
      dropLong: DROP_LONG,
    });
  }
  const bookingId =
    bookingBody.bookingId ||
    bookingBody.data?.bookingId ||
    bookingBody.data?.id ||
    '';

  if (bookingId) {
    const estimationRes = getWithQuery(
      ESTIMATION_DETAILS_PATH,
      { bookingId },
      authHeaders,
    );
    debugResponse('service-estimates', estimationRes);
    check(estimationRes, {
      'estimation details ok': (r) => isSuccessfulResponse(r, [200]),
    });

    const estimationBody = safeJson(estimationRes) || {};
    const resolvedPackageId = resolvePackageId(bookingBody, estimationBody, PACKAGE_ID);
    logEstimateSummary('estimate-summary', estimationBody, {
      bookingId,
      zone: bookingZone,
      serviceType: SERVICE_TYPE,
      packageId: resolvedPackageId || null,
    });

    const confirmPayload = {
      status: BOOKING_STATUS,
      bookingId,
      serviceType: SERVICE_TYPE,
      ...(CAR_TYPE && CAR_TYPE.toUpperCase() !== 'AUTO' ? { carType: CAR_TYPE } : {}),
      ...(resolvedPackageId ? { packageId: Number(resolvedPackageId) || resolvedPackageId } : {}),
      ...(IS_PREMIUM_SERVICE ? { isPremiumService: true } : {}),
    };
    const confirmRes = putJson(
      CONFIRM_BOOKING_PATH,
      confirmPayload,
      authHeaders,
    );
    check(confirmRes, {
      'confirm booking ok': (r) => isSuccessfulResponse(r, [200]),
    });

    const bookingConfirmationRes = http.get(`${BASE_URL}${BOOKING_CONFIRMATION_PATH}/${bookingId}`, {
      headers: authHeaders,
    });
    debugResponse('booking-confirmation-before-assign', bookingConfirmationRes);
    logBookingStateSummary('booking-confirmation-before-assign-summary', safeJson(bookingConfirmationRes), {
      bookingId,
      stage: 'before-assign',
    });
    check(bookingConfirmationRes, {
      'booking confirmation after assign ok': (r) => isSuccessfulResponse(r, [200]),
    });

    if (RUN_DRIVER_ASSIGNMENT) {
      const assignDriverRes = postJson(
        ASSIGN_DRIVER_PATH,
        {
          bookingId,
          distance: DRIVER_SEARCH_DISTANCE,
        },
        authHeaders,
      );
      debugResponse('assign-driver', assignDriverRes);
      logAssignmentSummary('assign-driver-summary', assignDriverRes);
      check(assignDriverRes, {
        'assign driver ok': (r) => isSuccessfulResponse(r, [200, 201]),
      });

      const attemptsBeforeRetry = getPollAttemptsForWindow(DRIVER_SEARCH_RETRY_DELAY_MS);
      const firstAssignmentState = pollForDriverAssignment(
        bookingId,
        authHeaders,
        attemptsBeforeRetry,
        'booking-confirmation-after-assign',
      );
      logBookingStateSummary('booking-confirmation-after-first-dispatch-summary', firstAssignmentState.body, {
        bookingId,
        stage: 'after-first-dispatch',
      });
      check(firstAssignmentState.response, {
        'booking confirmation after first dispatch ok': (r) => isSuccessfulResponse(r, [200]),
      });

      let finalAssignmentState = firstAssignmentState;
      if (!firstAssignmentState.assigned && DRIVER_SEARCH_RETRY) {
        const retryAssignDriverRes = postJson(
          ASSIGN_DRIVER_PATH,
          {
            bookingId,
            distance: DRIVER_SEARCH_RETRY_DISTANCE,
          },
          authHeaders,
        );
        debugResponse('assign-driver-retry', retryAssignDriverRes);
        logAssignmentSummary('assign-driver-retry-summary', retryAssignDriverRes);
        check(retryAssignDriverRes, {
          'assign driver retry ok': (r) => isSuccessfulResponse(r, [200, 201]),
        });

        const attemptsAfterRetry = getPollAttemptsForWindow(
          Math.max(ASSIGN_TO_SUPPORT_DELAY_MS - DRIVER_SEARCH_RETRY_DELAY_MS, DRIVER_ASSIGNMENT_POLL_INTERVAL_MS),
        );
        finalAssignmentState = pollForDriverAssignment(
          bookingId,
          authHeaders,
          attemptsAfterRetry,
          'booking-confirmation-after-retry',
        );
        logBookingStateSummary('booking-confirmation-after-retry-summary', finalAssignmentState.body, {
          bookingId,
          stage: 'after-retry',
        });
      }

      logBookingStateSummary('booking-confirmation-final-summary', finalAssignmentState.body, {
        bookingId,
        stage: 'final',
      });
      check(finalAssignmentState.response, {
        'booking confirmation after dispatch ok': (r) => isSuccessfulResponse(r, [200]),
      });

      if (ASSIGN_TO_SUPPORT_IF_UNRESOLVED && !finalAssignmentState.assigned) {
        const assignSupportRes = putJson(
          ASSIGN_TO_SUPPORT_PATH,
          {
            bookingId,
            ownership: 'ASSIGNED_TO_SUPPORT',
          },
          authHeaders,
        );
        check(assignSupportRes, {
          'assign to support ok': (r) => isSuccessfulResponse(r, [200]),
        });
      }
    }

    if (CANCEL_BOOKING_AFTER_SEARCH) {
      const cancelBookingRes = putJson(
        CANCEL_BOOKING_PATH,
        {
          status: 'CUSTOMER_CANCELLED',
          bookingId,
          cancelReason: CANCEL_REASON,
        },
        authHeaders,
      );
      check(cancelBookingRes, {
        'cancel booking ok': (r) => isSuccessfulResponse(r, [200]),
      });
    }
  }

  sleep(1);
}

const session = {
  sid: '',
  token: '',
  loginComplete: false,
};

function getDeviceContext(phoneNumber) {
  const normalizedPhone = String(phoneNumber || '').replace(/\D/g, '');
  const deviceId = getEnv('DEVICE_ID', `k6-device-id-${normalizedPhone}`);
  const deviceToken = getEnv('DEVICE_TOKEN', `k6-device-token-${normalizedPhone}`);
  const deviceUniqueId = getEnv('DEVICE_UNIQUE_ID', deviceId);
  const lastActiveDeviceId = getEnv('LAST_ACTIVE_DEVICE_ID', '');

  return {
    deviceId,
    deviceToken,
    deviceUniqueId,
    lastActiveDeviceId,
  };
}

function buildAddressPayload(name, placeId) {
  const payload = { name };
  if (placeId) {
    payload.placeId = placeId;
  }

  return payload;
}

function resolveAddressPayload(response, fallbackName, fallbackPlaceId) {
  const body = safeJson(response) || {};
  const candidate = firstDefined(
    body.data,
    body.address,
    body.result,
  );

  if (typeof candidate === 'string' && candidate.trim()) {
    return buildAddressPayload(candidate.trim(), fallbackPlaceId);
  }

  if (candidate && typeof candidate === 'object') {
    const resolvedName = firstDefined(
      candidate.name,
      candidate.address,
      candidate.formattedAddress,
      candidate.formatted_address,
      candidate.description,
      fallbackName,
    );
    const resolvedPlaceId = firstDefined(
      candidate.placeId,
      candidate.place_id,
      fallbackPlaceId,
    );

    return buildAddressPayload(resolvedName, resolvedPlaceId);
  }

  return buildAddressPayload(fallbackName, fallbackPlaceId);
}

function resolveBookingZone(response, fallbackZone) {
  const body = safeJson(response) || {};
  const firstPackage = Array.isArray(body.data) ? body.data[0] : null;

  return firstDefined(
    body.serviceArea?.name,
    body.serviceArea?.description,
    firstPackage?.zone,
    firstPackage?.serviceArea,
    body.zone,
    fallbackZone,
  );
}

function resolvePackageId(bookingBody, estimationBody, fallbackPackageId) {
  const estimationData = estimationBody?.data;
  const estimationItem = Array.isArray(estimationData)
    ? estimationData[0]
    : Array.isArray(estimationData?.estimates)
      ? estimationData.estimates[0]
      : estimationData;

  return firstDefined(
    fallbackPackageId,
    bookingBody?.data?.packageId,
    bookingBody?.packageId,
    estimationItem?.packageId,
    estimationItem?.id,
    '',
  );
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return '';
}

function pollForDriverAssignment(bookingId, headers, attempts = DRIVER_ASSIGNMENT_POLL_ATTEMPTS, labelPrefix = 'booking-confirmation-after-assign') {
  let lastResponse = null;
  let lastBody = {};

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const response = http.get(`${BASE_URL}${BOOKING_CONFIRMATION_PATH}/${bookingId}`, {
      headers,
    });
    debugResponse(`${labelPrefix}-${attempt}`, response);

    lastResponse = response;
    lastBody = safeJson(response) || {};

    const booking = extractBookingDetails(lastBody);
    const status = booking.status || '';
    const driverId = booking.driverId || booking.DriverId || null;
    const assigned = Boolean(driverId) || isAssignedStatus(status);

    if (RAW_DEBUG_LOG) {
      console.log(
        `[driver-assignment-check] attempt=${attempt} bookingId=${bookingId} status=${status || 'UNKNOWN'} driverId=${driverId || 'null'}`,
      );
    }

    if (assigned) {
      return {
        response,
        body: lastBody,
        assigned: true,
      };
    }

    if (attempt < attempts) {
      sleep(DRIVER_ASSIGNMENT_POLL_INTERVAL_MS / 1000);
    }
  }

  return {
    response: lastResponse,
    body: lastBody,
    assigned: false,
  };
}

function getPollAttemptsForWindow(windowMs) {
  const attempts = Math.ceil(windowMs / DRIVER_ASSIGNMENT_POLL_INTERVAL_MS);
  return Math.max(attempts, 1);
}

function logAssignmentSummary(label, response) {
  if (!SUMMARY_LOG) {
    return;
  }

  const body = safeJson(response) || {};
  const booking = extractBookingDetails(body);
  const summary = {
    success: body.success,
    code: body.code,
    message: body.message || body.description || '',
    bookingId: booking.id || booking.bookingId || '',
    status: booking.status || '',
    driverId: booking.driverId || booking.DriverId || null,
    ownership: booking.ownership || '',
  };

  console.log(`[${label}] ${JSON.stringify(summary)}`);
}

function logBookingDraftSummary(label, draft) {
  if (!SUMMARY_LOG) {
    return;
  }

  console.log(`[${label}] ${JSON.stringify({
    serviceType: draft.serviceType || '',
    zone: draft.zone || '',
    pickupLat: draft.pickupLat || null,
    pickupLong: draft.pickupLong || null,
    dropLat: draft.dropLat || null,
    dropLong: draft.dropLong || null,
    pickupAddress: draft.pickupAddress?.name || '',
    dropAddress: draft.dropAddress?.name || '',
    riderId: draft.riderId || null,
  })}`);
}

function logEstimateSummary(label, estimationBody, context = {}) {
  if (!SUMMARY_LOG) {
    return;
  }

  const estimation = extractEstimationDetails(estimationBody);
  console.log(`[${label}] ${JSON.stringify({
    bookingId: context.bookingId || '',
    serviceType: context.serviceType || '',
    zone: context.zone || '',
    packageId: context.packageId || estimation.packageId || estimation.id || null,
    carType: estimation.carType || '',
    estimatedPrice: estimation.estimatedPrice || estimation.price || null,
    estimatedDistance: estimation.estimatedDistance || estimation.travelDistance || null,
    driverWithin: estimation.driverWithin || estimation.driverWithinDistance || null,
    isPrimeLocation: estimation.isPrimeLocation ?? null,
  })}`);
}

function logBookingStateSummary(label, body, context = {}) {
  if (!SUMMARY_LOG) {
    return;
  }

  const booking = extractBookingDetails(body || {});
  const estimatedFare = booking.estimatedFareBreakdown || booking.value?.fareBreakdown || {};
  console.log(`[${label}] ${JSON.stringify({
    stage: context.stage || '',
    bookingId: context.bookingId || booking.id || booking.bookingId || '',
    status: booking.status || '',
    driverId: booking.driverId || booking.DriverId || null,
    ownership: booking.ownership || '',
    zone: booking.zone || '',
    packageId: booking.packageId || booking.PackageId || null,
    carType: booking.carType || booking.value?.carType || '',
    serviceType: booking.serviceType || '',
    pickupLat: booking.pickupLat || null,
    pickupLong: booking.pickupLong || null,
    dropLat: booking.dropLat || null,
    dropLong: booking.dropLong || null,
    pickupAddress: booking.pickupAddress?.name || booking.pickupFormatAddress?.name || '',
    dropAddress: booking.dropAddress?.name || booking.dropFormatAddress?.name || '',
    driverWithinDistance: firstDefined(
      estimatedFare.driverWithinDistance,
      booking.value?.driverWithinDistance,
      booking.value?.driverWithin,
      null,
    ),
    estimatedPrice: firstDefined(
      booking.value?.estimatedPrice,
      estimatedFare.total,
      null,
    ),
  })}`);
}

function logBookingCreationFailure(label, response, context = {}) {
  if (!SUMMARY_LOG) {
    return;
  }

  const body = safeJson(response) || {};
  console.log(`[${label}] ${JSON.stringify({
    httpStatus: response.status,
    success: body.success ?? null,
    code: body.code ?? null,
    message: body.message || body.description || body.error || '',
    bookingId: body.bookingId || body.data?.bookingId || body.data?.id || '',
    serviceType: context.serviceType || '',
    zone: context.zone || '',
    pickupLat: context.pickupLat || null,
    pickupLong: context.pickupLong || null,
    dropLat: context.dropLat || null,
    dropLong: context.dropLong || null,
  })}`);
}

function logBookingCreationDelay(label, context = {}) {
  if (!SUMMARY_LOG) {
    return;
  }

  console.log(`[${label}] ${JSON.stringify({
    vu: context.vu || null,
    delaySeconds: context.delaySeconds || 0,
  })}`);
}

function extractBookingDetails(body) {
  return firstDefined(
    body?.data?.bookingDetails,
    body?.data,
    body?.bookingDetails,
    body,
    {},
  );
}

function extractEstimationDetails(body) {
  const data = body?.data;
  if (Array.isArray(data)) {
    return data[0] || {};
  }

  if (Array.isArray(data?.estimates)) {
    return data.estimates[0] || {};
  }

  return data || {};
}

function isAssignedStatus(status) {
  const normalizedStatus = String(status || '').trim().toUpperCase();
  return [
    'DRIVER_ASSIGNED',
    'ASSIGNED',
    'ALLOCATED',
    'ACCEPTED',
    'ONGOING',
    'STARTED',
  ].includes(normalizedStatus);
}

function getTokenHeaders(token, forwardedIp) {
  return {
    ...(token ? { token } : {}),
    ...getForwardedHeaders(forwardedIp),
  };
}

function getCustomerProfile() {
  const index = (__VU - 1) % CUSTOMER_PHONES.length;
  const phoneNumber = CUSTOMER_PHONES[index];
  const firstName = CUSTOMER_NAMES[index] || `Customer${index + 1}`;

  return {
    phoneNumber,
    firstName,
  };
}

function getForwardedHeaders(forwardedIp) {
  if (!USE_FORWARDED_IP_HEADERS || !forwardedIp) {
    return {};
  }

  return {
    'X-Forwarded-For': forwardedIp,
    'X-Real-IP': forwardedIp,
  };
}

function getForwardedIp(vu) {
  if (!USE_FORWARDED_IP_HEADERS) {
    return '';
  }

  const lastOctet = FORWARDED_IP_START + Math.max(vu - 1, 0);
  return `${FORWARDED_IP_BASE}.${lastOctet}`;
}

function logForwardedIpSummary(label, context = {}) {
  if (!SUMMARY_LOG || !context.forwardedIp) {
    return;
  }

  console.log(`[${label}] ${JSON.stringify({
    vu: context.vu || null,
    phoneNumber: context.phoneNumber || '',
    forwardedIp: context.forwardedIp,
  })}`);
}

function shouldRegisterCustomer(body) {
  return body.isVerified === false || body.customer?.status === 'NOT_ACTIVE';
}

function shouldRetryOtpWithLogoutAllDevices(body) {
  if (FORCE_LOGOUT) {
    return false;
  }

  return (
    Number(body?.code) === 409 ||
    body?.message === 'EXISTING_DEVICE_FOUND' ||
    body?.action === 'LOGOUT_ALL_DEVICES'
  );
}

function getEnv(key, fallback) {
  return __ENV[key] || DOTENV[key] || fallback;
}

function readTextFile(path) {
  try {
    return open(path);
  } catch (error) {
    return '';
  }
}

function parseDotenv(contents) {
  const result = {};
  if (!contents) {
    return result;
  }

  const lines = contents.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^"(.*)"$/, '$1');
    result[key] = value;
  }

  return result;
}
