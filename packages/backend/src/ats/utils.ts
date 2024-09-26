import { AxiosResponse } from "axios";
import { AppError } from "../AppError";

export function checkStatus(
  { status, statusText }: AxiosResponse,
  tags: string[]
) {
  if (status === 404) {
    throw new AppError(`${tags.join(" / ")}: Not Found`, 404);
  }

  if (status !== 200) {
    console.error(`${tags.join(" / ")}: ${status} ${statusText}`);
    throw new AppError(`${tags.join(" / ")}: Request Failed`, 500);
  }
}