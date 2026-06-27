# Restful Booker — API Test Suite

Automated API test suite for [restful-booker.herokuapp.com](https://restful-booker.herokuapp.com), covering authentication, booking CRUD, and field validation.

**71 tests · Jest · axios**

---

## Project structure

```
restful-booker/
├── support/
│   ├── api-client.js   # axios instance + getAuthToken() helper
│   └── fixtures.js     # shared booking and credential constants
└── tests/
    ├── 01-auth.test.js            # authentication flows
    ├── 02-booking-crud.test.js    # full CRUD lifecycle
    └── 03-booking-validation.test.js  # field validation
```

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
npm install
```

## Running tests

```bash
# All suites
npm test

# Individual suites
npm run test:auth
npm run test:crud
npm run test:validation
```

## Test coverage

### `01-auth.test.js` — Authentication

- Returns a token for valid credentials
- Returns `Bad credentials` (not a token) for wrong username/password
- Issued token is accepted by protected endpoints (`PUT`, `PATCH`, `DELETE`)
- Basic Auth header (`Authorization: Basic ...`) is accepted as an alternative to cookie token
- Missing body fields do not yield a token
- All protected endpoints return `403` when no auth or an invalid token is provided

### `02-booking-crud.test.js` — Booking CRUD

| Operation | Scenarios covered |
|-----------|------------------|
| `POST /booking` | Creates booking, echoes all fields, optional `additionalneeds`, persists to list |
| `GET /booking` | Returns array of IDs, filters by `firstname`, `lastname`, `checkin`, `checkout` |
| `GET /booking/:id` | Returns booking details, validates all fields, 404 for unknown ID |
| `PUT /booking/:id` | Full replace, persistence, Basic Auth, 403 without auth, 405 for unknown ID |
| `PATCH /booking/:id` | Partial update, field isolation, nested `bookingdates`, 403 without auth |
| `DELETE /booking/:id` | Deletes booking, 404 on subsequent GET, removed from list, 403 without auth |
| `GET /ping` | Health check returns 201 |

### `03-booking-validation.test.js` — Field validation

- **Missing required fields:** `firstname`, `lastname`, `totalprice`, `depositpaid`, `bookingdates`, `bookingdates.checkin`, `bookingdates.checkout`
- **Wrong types:** number as `firstname`, string as `totalprice`, string as `depositpaid`, string as `bookingdates`
- **Boundary values:** `totalprice` of 0 and 9,999,999; `depositpaid: false`; special characters in names; long `additionalneeds`
- **Optional fields:** booking succeeds without `additionalneeds`
- **PUT validation:** full update also enforces required fields

#### Known API gaps

The following constraints are **not enforced** by the server. Tests marked `[API GAP]` document current permissive behavior and should be updated if validation is added:

| Gap | Observed behavior |
|-----|------------------|
| `totalprice` accepts strings | Returns `200` |
| Invalid date strings accepted | Returns `200` |
| Checkout before checkin accepted | Returns `200` |
| Same-day checkin/checkout accepted | Returns `200` |

## API quirks

- `POST /auth` always returns `200`: success yields `{ token }`, failure yields `{ reason: "Bad credentials" }`
- `DELETE /booking/:id` returns `201` (not `204`) on success
- Authentication can be passed as a cookie (`Cookie: token=<token>`) or Basic Auth header
