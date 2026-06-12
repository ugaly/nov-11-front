import { getAccessToken } from "@/lib/auth-storage";
import { API_BASE_URL } from "./config";

/**
 * Multipart upload via XMLHttpRequest so the browser sets the boundary
 * (axios/fetch can still send application/json from defaults).
 */
export function postMultipartJson<T>(
  path: string,
  file: File,
  fieldName = "file"
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!file.size) {
      reject(new Error("The selected file is empty."));
      return;
    }

    const form = new FormData();
    form.append(fieldName, file);
    const token = getAccessToken();
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}${path}`);
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.onload = () => {
      let body: unknown = null;
      if (xhr.responseText) {
        try {
          body = JSON.parse(xhr.responseText) as unknown;
        } catch {
          body = { message: xhr.responseText };
        }
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as T);
        return;
      }

      const message =
        body &&
        typeof body === "object" &&
        "message" in body &&
        typeof (body as { message?: unknown }).message === "string"
          ? (body as { message: string }).message
          : `Upload failed (${xhr.status})`;
      reject(new Error(message));
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(form);
  });
}
