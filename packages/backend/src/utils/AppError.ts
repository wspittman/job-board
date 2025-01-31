export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
    public innerError?: unknown
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }

  toErrorList() {
    const errors: string[] = [];
    let cur: unknown = this;

    while (cur) {
      if (cur instanceof AppError) {
        const { message, statusCode, innerError } = cur;
        errors.push(`[${statusCode}] ${message}`);
        cur = innerError;
      } else {
        errors.push(cur instanceof Error ? cur.message : String(cur));
        cur = undefined;
      }
    }

    return errors;
  }
}
