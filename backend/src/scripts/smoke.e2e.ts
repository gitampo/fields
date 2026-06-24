type JsonValue = Record<string, unknown> | unknown[];

const API_URL = process.env.API_URL || 'http://localhost:3000';

const request = async (path: string, init: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${path}`, init);
  let body: JsonValue = {};

  try {
    body = (await response.json()) as JsonValue;
  } catch {
    body = {};
  }

  return { response, body };
};

const expectOk = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const getBodyMessage = (body: JsonValue) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return '';
  }

  const errors = (body as { errors?: unknown }).errors;
  if (Array.isArray(errors) && errors.length > 0) {
    return String(errors.join(' | '));
  }

  const message = (body as { message?: unknown }).message;
  return typeof message === 'string' ? message : '';
};

const run = async () => {
  const unique = Date.now();
  const credentials = {
    name: `Smoke User ${unique}`,
    email: `smoke.${unique}@test.local`,
    password: 'Smoke123@',
  };

  console.log(`[SMOKE] API URL: ${API_URL}`);

  const health = await request('/health');
  expectOk(health.response.ok, `[SMOKE] /health failed: ${health.response.status}`);
  console.log('[SMOKE] Health check OK');

  const register = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  expectOk(register.response.status === 201, `[SMOKE] /auth/register failed: ${register.response.status} ${getBodyMessage(register.body)}`);

  const registerToken = (register.body as { token?: unknown }).token;
  expectOk(typeof registerToken === 'string' && registerToken.length > 0, '[SMOKE] register token missing');
  console.log('[SMOKE] Register OK');

  const login = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: credentials.email, password: credentials.password }),
  });
  expectOk(login.response.status === 200, `[SMOKE] /auth/login failed: ${login.response.status} ${getBodyMessage(login.body)}`);

  const token = (login.body as { token?: unknown }).token;
  expectOk(typeof token === 'string' && token.length > 0, '[SMOKE] login token missing');
  console.log('[SMOKE] Login OK');

  const fields = await request('/fields', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  expectOk(fields.response.status === 200, `[SMOKE] /fields failed: ${fields.response.status} ${getBodyMessage(fields.body)}`);

  const fieldList = Array.isArray(fields.body) ? fields.body : [];
  console.log(`[SMOKE] Fields loaded: ${fieldList.length}`);

  const firstAvailableField = fieldList.find((item) => {
    if (!item || typeof item !== 'object') {
      return false;
    }
    return (item as { isAvailable?: unknown }).isAvailable === true && typeof (item as { id?: unknown }).id === 'string';
  }) as { id: string } | undefined;

  if (firstAvailableField) {
    const start = new Date();
    start.setHours(start.getHours() + 2, 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    const booking = await request('/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        fieldId: firstAvailableField.id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      }),
    });

    expectOk(
      booking.response.status === 201 || booking.response.status === 409,
      `[SMOKE] /bookings create failed: ${booking.response.status} ${getBodyMessage(booking.body)}`,
    );

    if (booking.response.status === 201) {
      console.log('[SMOKE] Booking creation OK');
    } else {
      console.log('[SMOKE] Booking skipped due to conflict/availability');
    }
  } else {
    console.log('[SMOKE] Booking skipped: no available fields');
  }

  const myBookings = await request('/bookings/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  expectOk(myBookings.response.status === 200, `[SMOKE] /bookings/me failed: ${myBookings.response.status} ${getBodyMessage(myBookings.body)}`);
  console.log('[SMOKE] My bookings OK');

  console.log('[SMOKE] SUCCESS: auth + fields + bookings flow passed');
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[SMOKE] FAILED: ${message}`);
  process.exit(1);
});
