import { NAME_MAX, PASSWORD_MIN } from '../models/User.js';
import { HttpError } from '../utils/HttpError.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MAX = 72; // bcrypt only uses the first 72 bytes

const isText = (v) => typeof v === 'string';

function validate(mode) {
  return (req, res, next) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { name, email, password } = body;
    const errors = {};

    if (mode === 'register') {
      if (!isText(name) || !name.trim()) errors.name = 'Name is required';
      else if (name.trim().length > NAME_MAX) errors.name = `Name must be ${NAME_MAX} characters or less`;
    }

    if (!isText(email) || !email.trim()) errors.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';

    if (!isText(password) || !password) errors.password = 'Password is required';
    else if (mode === 'register' && password.length < PASSWORD_MIN) {
      errors.password = `Password must be at least ${PASSWORD_MIN} characters`;
    } else if (password.length > PASSWORD_MAX) {
      errors.password = `Password must be ${PASSWORD_MAX} characters or less`;
    }

    if (Object.keys(errors).length) return next(new HttpError(400, 'Validation failed', errors));

    // Only pass through the fields we expect
    req.body = {
      ...(mode === 'register' ? { name: name.trim() } : {}),
      email: email.trim().toLowerCase(),
      password,
    };
    next();
  };
}

export const validateRegister = validate('register');
export const validateLogin = validate('login');
