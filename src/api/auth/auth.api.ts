import { apiClient } from "../client";
import type {
  AuthResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
} from "../types/auth";

export async function login(body: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    "/api/auth/login",
    body
  );
  return data;
}

export async function register(
  body: RegisterRequest
): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>(
    "/api/auth/register",
    body
  );
  return data;
}

export async function forgotPassword(
  body: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  const { data } = await apiClient.post<ForgotPasswordResponse>(
    "/api/auth/forgot-password",
    body
  );
  return data;
}

export async function resetPassword(
  body: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  const { data } = await apiClient.post<ResetPasswordResponse>(
    "/api/auth/reset-password",
    body
  );
  return data;
}
