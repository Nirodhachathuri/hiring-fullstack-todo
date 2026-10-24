export const NAME_MAX = 50;
export const PASSWORD_MIN = 6;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns field -> message. Empty object means valid.
export function validateAuth({ name, email, password }, mode) {
  const errors = {};

  if (mode === 'register') {
    if (!name.trim()) errors.name = 'Name is required';
    else if (name.trim().length > NAME_MAX) errors.name = `Name must be ${NAME_MAX} characters or less`;
  }

  if (!email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';

  if (!password) errors.password = 'Password is required';
  else if (mode === 'register' && password.length < PASSWORD_MIN) {
    errors.password = `Password must be at least ${PASSWORD_MIN} characters`;
  }

  return errors;
}
