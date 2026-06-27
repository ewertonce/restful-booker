const { client } = require('../support/api-client');
const { VALID_BOOKING } = require('../support/fixtures');

/**
 * Helper: send a POST /booking with some fields removed or replaced.
 */
function postBooking(overrides) {
  return client.post('/booking', { ...VALID_BOOKING, ...overrides });
}

describe('Booking field validation - POST /booking', () => {
  // ─── MISSING REQUIRED FIELDS ───────────────────────────────────────────────

  describe('Missing required top-level fields', () => {
    it('rejects a booking with no firstname', async () => {
      const { firstname, ...body } = VALID_BOOKING;
      const response = await client.post('/booking', body);

      expect(response.status).not.toBe(200);
    });

    it('rejects a booking with no lastname', async () => {
      const { lastname, ...body } = VALID_BOOKING;
      const response = await client.post('/booking', body);

      expect(response.status).not.toBe(200);
    });

    it('rejects a booking with no totalprice', async () => {
      const { totalprice, ...body } = VALID_BOOKING;
      const response = await client.post('/booking', body);

      expect(response.status).not.toBe(200);
    });

    it('rejects a booking with no depositpaid', async () => {
      const { depositpaid, ...body } = VALID_BOOKING;
      const response = await client.post('/booking', body);

      expect(response.status).not.toBe(200);
    });

    it('rejects a booking with no bookingdates object', async () => {
      const { bookingdates, ...body } = VALID_BOOKING;
      const response = await client.post('/booking', body);

      expect(response.status).not.toBe(200);
    });

    it('rejects a completely empty body', async () => {
      const response = await client.post('/booking', {});

      expect(response.status).not.toBe(200);
    });
  });

  // ─── MISSING NESTED FIELDS ─────────────────────────────────────────────────

  describe('Missing required bookingdates fields', () => {
    it('rejects a booking where checkin is missing', async () => {
      const response = await postBooking({
        bookingdates: { checkout: '2026-08-07' },
      });

      expect(response.status).not.toBe(200);
    });

    it('rejects a booking where checkout is missing', async () => {
      const response = await postBooking({
        bookingdates: { checkin: '2026-08-01' },
      });

      expect(response.status).not.toBe(200);
    });

    it('rejects a booking where bookingdates is an empty object', async () => {
      const response = await postBooking({ bookingdates: {} });

      expect(response.status).not.toBe(200);
    });
  });

  // ─── WRONG FIELD TYPES ─────────────────────────────────────────────────────

  describe('Wrong data types for required fields', () => {
    it('rejects a booking where firstname is a number', async () => {
      const response = await postBooking({ firstname: 12345 });

      // Should be rejected or at minimum not store it as-is
      if (response.status === 200) {
        expect(typeof response.data.booking.firstname).toBe('string');
      } else {
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    // BUG: The API accepts a string value for totalprice without validation.
    // This test documents current (permissive) behavior and should be updated
    // if server-side type validation is added.
    it('[API GAP] accepts totalprice as a string — no type validation enforced', async () => {
      const response = await postBooking({ totalprice: 'one hundred' });

      expect(response.status).toBe(200);
    });

    it('rejects a booking where depositpaid is a string instead of boolean', async () => {
      const response = await postBooking({ depositpaid: 'yes' });

      // The API should not accept a non-boolean for a boolean field
      if (response.status === 200) {
        expect(typeof response.data.booking.depositpaid).toBe('boolean');
      } else {
        expect(response.status).toBeGreaterThanOrEqual(400);
      }
    });

    it('rejects a booking where bookingdates is a string instead of an object', async () => {
      const response = await postBooking({ bookingdates: '2026-08-01/2026-08-07' });

      expect(response.status).not.toBe(200);
    });
  });

  // ─── DATE LOGIC VALIDATION ─────────────────────────────────────────────────
  //
  // NOTE: restful-booker does not perform date format or ordering validation.
  // The tests below document the current (permissive) API behavior.
  // They should be updated to assert non-200 responses if validation is added.

  describe('Date field validation — known API gaps', () => {
    it('[API GAP] accepts an invalid checkin date string without rejecting', async () => {
      const response = await postBooking({
        bookingdates: { checkin: 'not-a-date', checkout: '2026-08-07' },
      });

      expect(response.status).toBe(200);
    });

    it('[API GAP] accepts an invalid checkout date string without rejecting', async () => {
      const response = await postBooking({
        bookingdates: { checkin: '2026-08-01', checkout: 'not-a-date' },
      });

      expect(response.status).toBe(200);
    });

    it('[API GAP] accepts checkout date before checkin without rejecting', async () => {
      const response = await postBooking({
        bookingdates: { checkin: '2026-08-10', checkout: '2026-08-01' },
      });

      expect(response.status).toBe(200);
    });

    it('[API GAP] accepts same-day checkin and checkout (zero-night stay)', async () => {
      const response = await postBooking({
        bookingdates: { checkin: '2026-08-01', checkout: '2026-08-01' },
      });

      expect(response.status).toBe(200);
    });
  });

  // ─── BOUNDARY VALUES ───────────────────────────────────────────────────────

  describe('Boundary and edge case values', () => {
    it('accepts totalprice of zero', async () => {
      const response = await postBooking({ totalprice: 0 });

      expect(response.status).toBe(200);
    });

    it('accepts a very large totalprice', async () => {
      const response = await postBooking({ totalprice: 9999999 });

      expect(response.status).toBe(200);
      expect(response.data.booking.totalprice).toBe(9999999);
    });

    it('accepts depositpaid as false', async () => {
      const response = await postBooking({ depositpaid: false });

      expect(response.status).toBe(200);
      expect(response.data.booking.depositpaid).toBe(false);
    });

    it('accepts firstname and lastname with special characters', async () => {
      const response = await postBooking({
        firstname: "O'Brien",
        lastname: 'García-López',
      });

      expect(response.status).toBe(200);
    });

    it('accepts a very long additionalneeds string', async () => {
      const response = await postBooking({
        additionalneeds: 'A'.repeat(500),
      });

      expect(response.status).toBe(200);
    });

    it('creates a booking when additionalneeds is omitted (optional field)', async () => {
      const { additionalneeds, ...body } = VALID_BOOKING;
      const response = await client.post('/booking', body);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('bookingid');
    });
  });

  // ─── FULL UPDATE VALIDATION ────────────────────────────────────────────────

  describe('PUT /booking/:id — field validation on update', () => {
    let bookingId;
    let token;

    beforeAll(async () => {
      const authResponse = await client.post('/auth', {
        username: 'admin',
        password: 'password123',
      });
      token = authResponse.data.token;

      const bookingResponse = await client.post('/booking', VALID_BOOKING);
      bookingId = bookingResponse.data.bookingid;
    });

    it('rejects a full update with missing firstname', async () => {
      const { firstname, ...body } = VALID_BOOKING;
      const response = await client.put(`/booking/${bookingId}`, body, {
        headers: { Cookie: `token=${token}` },
      });

      expect(response.status).not.toBe(200);
    });

    it('rejects a full update with missing bookingdates', async () => {
      const { bookingdates, ...body } = VALID_BOOKING;
      const response = await client.put(`/booking/${bookingId}`, body, {
        headers: { Cookie: `token=${token}` },
      });

      expect(response.status).not.toBe(200);
    });
  });
});
