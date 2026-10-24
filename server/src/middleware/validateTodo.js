import { DESCRIPTION_MAX, TITLE_MAX } from '../models/Todo.js';
import { HttpError } from '../utils/HttpError.js';

const ALLOWED_FIELDS = ['title', 'description'];

function checkFields(body, { requireTitle }) {
  const errors = {};
  const { title, description } = body;

  if (title !== undefined || requireTitle) {
    if (typeof title !== 'string' || !title.trim()) errors.title = 'Title is required';
    else if (title.trim().length > TITLE_MAX) errors.title = `Title must be ${TITLE_MAX} characters or less`;
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') errors.description = 'Description must be text';
    else if (description.trim().length > DESCRIPTION_MAX) {
      errors.description = `Description must be ${DESCRIPTION_MAX} characters or less`;
    }
  }
  return errors;
}

// Keep only title/description so clients can't set done, _id or timestamps here.
function pickAllowed(body) {
  const out = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) out[key] = body[key] ?? '';
  }
  return out;
}

function validate({ requireTitle }) {
  return (req, res, next) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const errors = checkFields(body, { requireTitle });
    if (Object.keys(errors).length) {
      return next(new HttpError(400, 'Validation failed', errors));
    }

    const clean = pickAllowed(body);
    if (!requireTitle && !Object.keys(clean).length) {
      return next(new HttpError(400, 'Provide a title or description to update'));
    }
    req.body = clean;
    next();
  };
}

export const validateCreate = validate({ requireTitle: true });
export const validateUpdate = validate({ requireTitle: false });
