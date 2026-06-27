const VALID_CREDENTIALS = {
  username: 'admin',
  password: 'password123',
};

const VALID_BOOKING = {
  firstname: 'John',
  lastname: 'Doe',
  totalprice: 150,
  depositpaid: true,
  bookingdates: {
    checkin: '2026-08-01',
    checkout: '2026-08-07',
  },
  additionalneeds: 'Breakfast',
};

const UPDATED_BOOKING = {
  firstname: 'Jane',
  lastname: 'Smith',
  totalprice: 200,
  depositpaid: false,
  bookingdates: {
    checkin: '2026-09-10',
    checkout: '2026-09-15',
  },
  additionalneeds: 'Lunch',
};

module.exports = { VALID_CREDENTIALS, VALID_BOOKING, UPDATED_BOOKING };
