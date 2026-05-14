/**
 * Backend API origin (no trailing slash).
 * Set in `.env.local` as `NEXT_PUBLIC_API_BASE_URL` (see `.env.example`).
 * Default matches Spring `server.port` in local `application.yml`.
 */
export const API_BASE_URL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")) ||
  "http://127.0.0.1:9092";
