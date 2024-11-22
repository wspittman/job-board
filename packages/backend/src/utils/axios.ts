import { AxiosResponse } from "axios";
import { AppError } from "../AppError";
import { logError } from "./telemetry";

/**
 * A helper function to convert non-200 status codes into errors.
 * @param tags User-readable tags to include in error logs/messages.
 */
export function checkStatus(
  { status, statusText }: AxiosResponse,
  tags: string[]
) {
  if (status === 404) {
    throw new AppError(`${tags.join(" / ")}: Not Found`, 404);
  }

  if (status !== 200) {
    logError(`${tags.join(" / ")}: ${status} ${statusText}`);
    throw new AppError(`${tags.join(" / ")}: Request Failed`, 500);
  }
}
