const { client, getAuthToken } = require('../support/api-client');
const { VALID_BOOKING, UPDATED_BOOKING } = require('../support/fixtures');

describe('Booking CRUD', () => {
  let token;

  beforeAll(async () => {
    token = await getAuthToken();
  });

  // ─── CREATE ────────────────────────────────────────────────────────────────

  describe('POST /booking — Create', () => {
    it('returns 200 and the created booking with a numeric ID', async () => {
      const response = await client.post('/booking', VALID_BOOKING);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('bookingid');
      expect(typeof response.data.bookingid).toBe('number');
    });

    it('echoes back all submitted fields in the response body', async () => {
      const response = await client.post('/booking', VALID_BOOKING);
      const booking = response.data.booking;

      expect(booking.firstname).toBe(VALID_BOOKING.firstname);
      expect(booking.lastname).toBe(VALID_BOOKING.lastname);
      expect(booking.totalprice).toBe(VALID_BOOKING.totalprice);
      expect(booking.depositpaid).toBe(VALID_BOOKING.depositpaid);
      expect(booking.bookingdates.checkin).toBe(VALID_BOOKING.bookingdates.checkin);
      expect(booking.bookingdates.checkout).toBe(VALID_BOOKING.bookingdates.checkout);
      expect(booking.additionalneeds).toBe(VALID_BOOKING.additionalneeds);
    });

    it('creates a booking without the optional additionalneeds field', async () => {
      const { additionalneeds, ...bookingWithoutNeeds } = VALID_BOOKING;
      const response = await client.post('/booking', bookingWithoutNeeds);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('bookingid');
    });

    it('persists the booking so it appears in the full list', async () => {
      const createResponse = await client.post('/booking', VALID_BOOKING);
      const newId = createResponse.data.bookingid;

      const listResponse = await client.get('/booking');
      const ids = listResponse.data.map((b) => b.bookingid);

      expect(ids).toContain(newId);
    });
  });

  // ─── READ ──────────────────────────────────────────────────────────────────

  describe('GET /booking — List all bookings', () => {
    it('returns 200 and an array of booking ID objects', async () => {
      const response = await client.get('/booking');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
      expect(response.data[0]).toHaveProperty('bookingid');
    });

    it('filters by firstname query param', async () => {
      const uniqueName = `Filter${Date.now()}`;
      await client.post('/booking', { ...VALID_BOOKING, firstname: uniqueName });

      const response = await client.get(`/booking?firstname=${uniqueName}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('filters by lastname query param', async () => {
      const uniqueLastname = `Filter${Date.now()}`;
      await client.post('/booking', { ...VALID_BOOKING, lastname: uniqueLastname });

      const response = await client.get(`/booking?lastname=${uniqueLastname}`);

      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('filters by checkin date', async () => {
      const response = await client.get('/booking?checkin=2025-01-01');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('filters by checkout date', async () => {
      const response = await client.get('/booking?checkout=2025-12-31');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('returns an empty array (or 404) when no bookings match the filter', async () => {
      const response = await client.get('/booking?firstname=ZZZNoSuchPersonXXX');

      // API may return 200 with [] or 404
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data).toEqual([]);
      }
    });
  });

  describe('GET /booking/:id — Read single booking', () => {
    let bookingId;

    beforeAll(async () => {
      const response = await client.post('/booking', VALID_BOOKING);
      bookingId = response.data.bookingid;
    });

    it('returns 200 and the booking details', async () => {
      const response = await client.get(`/booking/${bookingId}`);

      expect(response.status).toBe(200);
    });

    it('contains all required booking fields', async () => {
      const response = await client.get(`/booking/${bookingId}`);
      const b = response.data;

      expect(b).toHaveProperty('firstname');
      expect(b).toHaveProperty('lastname');
      expect(b).toHaveProperty('totalprice');
      expect(b).toHaveProperty('depositpaid');
      expect(b).toHaveProperty('bookingdates');
      expect(b.bookingdates).toHaveProperty('checkin');
      expect(b.bookingdates).toHaveProperty('checkout');
    });

    it('returns correct field values matching what was created', async () => {
      const response = await client.get(`/booking/${bookingId}`);
      const b = response.data;

      expect(b.firstname).toBe(VALID_BOOKING.firstname);
      expect(b.lastname).toBe(VALID_BOOKING.lastname);
      expect(b.totalprice).toBe(VALID_BOOKING.totalprice);
      expect(b.depositpaid).toBe(VALID_BOOKING.depositpaid);
      expect(b.bookingdates.checkin).toBe(VALID_BOOKING.bookingdates.checkin);
      expect(b.bookingdates.checkout).toBe(VALID_BOOKING.bookingdates.checkout);
    });

    it('returns 404 for a non-existent booking ID', async () => {
      const response = await client.get('/booking/999999999');

      expect(response.status).toBe(404);
    });
  });

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  describe('PUT /booking/:id — Full update', () => {
    let bookingId;

    beforeEach(async () => {
      const response = await client.post('/booking', VALID_BOOKING);
      bookingId = response.data.bookingid;
    });

    it('returns 200 and replaces all booking fields', async () => {
      const response = await client.put(
        `/booking/${bookingId}`,
        UPDATED_BOOKING,
        { headers: { Cookie: `token=${token}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data.firstname).toBe(UPDATED_BOOKING.firstname);
      expect(response.data.lastname).toBe(UPDATED_BOOKING.lastname);
      expect(response.data.totalprice).toBe(UPDATED_BOOKING.totalprice);
      expect(response.data.depositpaid).toBe(UPDATED_BOOKING.depositpaid);
      expect(response.data.bookingdates.checkin).toBe(UPDATED_BOOKING.bookingdates.checkin);
      expect(response.data.bookingdates.checkout).toBe(UPDATED_BOOKING.bookingdates.checkout);
    });

    it('persists the update — subsequent GET returns new values', async () => {
      await client.put(`/booking/${bookingId}`, UPDATED_BOOKING, {
        headers: { Cookie: `token=${token}` },
      });

      const getResponse = await client.get(`/booking/${bookingId}`);
      expect(getResponse.data.firstname).toBe(UPDATED_BOOKING.firstname);
      expect(getResponse.data.lastname).toBe(UPDATED_BOOKING.lastname);
    });

    it('accepts Basic Auth instead of cookie token', async () => {
      const response = await client.put(
        `/booking/${bookingId}`,
        UPDATED_BOOKING,
        { headers: { Authorization: 'Basic YWRtaW46cGFzc3dvcmQxMjM=' } }
      );

      expect(response.status).toBe(200);
    });

    it('returns 403 without authentication', async () => {
      const response = await client.put(`/booking/${bookingId}`, UPDATED_BOOKING);

      expect(response.status).toBe(403);
    });

    it('returns 405 for a non-existent booking ID', async () => {
      const response = await client.put(
        '/booking/999999999',
        UPDATED_BOOKING,
        { headers: { Cookie: `token=${token}` } }
      );

      expect(response.status).toBe(405);
    });
  });

  describe('PATCH /booking/:id — Partial update', () => {
    let bookingId;

    beforeEach(async () => {
      const response = await client.post('/booking', VALID_BOOKING);
      bookingId = response.data.bookingid;
    });

    it('returns 200 when updating only firstname', async () => {
      const response = await client.patch(
        `/booking/${bookingId}`,
        { firstname: 'Patched' },
        { headers: { Cookie: `token=${token}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data.firstname).toBe('Patched');
    });

    it('leaves unpatched fields unchanged', async () => {
      await client.patch(
        `/booking/${bookingId}`,
        { firstname: 'OnlyFirst' },
        { headers: { Cookie: `token=${token}` } }
      );

      const getResponse = await client.get(`/booking/${bookingId}`);
      expect(getResponse.data.firstname).toBe('OnlyFirst');
      expect(getResponse.data.lastname).toBe(VALID_BOOKING.lastname);
      expect(getResponse.data.totalprice).toBe(VALID_BOOKING.totalprice);
    });

    it('can patch totalprice independently', async () => {
      const response = await client.patch(
        `/booking/${bookingId}`,
        { totalprice: 9999 },
        { headers: { Cookie: `token=${token}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data.totalprice).toBe(9999);
    });

    it('can patch nested bookingdates', async () => {
      const response = await client.patch(
        `/booking/${bookingId}`,
        { bookingdates: { checkin: '2027-01-01', checkout: '2027-01-10' } },
        { headers: { Cookie: `token=${token}` } }
      );

      expect(response.status).toBe(200);
      expect(response.data.bookingdates.checkin).toBe('2027-01-01');
      expect(response.data.bookingdates.checkout).toBe('2027-01-10');
    });

    it('returns 403 without authentication', async () => {
      const response = await client.patch(`/booking/${bookingId}`, {
        firstname: 'NoAuth',
      });

      expect(response.status).toBe(403);
    });
  });

  // ─── DELETE ────────────────────────────────────────────────────────────────

  describe('DELETE /booking/:id — Delete', () => {
    it('returns 201 when deleting with valid token', async () => {
      const createResponse = await client.post('/booking', VALID_BOOKING);
      const bookingId = createResponse.data.bookingid;

      const deleteResponse = await client.delete(`/booking/${bookingId}`, {
        headers: { Cookie: `token=${token}` },
      });

      // restful-booker returns 201 (not 204) on successful delete
      expect(deleteResponse.status).toBe(201);
    });

    it('the deleted booking is no longer retrievable (404)', async () => {
      const createResponse = await client.post('/booking', VALID_BOOKING);
      const bookingId = createResponse.data.bookingid;

      await client.delete(`/booking/${bookingId}`, {
        headers: { Cookie: `token=${token}` },
      });

      const getResponse = await client.get(`/booking/${bookingId}`);
      expect(getResponse.status).toBe(404);
    });

    it('deleted booking no longer appears in the full list', async () => {
      const createResponse = await client.post('/booking', VALID_BOOKING);
      const bookingId = createResponse.data.bookingid;

      await client.delete(`/booking/${bookingId}`, {
        headers: { Cookie: `token=${token}` },
      });

      const listResponse = await client.get('/booking');
      const ids = listResponse.data.map((b) => b.bookingid);
      expect(ids).not.toContain(bookingId);
    });

    it('returns 403 without authentication', async () => {
      const createResponse = await client.post('/booking', VALID_BOOKING);
      const bookingId = createResponse.data.bookingid;

      const deleteResponse = await client.delete(`/booking/${bookingId}`);
      expect(deleteResponse.status).toBe(403);
    });

    it('accepts Basic Auth for deletion', async () => {
      const createResponse = await client.post('/booking', VALID_BOOKING);
      const bookingId = createResponse.data.bookingid;

      const deleteResponse = await client.delete(`/booking/${bookingId}`, {
        headers: { Authorization: 'Basic YWRtaW46cGFzc3dvcmQxMjM=' },
      });

      expect(deleteResponse.status).toBe(201);
    });
  });

  // ─── HEALTH CHECK ──────────────────────────────────────────────────────────

  describe('GET /ping — Health check', () => {
    it('returns 201 when the API is up', async () => {
      const response = await client.get('/ping');

      expect(response.status).toBe(201);
    });
  });
});
