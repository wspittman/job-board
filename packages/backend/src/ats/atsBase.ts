import type { ATS } from "../models/models.ts";
import { createSubscribeAggregator, logError } from "../telemetry/telemetry.ts";
import type { Bag } from "../types/types.ts";
import { AppError } from "../utils/AppError.ts";
import { ATSInterface, type Tags } from "./ATSInterface.ts";

type StatusResponse = { status: number; statusText: string };

/**
 * Base class for ATS (Applicant Tracking System) implementations
 * providing common functionality and required interface
 */
export abstract class ATSBase extends ATSInterface {
  readonly #ats: ATS;
  readonly #baseUrl: string;
  readonly #supportsETag: boolean;

  constructor(ats: ATS, baseUrl: string, supportsETag: boolean) {
    super();
    this.#ats = ats;
    this.#baseUrl = baseUrl;
    this.#supportsETag = supportsETag;
  }

  supportsETag(): boolean {
    return this.#supportsETag;
  }

  protected formatTags<IN, OUT>(
    id: string,
    tags: Tags<IN>,
    fmt: (id: string, x: IN) => OUT,
  ): Tags<OUT> {
    if (tags.stable) return tags;
    const { stable, data, etag } = tags;
    return { stable, data: fmt(id, data), etag };
  }

  /**
   * Makes an HTTP GET request to the ATS API
   * @param name Name of the operation for logging
   * @param id Company identifier
   * @param url API endpoint URL
   * @returns API response data
   * @throws AppError for 404 or other error responses
   */
  protected async httpCall<T>(
    name: string,
    id: string,
    url: string,
  ): Promise<T> {
    const { data } = await this.#httpCallInternal<T>(name, id, url);
    return data;
  }

  /**
   * Makes an HTTP GET request to the ATS API
   * @param name Name of the operation for logging
   * @param id Company identifier
   * @param url API endpoint URL
   * @param etag If truthy, send this etag value to the ATS
   * @returns API response data, wrapped in a Tag with etag metadata
   * @throws AppError for 404 or other error responses
   */
  protected async httpCallETag<T>(
    name: string,
    id: string,
    url: string,
    etag?: string,
  ): Promise<Tags<T>> {
    const init: RequestInit = !etag
      ? {}
      : {
          // Use force-cache to keep Node's fetch from adding headers that conflict with Lever's ETag behavior.
          cache: "force-cache",
          headers: { "If-None-Match": etag },
        };

    const res = await this.#httpCallInternal<T>(name, id, url, init);
    const { data, status, headers } = res;

    if (etag && status === 304) {
      return { stable: true };
    }

    return { stable: false, data, etag: headers.get("etag") ?? undefined };
  }

  async #httpCallInternal<T>(
    name: string,
    id: string,
    url: string,
    init?: RequestInit,
  ) {
    const start = Date.now();

    let logStatus: StatusResponse;
    let bytes = -1;

    try {
      const response = await fetch(`${this.#baseUrl}/${id}/${url}`, {
        ...init,
        signal: AbortSignal.timeout(15_000),
      });

      const { status, statusText, ok, headers } = response;
      logStatus = { status, statusText };
      bytes = await this.#getContentLength(response);

      if (status === 404) {
        throw new AppError(`${this.#ats} / ${id}: Not Found`, 404);
      } else if (!ok) {
        throw new AppError(`${this.#ats} / ${id}: Request Failed`, 500);
      }

      const data = (await response.json()) as T;
      return { data, status, headers };
    } catch (error) {
      logStatus = this.#errorToStatus(error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(`${this.#ats} / ${id}: Request Failed`, 500, error);
    } finally {
      const duration = Date.now() - start;
      logStatus ??= {
        status: 500,
        statusText: "Request Exception",
      };
      logAtsCall(`GET ${name}`, this.#ats, id, duration, bytes, logStatus);
    }
  }

  async #getContentLength(res: Response) {
    try {
      // The easy way if the server supports it
      const cl = res.headers.get("content-length");
      if (cl != null) return Number(cl);

      // The more annoying way
      const buf = await res.clone().arrayBuffer();
      return buf.byteLength;
    } catch (error) {
      // Length is only for telemetry, so just log and move on.
      logError(error);
      return -1;
    }
  }

  #errorToStatus(error: unknown): StatusResponse {
    if (error instanceof AppError) {
      return { status: error.statusCode, statusText: error.message };
    }

    if (error instanceof Error) {
      return { status: -1, statusText: error.message };
    }

    return { status: -1, statusText: String(error) };
  }
}

// #region Telemetry

const subscribeAggregator = createSubscribeAggregator("ats", 100);

function logAtsCall(
  name: string,
  ats: ATS,
  id: string,
  ms: number,
  bytes: number,
  { status, statusText }: StatusResponse,
) {
  try {
    const log: Bag = { name, ats, id, ms, bytes };

    if (status !== 200) {
      log["status"] = status;
      log["statusText"] = statusText;
    }

    subscribeAggregator({
      tag: `${ats} ${name}`,
      dense: log,
      metrics: { ms, bytes },
      blob: {},
    });
  } catch (error) {
    logError(error);
  }
}

// #endregion
