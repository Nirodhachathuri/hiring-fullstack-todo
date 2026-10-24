# TodoApp — Server (Express + MongoDB)

A REST API for the TODO app, built with Node.js, Express 5 and Mongoose. Users register and log in with email and password. Each user has their own private TODO list.

## Setup & run

Requires Node.js 20+ and a MongoDB instance, either local or MongoDB Atlas.

```bash
cd server
npm install
cp .env.example .env     # Windows: copy .env.example .env
npm run dev              # starts with nodemon on http://localhost:5000
```

### Environment variables (`.env`)

| Variable        | Example | Purpose |
|-----------------|---------|---------|
| `PORT`          | `5000` | Port the API listens on |
| `MONGODB_URI`   | `mongodb://127.0.0.1:27017/todo-app` | MongoDB connection string. For Atlas, use your `mongodb+srv://...` URI. |
| `JWT_SECRET`    | *(long random string)* | Secret used to sign login tokens. **Required.** Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `7d` | How long a login lasts |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Frontend origins allowed by CORS (comma-separated) |

### Scripts

- `npm run dev` starts the API with auto-restart (nodemon).
- `npm start` starts the API with plain node.
- `npm test` runs the API tests against an in-memory MongoDB. The first run downloads a MongoDB binary, about 100 MB. To use your own MongoDB instead, set `MONGO_TEST_URI=mongodb://127.0.0.1:27017`. The tests use a separate temporary database and drop it afterwards.

## API

All bodies are JSON.

### Auth

| Method | Endpoint | Body | Success | Errors |
|--------|----------|------|---------|--------|
| POST | `/api/auth/register` | `{ name, email, password }` | `201 { token, user }` | `400` validation, `409` email taken |
| POST | `/api/auth/login` | `{ email, password }` | `200 { token, user }` | `400` validation, `401` wrong email or password |
| GET  | `/api/auth/me` | – | `200 { user }` | `401` |

`user` is `{ id, name, email }`. The password is never returned.

Send the token on every TODO request:

```
Authorization: Bearer <token>
```

### TODOs (login required)

| Method | Endpoint | Body | Success | Description |
|--------|----------|------|---------|-------------|
| GET    | `/api/todos` | – | `200` array | Your TODOs, newest first |
| POST   | `/api/todos` | `{ title, description? }` | `201` todo | Create a TODO |
| PUT    | `/api/todos/:id` | `{ title?, description? }` | `200` todo | Update title and/or description |
| PATCH  | `/api/todos/:id/done` | – | `200` todo | Toggle done ↔ not done |
| DELETE | `/api/todos/:id` | – | `204` | Delete a TODO |
| GET    | `/api/health` | – | `200` / `503` | Reports whether the database is connected (no login needed) |

A TODO looks like this:

```json
{
  "_id": "6650c1f2a1b2c3d4e5f60718",
  "title": "Finish project documentation",
  "description": "Write the README and update API docs",
  "done": false,
  "createdAt": "2026-10-24T04:50:00.000Z",
  "updatedAt": "2026-10-24T04:50:00.000Z"
}
```

### How per-user data works

- Each TODO has an `owner` field holding a user id. It's stored in the database but not sent back to the client.
- `requireAuth` checks the token and loads the user into `req.user`. Every TODO query then filters on `owner: req.user._id`.
- If someone uses another user's TODO id, they get a `404`, so the API doesn't even reveal that the TODO exists.
- `owner`, `done`, `_id` and the timestamps sent in a request body are ignored.

### Validation rules

- `name` (register): required, 1–50 characters.
- `email`: required, must be a valid format, stored lowercase, unique.
- `password`: required. When registering it must be 6–72 characters. It's hashed with bcrypt before saving.
- `title`: required, must be a string, trimmed, 1–100 characters.
- `description`: optional, must be a string, trimmed, up to 500 characters.
- `done`, `_id` and the timestamps can't be set through POST or PUT. They are silently ignored. Use the PATCH endpoint to change `done`.

### Errors

Every error returns JSON with a `message` field. Validation errors also include per-field messages:

```json
{ "message": "Validation failed", "errors": { "title": "Title is required" } }
```

| Status | When |
|--------|------|
| `400` | Validation failed, malformed JSON, a malformed id, or an empty PUT body |
| `401` | Missing, invalid or expired token, or wrong login details |
| `409` | The email is already registered |
| `404` | The TODO doesn't exist or belongs to another user, or the route is unknown |
| `500` | Unexpected server error. The details are logged on the server, not sent to the client. |

## Structure

```
src/
├── index.js                 # entry: loads .env, connects DB, starts server, graceful shutdown
├── app.js                   # builds the Express app (also imported by tests)
├── config/db.js             # Mongoose connection
├── models/
│   ├── User.js              # name, email (unique), hashed password
│   └── Todo.js              # owner, title, description, done, timestamps
├── routes/
│   ├── auth.js              # register / login / me
│   └── todos.js             # the 5 TODO endpoints (all behind requireAuth)
├── controllers/
│   ├── authController.js
│   └── todoController.js    # every query scoped to req.user
├── middleware/
│   ├── requireAuth.js       # verifies the JWT, sets req.user
│   ├── validateAuth.js      # register/login body validation
│   ├── validateTodo.js      # TODO body validation + field whitelisting
│   ├── validateObjectId.js  # rejects malformed :id
│   └── errorHandler.js      # 404 + central JSON error handler
└── utils/
    ├── HttpError.js
    └── token.js             # sign / verify JWTs
tests/todos.test.js          # node:test + supertest + mongodb-memory-server (auth, CRUD, user isolation)
```

## Assumptions & limitations

- Login uses a stateless JWT. Logging out happens on the client by discarding the token, so a token stays valid until it expires (7 days by default). There is no server-side revocation list.
- `requireAuth` looks up the user on every request. That costs one extra query, but deleted accounts are locked out immediately.
- There's no password reset, email verification or login rate limiting, which a production app would need.
- TODOs created before accounts were added have no `owner`, so they won't appear for anyone. Delete them, or drop the `todos` collection.
- `GET /api/todos` returns every TODO without pagination, which is fine for a personal list.
- `PATCH /:id/done` toggles the current value. It reads and then saves, so two clicks at exactly the same moment could cancel each other out. That's acceptable for a single-user app.
- Express 5 is used so that errors thrown in async handlers reach the error handler without try/catch wrappers.
