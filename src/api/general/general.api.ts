import { apiClient } from "../client";
import type {
  GeneralAccessResponse,
  GeneralPermissionDto,
  UpsertGeneralPermissionRequest,
} from "../types/general";

export async function fetchGeneralAccess(
  officeId: string
): Promise<GeneralAccessResponse> {
  const { data } = await apiClient.get<GeneralAccessResponse>(
    `/api/offices/${officeId}/general/access`
  );
  return data;
}

export async function listGeneralPermissions(
  officeId: string
): Promise<GeneralPermissionDto[]> {
  const { data } = await apiClient.get<GeneralPermissionDto[]>(
    `/api/offices/${officeId}/general-permissions`
  );
  return data;
}

export async function upsertGeneralPermission(
  officeId: string,
  body: UpsertGeneralPermissionRequest
): Promise<GeneralPermissionDto> {
  const { data } = await apiClient.put<GeneralPermissionDto>(
    `/api/offices/${officeId}/general-permissions`,
    body
  );
  return data;
}
