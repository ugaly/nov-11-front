import { apiClient } from "../client";
import type {
  ChangePasswordRequest,
  ChangePasswordResponse,
  CurrentUserResponse,
  PatchCurrentUserRequest,
} from "../types/user-me";

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  const { data } = await apiClient.get<CurrentUserResponse>("/api/users/me");
  return data;
}

export async function postChangePassword(
  body: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  const { data } = await apiClient.post<ChangePasswordResponse>(
    "/api/users/me/change-password",
    body
  );
  return data;
}

export async function patchCurrentUser(
  body: PatchCurrentUserRequest
): Promise<CurrentUserResponse> {
  const { data } = await apiClient.patch<CurrentUserResponse>(
    "/api/users/me",
    body
  );
  return data;
}

export async function patchCurrentUserAvatar(
  file: File
): Promise<CurrentUserResponse> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await apiClient.patch<CurrentUserResponse>(
    "/api/users/me",
    form
  );
  return data;
}
