export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;

// Returns an object of field -> message. Empty object means valid.
export function validateTodo({ title, description }) {
  const errors = {};
  const t = title.trim();

  if (!t) errors.title = 'Title is required';
  else if (t.length > TITLE_MAX) errors.title = `Title must be ${TITLE_MAX} characters or less`;

  if (description.trim().length > DESCRIPTION_MAX) {
    errors.description = `Description must be ${DESCRIPTION_MAX} characters or less`;
  }
  return errors;
}
