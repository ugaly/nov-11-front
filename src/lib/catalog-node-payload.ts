import type {
  CatalogNodeType,
  CreateCatalogNodeRequest,
} from "@/api/types/template-config";
import {
  appendCatalogNodeFields,
  type PricingFormState,
} from "@/lib/template-pricing";
import {
  appendRecurrenceFields,
  type RecurrenceFormState,
} from "@/lib/template-recurrence";

export type CatalogNodeFormInput = {
  parentId: string | null;
  name: string;
  nodeType: CatalogNodeType;
  sortOrder: string;
  description: string;
  departmentId: string;
  requiresParentCompletion: boolean;
  pricing: PricingFormState;
  recurrence: RecurrenceFormState;
};

/**
 * Build POST body for catalog nodes — only defined fields are included
 * (no parentId / departmentId on root unless set; TASK never sends department).
 */
export function buildCreateCatalogNodeRequest(
  input: CatalogNodeFormInput
): CreateCatalogNodeRequest {
  const body: CreateCatalogNodeRequest = {
    name: input.name.trim(),
    nodeType: input.nodeType,
  };

  if (input.parentId) {
    body.parentId = input.parentId;
  }

  const sort = Number.parseInt(input.sortOrder, 10);
  if (!Number.isNaN(sort)) {
    body.sortOrder = sort;
  }

  const desc = input.description.trim();
  if (desc) {
    body.description = desc;
  }

  // Department / parent-completion only on child GROUP nodes (not root).
  if (
    input.parentId &&
    input.nodeType === "GROUP" &&
    input.departmentId.trim()
  ) {
    body.departmentId = input.departmentId.trim();
  }

  if (input.parentId && input.nodeType === "GROUP" && input.requiresParentCompletion) {
    body.requiresParentCompletion = true;
  }

  appendCatalogNodeFields(body, input.pricing);
  if (!input.parentId && input.nodeType === "GROUP") {
    appendRecurrenceFields(body, input.recurrence);
  }
  return body;
}
