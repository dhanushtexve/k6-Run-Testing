import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    local_ride_load: {
      executor: 'constant-vus',
      vus: Number(__ENV.VUS || 1000),
      duration: __ENV.DURATION || '10m',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

const BASE_URL = (__ENV.ROOTCABS_BASE_URL || __ENV.BASE_URL || '').replace(/\/+$/, '');
const PHONE = __ENV.TEST_CUSTOMER_PHONE || '9900000001';
const OTP = __ENV.TEST_CUSTOMER_OTP || '1234';

const OTP_REQUEST_PATH = __ENV.REQUEST_OTP_PATH || '/auth/customer/request-otp';
const OTP_VERIFY_PATH = __ENV.VERIFY_OTP_PATH || '/auth/customer/verify-otp';
const SEARCH_PATH = __ENV.SEARCH_PATH || '/places/search';
const LOCAL_FARE_PATH = __ENV.LOCAL_FARE_PATH || '/rides/local/fare';
const BOOKING_PATH = __ENV.BOOKING_PATH || '/rides/local/book';
const STATUS_PATH = __ENV.STATUS_PATH || '/rides/status';

function postJson(path, payload, headers = {}) {
  return http.post(`${BASE_URL}${path}`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function getToken() {
  const otpRequest = postJson(OTP_REQUEST_PATH, { phoneNumber: PHONE });
  check(otpRequest, {
    'otp request accepted': (r) => r.status === 200 || r.status === 201,
  });

  const otpVerify = postJson(OTP_VERIFY_PATH, {
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
  if (!BASE_URL) {
    throw new Error('ROOTCABS_BASE_URL or BASE_URL is required');
  }

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
