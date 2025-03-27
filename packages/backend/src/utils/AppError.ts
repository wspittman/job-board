export class AppError extends Error {
  public statusCode: number;
  public innerError?: unknown;

  constructor(message: string, statusCode: number = 400, innerError?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.innerError = innerError;
    Error.captureStackTrace(this, this.constructor);
  }

  toErrorList(): string[] {
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
