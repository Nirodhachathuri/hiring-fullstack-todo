import { User } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';
import { verifyToken } from '../utils/token.js';

// Reads "Authorization: Bearer <token>", checks it, and puts the user on req.user.
// Anything wrong -> 401, which makes the frontend log the user out.
export async function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Please log in to continue');
  }

  let userId;
  try {
    userId = verifyToken(token);
  } catch {
    throw new HttpError(401, 'Your session is invalid or has expired. Please log in again');
  }

  // Also catches tokens for accounts that no longer exist
  const user = await User.findById(userId);
  if (!user) throw new HttpError(401, 'Please log in again');

  req.user = user;
  next();
}
