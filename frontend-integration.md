# Frontend integration: engagement work items (backend ready)

This document describes **what the Spring Boot API implements today** for the Work tab. The Next.js app is wired to these endpoints (see `src/api/work-item/work-item.api.ts` and hooks under `src/hooks/`).

**Goal:** Replace localStorage mocks with real HTTP calls. Shapes align with `src/api/types/template-config.ts` and `src/api/types/work-item-template.ts`.

---

## Quick start

| Concern | Detail |
|---------|--------|
| API base (authenticated) | `{API_URL}/api/companies/{companyId}/engagements/{engagementId}/work-items/{workItemId}/...` |
| Auth | `Authorization: Bearer <jwt>` on all staff routes |
| Public forms | `{API_URL}/api/public/work-item-forms/{publicToken}` — **no auth** |
| Customer form URL | `{form-public-origin}/forms/{publicToken}` — from `formLink.url` in API responses |
| Public page route | `/forms/[publicToken]` → `PublicWorkItemFormPage` |
| File URLs | Absolute URLs on each file DTO (`url`); upload via multipart |

**Config:** `NEXT_PUBLIC_API_BASE_URL` (default `http://127.0.0.1:9092`). Backend builds `formLink.url` with `app.web.form-public-origin` (default `http://localhost:3000`).

**Field definition `id`:** Must be a **UUID**. Before each `PUT .../field-template`, the app **GETs** the current template and runs `prepareFieldsForTemplatePut(serverFields, clientFields)`:
- Field id **on the server template** → keep (update).
- Field **not** on the server template → **new** `crypto.randomUUID()` (insert), even if the builder already assigned a UUID locally.

This avoids `409 field_id_in_use` when a previous save partially created rows or the builder reused client UUIDs.

**Important:** If `GET .../field-template` returns **404**, `serverFields` must be `[]` (not in-memory `fields`). Otherwise the UI reuses ids that already exist in the DB while the API says “not configured”.

**Backend (restart required):** `duplicate_field_id` (400) for duplicate `fields[].id` in one request; in-batch upsert; re-link orphan definitions for this work item. After restart, PUT after GET 404 should succeed if the payload has unique new UUIDs.

**Dev verification:** On save, the console logs `[work-item] PUT field-template` with `ids` and `duplicateFieldIds` (empty in production). In DevTools → Network → PUT, confirm each `fields[].id` is a unique UUID.

**Field values / FILE uploads:** Upload each file via `POST .../field-files?fieldId=` first. Staff saves use **`PATCH .../field-values`** (partial — only fields in the body). For **FILE** fields: omit `attachments` to keep server files; `attachments: []` clears; send full list to replace. Closure deliverables use **`POST .../output-files` only** — do not `PATCH` field-values when uploading output files. Attachments must use UUID `id` + `url` from field-files POST.

---

## Wired in this repo

| UI / hook | Implementation |
|-----------|----------------|
| `useWorkItemFieldState` | `GET .../execution` (template, values, formLink, closure, submission flags) |
| `WorkItemSubmissionControls` | `GET/PATCH .../submission-controls` — customer submit + staff edit toggles |
| `useEngagementWorkItemStatuses` | `PATCH .../work-items/{id}` + engagement refresh |
| `useWorkItemClosure` | `POST .../closure` (`remark`, `outputFileIds`, optional `values`), `POST .../closure/reopen` |
| `useWorkItemOutputFiles` | `GET/POST/DELETE .../output-files` — closure deliverables before submit |
| `TaskClosureForm` | Remark textarea + `ClosureOutputFilesField` upload/list |
| `FileAttachmentField` | `POST .../field-files?fieldId=` when `onUploadFile` provided |
| Task link copy | `formLink.url` / `POST .../form-link` via `ensureFormLink` |
| Group link | `ShareFormLinkButton` on group header → `POST .../form-link` on GROUP |
| Public forms | `src/app/forms/[publicToken]/page.tsx` |

---

## Not implemented on backend (workarounds unchanged)

| Spec endpoint | Workaround |
|---------------|------------|
| `PATCH .../field-template` | `PUT .../field-template` with full `fields` |
| Per-field definition CRUD | `PUT .../field-template` with stable field `id`s |
| `PATCH .../closure` | `POST .../closure` once |
| `GET .../group-summary` | Per-task `GET .../execution` |

---

## Task section export (customer detail → Work)

Each configured task row has **Export section** (PDF / Excel) beside status when saved data exists from the API.

- **PDF:** Branded header card, customer details, engagement/task metadata, captured field values, closure remark/deliverables list, then merged attachment pages.
- **Excel:** Sheets for customer, engagement, responses, closure, and file URLs.

## Group manual form (Export file)

Each group header has **Export file** beside **Share group**.

- Builds a **printable two-column PDF** (field name | space to fill) for all configured tasks in the group.
- Modal sharing: **Download PDF**, **Print**, **WhatsApp** (prefilled message), **Send email** (PDF attachment via SMTP).
- File fields include a note that attachments must be provided separately; a summary list appears at the end of the PDF.

Configure SMTP in `.env.local` (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`). Never commit credentials.

Implementation: `src/lib/export/work-item-printable-form-export.ts`, `src/components/setup/ExportGroupFormButton.tsx`, `POST /api/send-form-email`.

---

## Error handling

Use `getApiErrorCode` / `getApiErrorMessage` from `src/api/errors.ts`. The API `message` is shown in the UI; branch on `error` when needed:

| `error` | When |
|---------|------|
| `duplicate_field_id` | Same `fields[].id` twice in one PUT — fix builder state (frontend blocks before send) |
| `field_id_in_use` | Id exists in DB; after backend re-link + restart, refresh and save again |
| `invalid_field_id` | Field `id` / `fieldId` not a UUID |
| `empty_body` | Missing request body |
| `invalid_uuid` | Another UUID field invalid |
| `bad_request` | Other validation / parse issues |
| `RESPONSES_LOCKED` | Staff save after office closure (`responsesLocked`) |
| `INTERNAL_EDIT_DISABLED` | Staff save while `internalEditEnabled: false` |
| `FORM_ALREADY_SUBMITTED` | Public submit when `publicSubmitEnabled: false` |
| `FORM_DISABLED` | Link disabled or expired |
| `PUBLIC_TOKEN_NOT_FOUND` | Bad public token |
| `TEMPLATE_NOT_CONFIGURED` | Create link before template exists |

---

For full API payloads and tables, see **`backend-instruction.md`**.
