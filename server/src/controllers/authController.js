import { User } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';
import { signToken } from '../utils/token.js';

const session = (user) => ({ token: signToken(user._id), user });

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password } = req.body;

  if (await User.exists({ email })) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  // Password is hashed by the pre('save') hook in the User model.
  // A duplicate that slips past the check above (two requests at once)
  // is caught by the unique index and turned into a 409 by the error handler.
  const user = await User.create({ name, email, password });
  res.status(201).json(session(user));
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  // Same message for "no such user" and "wrong password", so the API
  // doesn't reveal which emails are registered.
  if (!user || !(await user.checkPassword(password))) {
    throw new HttpError(401, 'Incorrect email or password');
  }
  res.json(session(user));
}

// GET /api/auth/me  (requires a valid token)
export function me(req, res) {
  res.json({ user: req.user });
}
