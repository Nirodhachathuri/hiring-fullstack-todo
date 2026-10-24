import jwt from 'jsonwebtoken';

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error('JWT_SECRET is not set');
  return value;
}

// The token only carries the user id ("sub"); everything else is looked up per request.
export function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, secret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// Returns the user id, or throws if the token is invalid or expired.
export function verifyToken(token) {
  return jwt.verify(token, secret()).sub;
}
