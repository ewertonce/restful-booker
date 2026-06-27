const axios = require('axios');

const BASE_URL = 'https://restful-booker.herokuapp.com';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  // Never throw on HTTP error status — let tests assert on status codes directly
  validateStatus: () => true,
  timeout: 15000,
});

/**
 * Authenticate and return a session token.
 * Throws if the API returns "Bad credentials".
 */
async function getAuthToken(username = 'admin', password = 'password123') {
  const response = await client.post('/auth', { username, password });
  if (!response.data.token) {
    throw new Error(`Auth failed: ${JSON.stringify(response.data)}`);
  }
  return response.data.token;
}

module.exports = { client, BASE_URL, getAuthToken };
