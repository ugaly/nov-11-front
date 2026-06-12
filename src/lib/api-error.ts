import axios from "axios";

export function getApiErrorMessage(
  err: unknown,
  fallback = "Request failed."
): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data;
    if (
      body &&
      typeof body === "object" &&
      "message" in body &&
      typeof (body as { message?: unknown }).message === "string"
    ) {
      return (body as { message: string }).message;
    }
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}
