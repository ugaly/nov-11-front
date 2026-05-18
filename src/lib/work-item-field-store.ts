import type {
  WorkItemFieldDefinition,
  WorkItemFieldValue,
} from "@/api/types/work-item-template";

export interface WorkItemTemplateState {
  fields: WorkItemFieldDefinition[];
  configuredAt: string | null;
}

export interface WorkItemValuesState {
  values: WorkItemFieldValue[];
  savedAt: string | null;
}

function templateKey(engagementId: string, workItemId: string) {
  return `work-item-template:${engagementId}:${workItemId}`;
}

function valuesKey(engagementId: string, workItemId: string) {
  return `work-item-values:${engagementId}:${workItemId}`;
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, data: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadWorkItemTemplate(
  engagementId: string,
  workItemId: string
): WorkItemTemplateState {
  return (
    readJson<WorkItemTemplateState>(templateKey(engagementId, workItemId)) ?? {
      fields: [],
      configuredAt: null,
    }
  );
}

export function saveWorkItemTemplate(
  engagementId: string,
  workItemId: string,
  fields: WorkItemFieldDefinition[]
) {
  writeJson(templateKey(engagementId, workItemId), {
    fields,
    configuredAt: new Date().toISOString(),
  } satisfies WorkItemTemplateState);
}

export function loadWorkItemValues(
  engagementId: string,
  workItemId: string
): WorkItemValuesState {
  return (
    readJson<WorkItemValuesState>(valuesKey(engagementId, workItemId)) ?? {
      values: [],
      savedAt: null,
    }
  );
}

export function saveWorkItemValues(
  engagementId: string,
  workItemId: string,
  values: WorkItemFieldValue[]
) {
  writeJson(valuesKey(engagementId, workItemId), {
    values,
    savedAt: new Date().toISOString(),
  } satisfies WorkItemValuesState);
}

export function previewFormLink(workItemId: string): string {
  const slug = workItemId.replace(/-/g, "").slice(0, 12);
  return `https://forms.nov.example.com/f/${slug}`;
}

export function newFieldId(): string {
  return `fld_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
