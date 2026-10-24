// API tests: real Express app + a throwaway in-memory MongoDB.
// Run with `npm test` (the first run downloads a MongoDB binary, ~100 MB).
// Set MONGO_TEST_URI to use an existing MongoDB instead of the in-memory one.
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { Todo } from '../src/models/Todo.js';
import { User } from '../src/models/User.js';

process.env.JWT_SECRET ||= 'test-secret';

let mongo;
const app = createApp();
const fakeId = new mongoose.Types.ObjectId().toString();

before(async () => {
  let uri = process.env.MONGO_TEST_URI;
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongo = await MongoMemoryServer.create();
    uri = mongo.getUri();
  }
  await mongoose.connect(uri, { dbName: `todo-test-${process.pid}` });
  await User.init(); // make sure the unique email index exists
});

after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongo?.stop();
});

beforeEach(async () => {
  await Promise.all([Todo.deleteMany({}), User.deleteMany({})]);
});

// ---------- helpers ----------
let userCount = 0;
async function signUp(overrides = {}) {
  userCount += 1;
  const body = { name: 'Test User', email: `user${userCount}@example.com`, password: 'secret123', ...overrides };
  const res = await request(app).post('/api/auth/register').send(body);
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return { ...res.body, password: body.password };
}

// Returns a supertest agent-like helper that sends the user's token
const as = (token) => ({
  get: (url) => request(app).get(url).set('Authorization', `Bearer ${token}`),
  post: (url) => request(app).post(url).set('Authorization', `Bearer ${token}`),
  put: (url) => request(app).put(url).set('Authorization', `Bearer ${token}`),
  patch: (url) => request(app).patch(url).set('Authorization', `Bearer ${token}`),
  delete: (url) => request(app).delete(url).set('Authorization', `Bearer ${token}`),
});

async function loggedIn() {
  const { token, user } = await signUp();
  return { api: as(token), user };
}

// ---------- auth ----------
describe('POST /api/auth/register', () => {
  test('creates a user and returns a token + public profile', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: '  Nirodha  ', email: 'NIRODHA@Example.com', password: 'secret123' });
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.deepEqual(Object.keys(res.body.user).sort(), ['email', 'id', 'name']);
    assert.equal(res.body.user.name, 'Nirodha');
    assert.equal(res.body.user.email, 'nirodha@example.com');
  });

  test('stores a hashed password, never the plain one', async () => {
    await signUp({ email: 'hash@example.com', password: 'plainpass' });
    const stored = await User.findOne({ email: 'hash@example.com' }).select('+password');
    assert.notEqual(stored.password, 'plainpass');
    assert.match(stored.password, /^\$2[aby]\$/); // bcrypt hash
  });

  test('rejects a duplicate email (case-insensitive) with 409', async () => {
    await signUp({ email: 'dup@example.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'DUP@example.com', password: 'secret123' });
    assert.equal(res.status, 409);
  });

  test('validates name, email and password', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'bad', password: '123' });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.name);
    assert.ok(res.body.errors.email);
    assert.ok(res.body.errors.password);
  });
});

describe('POST /api/auth/login', () => {
  test('logs in with the right password', async () => {
    const { user, password } = await signUp();
    const res = await request(app).post('/api/auth/login').send({ email: user.email.toUpperCase(), password });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.id, user.id);
  });

  test('wrong password and unknown email give the same 401', async () => {
    const { user } = await signUp();
    const wrong = await request(app).post('/api/auth/login').send({ email: user.email, password: 'nope-nope' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'nope-nope' });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.message, unknown.body.message);
  });
});

describe('GET /api/auth/me', () => {
  test('returns the current user', async () => {
    const { token, user } = await signUp();
    const res = await as(token).get('/api/auth/me');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.user, user);
  });

  test('401 without a token, with a bad token, or for a deleted user', async () => {
    assert.equal((await request(app).get('/api/auth/me')).status, 401);
    assert.equal((await as('not-a-jwt').get('/api/auth/me')).status, 401);

    const { token, user } = await signUp();
    await User.findByIdAndDelete(user.id);
    assert.equal((await as(token).get('/api/auth/me')).status, 401);
  });
});

// ---------- todos ----------
describe('TODO routes require login', () => {
  test('every TODO route returns 401 without a token', async () => {
    const results = await Promise.all([
      request(app).get('/api/todos'),
      request(app).post('/api/todos').send({ title: 'x' }),
      request(app).put(`/api/todos/${fakeId}`).send({ title: 'x' }),
      request(app).patch(`/api/todos/${fakeId}/done`),
      request(app).delete(`/api/todos/${fakeId}`),
    ]);
    for (const res of results) assert.equal(res.status, 401);
  });
});

describe('GET /api/todos', () => {
  test('returns an empty array for a new user', async () => {
    const { api } = await loggedIn();
    const res = await api.get('/api/todos');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, []);
  });

  test('returns the user\'s todos newest first, without the owner field', async () => {
    const { api } = await loggedIn();
    await api.post('/api/todos').send({ title: 'first' });
    await api.post('/api/todos').send({ title: 'second' });
    const res = await api.get('/api/todos');
    assert.deepEqual(res.body.map((t) => t.title), ['second', 'first']);
    assert.equal(res.body[0].owner, undefined);
  });
});

describe('POST /api/todos', () => {
  test('creates a todo with defaults', async () => {
    const { api } = await loggedIn();
    const res = await api.post('/api/todos').send({ title: '  Buy milk  ' });
    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Buy milk');
    assert.equal(res.body.description, '');
    assert.equal(res.body.done, false);
    assert.ok(res.body._id && res.body.createdAt && res.body.updatedAt);
  });

  test('ignores done/owner sent by the client', async () => {
    const { api, user } = await loggedIn();
    const other = await signUp();
    const res = await api.post('/api/todos').send({ title: 'x', done: true, owner: other.user.id });
    assert.equal(res.body.done, false);
    const saved = await Todo.findById(res.body._id);
    assert.equal(saved.owner.toString(), user.id);
  });

  test('rejects a missing, blank or too-long title', async () => {
    const { api } = await loggedIn();
    for (const body of [{}, { title: '   ' }, { title: 42 }, { title: 'a'.repeat(101) }]) {
      const res = await api.post('/api/todos').send(body);
      assert.equal(res.status, 400);
      assert.ok(res.body.errors.title);
    }
  });

  test('rejects malformed JSON', async () => {
    const { api } = await loggedIn();
    const res = await api.post('/api/todos').set('Content-Type', 'application/json').send('{"title":');
    assert.equal(res.status, 400);
  });
});

describe('PUT /api/todos/:id', () => {
  test('updates title and description, including partial updates', async () => {
    const { api } = await loggedIn();
    const { body: todo } = await api.post('/api/todos').send({ title: 'Old', description: 'old' });

    const full = await api.put(`/api/todos/${todo._id}`).send({ title: 'New', description: 'new' });
    assert.equal(full.status, 200);
    assert.equal(full.body.title, 'New');

    const partial = await api.put(`/api/todos/${todo._id}`).send({ description: 'only this' });
    assert.equal(partial.body.title, 'New');
    assert.equal(partial.body.description, 'only this');
  });

  test('400 for an empty body, a blank title or a malformed id; 404 for an unknown id', async () => {
    const { api } = await loggedIn();
    const { body: todo } = await api.post('/api/todos').send({ title: 'x' });
    assert.equal((await api.put(`/api/todos/${todo._id}`).send({})).status, 400);
    assert.equal((await api.put(`/api/todos/${todo._id}`).send({ title: '' })).status, 400);
    assert.equal((await api.put('/api/todos/not-an-id').send({ title: 'x' })).status, 400);
    assert.equal((await api.put(`/api/todos/${fakeId}`).send({ title: 'x' })).status, 404);
  });
});

describe('PATCH /api/todos/:id/done', () => {
  test('toggles done back and forth', async () => {
    const { api } = await loggedIn();
    const { body: todo } = await api.post('/api/todos').send({ title: 'x' });
    assert.equal((await api.patch(`/api/todos/${todo._id}/done`)).body.done, true);
    assert.equal((await api.patch(`/api/todos/${todo._id}/done`)).body.done, false);
  });
});

describe('DELETE /api/todos/:id', () => {
  test('deletes a todo, then 404 the second time', async () => {
    const { api } = await loggedIn();
    const { body: todo } = await api.post('/api/todos').send({ title: 'x' });
    assert.equal((await api.delete(`/api/todos/${todo._id}`)).status, 204);
    assert.equal((await api.delete(`/api/todos/${todo._id}`)).status, 404);
  });
});

describe('users cannot see or touch each other\'s todos', () => {
  test('another user gets an empty list and 404 on every action', async () => {
    const alice = await loggedIn();
    const bob = await loggedIn();
    const { body: todo } = await alice.api.post('/api/todos').send({ title: 'Alice only' });

    assert.deepEqual((await bob.api.get('/api/todos')).body, []);
    assert.equal((await bob.api.put(`/api/todos/${todo._id}`).send({ title: 'hacked' })).status, 404);
    assert.equal((await bob.api.patch(`/api/todos/${todo._id}/done`)).status, 404);
    assert.equal((await bob.api.delete(`/api/todos/${todo._id}`)).status, 404);

    // Alice's TODO is untouched
    const [mine] = (await alice.api.get('/api/todos')).body;
    assert.equal(mine.title, 'Alice only');
    assert.equal(mine.done, false);
  });
});

describe('other routes', () => {
  test('health check reports the DB connection', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  test('unknown routes return a JSON 404', async () => {
    const res = await request(app).get('/api/nope');
    assert.equal(res.status, 404);
  });
});
