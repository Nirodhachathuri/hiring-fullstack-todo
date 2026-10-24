// An error that carries an HTTP status code (and optional field errors)
// so the error handler can turn it into a clean JSON response.
export class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    if (errors) this.errors = errors;
  }
}
