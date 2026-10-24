import mongoose from 'mongoose';
import { HttpError } from '../utils/HttpError.js';

// Rejects malformed :id params before they reach the database.
export function validateObjectId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new HttpError(400, `Invalid TODO id: ${req.params.id}`));
  }
  next();
}
