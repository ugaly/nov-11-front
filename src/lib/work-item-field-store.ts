import type {
  WorkItemFieldDefinition,
  WorkItemFieldValue,
  WorkItemFileAttachment,
} from "@/api/types/work-item-template";
import {
  kindFromMimeAndName,
  normalizeAttachmentFromApi,
} from "@/lib/work-item-file-utils";

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidFieldId(id: string): boolean {
  return UUID_RE.test(id);
}

/** Backend `WorkItemFieldDefinitionDto.id` requires a UUID. */
export function newFieldId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Build PUT payload: keep ids only for fields already on this task's template (from GET).
 * Any new field gets a fresh UUID so we never INSERT a row that already exists (409 field_id_in_use).
 */
export function prepareFieldsForTemplatePut(
  serverFields: WorkItemFieldDefinition[],
  clientFields: WorkItemFieldDefinition[]
): WorkItemFieldDefinition[] {
  const serverIds = new Set(serverFields.map((f) => f.id));
  const used = new Set<string>();

  const prepared = clientFields.map((f, index) => {
    const keepServerId =
      isUuidFieldId(f.id) && serverIds.has(f.id) && !used.has(f.id);

    let id = keepServerId ? f.id : newFieldId();
    while (used.has(id)) {
      id = newFieldId();
    }
    used.add(id);

    return { ...f, id, sortOrder: index };
  });

  return ensureUniqueFieldIds(prepared);
}

/** Ids repeated in one PUT body (backend returns 400 duplicate_field_id). */
export function findDuplicateFieldIds(
  fields: WorkItemFieldDefinition[]
): string[] {
  const ids = fields.map((f) => f.id).filter(Boolean);
  return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
}

/** Last-line guard: every row gets a distinct UUID. */
export function ensureUniqueFieldIds(
  fields: WorkItemFieldDefinition[]
): WorkItemFieldDefinition[] {
  const used = new Set<string>();
  return fields.map((f, index) => {
    let id = f.id;
    if (!isUuidFieldId(id) || used.has(id)) {
      id = newFieldId();
    }
    while (used.has(id)) {
      id = newFieldId();
    }
    used.add(id);
    return { ...f, id, sortOrder: index };
  });
}

/** API attachment DTO (no base64). */
export function toApiAttachmentRef(
  a: WorkItemFileAttachment
): WorkItemFileAttachment {
  const n = normalizeAttachmentFromApi(a);
  return {
    id: n.id,
    name: n.name,
    mimeType: n.mimeType,
    size: n.size,
    kind: n.kind,
    url: n.url ?? "",
    dataUrl: "",
  };
}

/** Strip local-only files; backend requires UUID attachment ids from POST field-files. */
export function prepareFieldValuesForApi(
  values: WorkItemFieldValue[]
): WorkItemFieldValue[] {
  return values.map((v) => {
    if (!v.attachments?.length) {
      return { fieldId: v.fieldId, value: v.value, tableRows: v.tableRows };
    }

    const uploaded = v.attachments.filter(
      (a) => isUuidFieldId(a.id) && Boolean(a.url)
    );

    return {
      fieldId: v.fieldId,
      attachments: uploaded.map(toApiAttachmentRef),
      fileNames: uploaded.map((a) => a.name),
    };
  });
}

export function findInvalidAttachmentIds(
  values: WorkItemFieldValue[]
): { fieldId: string; attachmentId: string }[] {
  const bad: { fieldId: string; attachmentId: string }[] = [];
  for (const v of values) {
    for (const a of v.attachments ?? []) {
      if (!isUuidFieldId(a.id) || !a.url) {
        bad.push({ fieldId: v.fieldId, attachmentId: a.id });
      }
    }
  }
  return bad;
}

/** Dev-only: log PUT payload and warn on duplicate ids. */
export function logTemplatePutPayload(
  workItemId: string,
  fields: WorkItemFieldDefinition[],
  context?: { serverFieldCount: number; from404: boolean }
) {
  if (process.env.NODE_ENV === "production") return;
  const dupes = findDuplicateFieldIds(fields);
  console.debug("[work-item] PUT field-template", {
    workItemId,
    fieldCount: fields.length,
    ...context,
    ids: fields.map((f) => f.id),
    duplicateFieldIds: dupes.length ? dupes : undefined,
  });
  if (dupes.length) {
    console.warn("[work-item] duplicate field ids in PUT payload", dupes);
  }
}

/** @deprecated Use prepareFieldsForTemplatePut(serverFields, clientFields) */
export function normalizeFieldDefinitionsForApi(
  fields: WorkItemFieldDefinition[]
): WorkItemFieldDefinition[] {
  return prepareFieldsForTemplatePut([], fields);
}
