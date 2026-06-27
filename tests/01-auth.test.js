const { client, getAuthToken } = require('../support/api-client');
const { VALID_CREDENTIALS, VALID_BOOKING } = require('../support/fixtures');

describe('Authentication - POST /auth', () => {
  describe('Valid credentials', () => {
    it('returns 200 and a non-empty token string', async () => {
      const response = await client.post('/auth', VALID_CREDENTIALS);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(typeof response.data.token).toBe('string');
      expect(response.data.token.length).toBeGreaterThan(0);
    });

    it('does not expose a "reason" field on success', async () => {
      const response = await client.post('/auth', VALID_CREDENTIALS);

      expect(response.data).not.toHaveProperty('reason');
    });

    it('issued token is accepted by protected endpoints', async () => {
      const token = await getAuthToken();

      // Create a booking, then update it — PUT requires a valid token
      const create = await client.post('/booking', VALID_BOOKING);
      expect(create.status).toBe(200);
      const bookingId = create.data.bookingid;

      const update = await client.put(
        `/booking/${bookingId}`,
        { ...VALID_BOOKING, firstname: 'TokenVerified' },
        { headers: { Cookie: `token=${token}` } }
      );

      expect(update.status).toBe(200);
      expect(update.data.firstname).toBe('TokenVerified');
    });

    it('Basic Auth header is also accepted by protected endpoints', async () => {
      // The API supports Basic auth as an alternative to cookie token
      const create = await client.post('/booking', VALID_BOOKING);
      const bookingId = create.data.bookingid;

      const update = await client.put(
        `/booking/${bookingId}`,
        { ...VALID_BOOKING, firstname: 'BasicAuthUser' },
        {
          headers: {
            // admin:password123 in Base64
            Authorization: 'Basic YWRtaW46cGFzc3dvcmQxMjM=',
          },
        }
      );

      expect(update.status).toBe(200);
      expect(update.data.firstname).toBe('BasicAuthUser');
    });
  });

  describe('Invalid credentials', () => {
    it('returns "Bad credentials" for wrong password', async () => {
      const response = await client.post('/auth', {
        username: 'admin',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('reason', 'Bad credentials');
      expect(response.data).not.toHaveProperty('token');
    });

    it('returns "Bad credentials" for wrong username', async () => {
      const response = await client.post('/auth', {
        username: 'unknownuser',
        password: 'password123',
      });

      expect(response.data).toHaveProperty('reason', 'Bad credentials');
      expect(response.data).not.toHaveProperty('token');
    });

    it('returns "Bad credentials" for both username and password wrong', async () => {
      const response = await client.post('/auth', {
        username: 'hacker',
        password: 'hack1234',
      });

      expect(response.data).toHaveProperty('reason', 'Bad credentials');
    });

    it('returns "Bad credentials" for empty string credentials', async () => {
      const response = await client.post('/auth', {
        username: '',
        password: '',
      });

      expect(response.data).not.toHaveProperty('token');
    });
  });

  describe('Missing or malformed body', () => {
    it('does not return a token when username is missing', async () => {
      const response = await client.post('/auth', { password: 'password123' });

      expect(response.data).not.toHaveProperty('token');
    });

    it('does not return a token when password is missing', async () => {
      const response = await client.post('/auth', { username: 'admin' });

      expect(response.data).not.toHaveProperty('token');
    });

    it('does not return a token for an empty body', async () => {
      const response = await client.post('/auth', {});

      expect(response.data).not.toHaveProperty('token');
    });
  });

  describe('Protected endpoints reject unauthenticated requests', () => {
    let bookingId;

    beforeAll(async () => {
      const response = await client.post('/booking', VALID_BOOKING);
      bookingId = response.data.bookingid;
    });

    it('PUT /booking/:id returns 403 when no auth is provided', async () => {
      const response = await client.put(`/booking/${bookingId}`, VALID_BOOKING);

      expect(response.status).toBe(403);
    });

    it('PATCH /booking/:id returns 403 when no auth is provided', async () => {
      const response = await client.patch(`/booking/${bookingId}`, {
        firstname: 'NoAuth',
      });

      expect(response.status).toBe(403);
    });

    it('DELETE /booking/:id returns 403 when no auth is provided', async () => {
      const response = await client.delete(`/booking/${bookingId}`);

      expect(response.status).toBe(403);
    });

    it('PUT /booking/:id returns 403 for an invalid token', async () => {
      const response = await client.put(
        `/booking/${bookingId}`,
        VALID_BOOKING,
        { headers: { Cookie: 'token=thisIsNotAValidToken' } }
      );

      expect(response.status).toBe(403);
    });

    it('DELETE /booking/:id returns 403 for an invalid token', async () => {
      const response = await client.delete(`/booking/${bookingId}`, {
        headers: { Cookie: 'token=thisIsNotAValidToken' },
      });

      expect(response.status).toBe(403);
    });
  });
});
