import type { WorkItemFormLinkSummaryDto } from "@/api/types/work-item-api";
import type { PublicFormStepDto } from "@/api/types/work-item-api";

/** Staff may edit field values / upload field files. */
export function isStaffFieldEditLocked(controls: {
  internalEditEnabled?: boolean;
  responsesLocked?: boolean;
}): boolean {
  if (controls.responsesLocked) return true;
  return controls.internalEditEnabled === false;
}

export function resolvePublicSubmitEnabled(
  publicSubmitEnabled: boolean | undefined,
  edited: boolean
): boolean {
  if (publicSubmitEnabled !== undefined) return publicSubmitEnabled;
  return !edited;
}

export function resolveInternalEditEnabled(
  internalEditEnabled: boolean | undefined,
  responsesLocked: boolean
): boolean {
  if (responsesLocked) return false;
  return internalEditEnabled !== false;
}

export function publicFormCanSubmit(
  readOnly: boolean,
  edited: boolean,
  publicSubmitEnabled?: boolean
): boolean {
  if (readOnly) return false;
  return resolvePublicSubmitEnabled(publicSubmitEnabled, edited);
}

export function publicStepCanSubmit(step: PublicFormStepDto): boolean {
  if (step.readOnly) return false;
  return resolvePublicSubmitEnabled(step.publicSubmitEnabled, step.edited);
}

export function syncSubmissionControlsFromExecution(bundle: {
  responsesLocked?: boolean;
  internalEditEnabled?: boolean;
  publicSubmitEnabled?: boolean;
  values?: { responsesLocked?: boolean; internalEditEnabled?: boolean };
  formLink?: WorkItemFormLinkSummaryDto | null;
}): {
  responsesLocked: boolean;
  internalEditEnabled: boolean;
  publicSubmitEnabled: boolean;
} {
  const responsesLocked =
    bundle.responsesLocked ?? bundle.values?.responsesLocked ?? false;
  const internalEditEnabled = resolveInternalEditEnabled(
    bundle.internalEditEnabled ?? bundle.values?.internalEditEnabled,
    responsesLocked
  );
  const publicSubmitEnabled = resolvePublicSubmitEnabled(
    bundle.publicSubmitEnabled ?? bundle.formLink?.publicSubmitEnabled,
    bundle.formLink?.edited ?? false
  );
  return { responsesLocked, internalEditEnabled, publicSubmitEnabled };
}
