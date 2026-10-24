import mongoose from 'mongoose';

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler: every error ends up here as { message, errors? }.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must be valid JSON' });
  }

  // Schema validation that slipped past the middleware
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  // Unique index violation (e.g. two sign-ups with the same email at once)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = field === 'email' ? 'An account with this email already exists' : `Duplicate ${field}`;
    return res.status(409).json({ message });
  }

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ message: `Invalid value for ${err.path}` });
  }

  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);

  res.status(status).json({
    message: status >= 500 ? 'Something went wrong on the server' : err.message,
    ...(err.errors && status < 500 ? { errors: err.errors } : {}),
  });
}
