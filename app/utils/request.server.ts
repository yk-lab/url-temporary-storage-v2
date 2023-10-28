import { json } from "@remix-run/cloudflare";

/**
 * This helper function helps us to return the accurate HTTP status,
 * 400 Bad Request, to the client.
 */
export const badRequest = <T>(data: T) => json<T>(data, { status: 400 });

/**
 * This helper function helps us to return the accurate HTTP status,
 * 401 Unauthorized, to the client.
 */
export const unauthorized = <T>(data: T) => json<T>(data, { status: 401 });

/**
 * This helper function helps us to return the accurate HTTP status,
 * 403 Forbidden, to the client.
 */
export const forbidden = <T>(data: T) => json<T>(data, { status: 403 });
