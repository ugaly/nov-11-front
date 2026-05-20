"use client";

import { getApiErrorCode, getApiErrorMessage } from "@/api/errors";
import {
  getPublicWorkItemForm,
  postPublicWorkItemFieldFile,
  postPublicWorkItemFormStepSubmit,
  postPublicWorkItemFormSubmit,
  putPublicWorkItemFormDraft,
} from "@/api/work-item/work-item.api";
import type { PublicWorkItemFormResponse } from "@/api/types/work-item-api";
import type {
  WorkItemFieldDefinition,
  WorkItemFieldValue,
  WorkItemFileAttachment,
} from "@/api/types/work-item-template";
import TaskFieldForm from "@/components/setup/TaskFieldForm";
import Button from "@/components/ui/button/Button";
import { apiFileToAttachment } from "@/lib/work-item-api-files";
import {
  findInvalidAttachmentIds,
  prepareFieldValuesForApi,
} from "@/lib/work-item-field-store";
import {
  publicFormCanSubmit,
  publicStepCanSubmit,
} from "@/lib/work-item-submission-controls";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function prepareValuesForSubmit(
  raw: WorkItemFieldValue[],
  fields: WorkItemFieldDefinition[]
): WorkItemFieldValue[] {
  const invalid = findInvalidAttachmentIds(raw);
  if (invalid.length) {
    throw new Error(
      "Some files were not uploaded. Remove them and add files again."
    );
  }
  return prepareFieldValuesForApi(raw, fields);
}

export default function PublicWorkItemFormPage({
  publicToken,
}: {
  publicToken: string;
}) {
  const [data, setData] = useState<PublicWorkItemFormResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPublicWorkItemForm(publicToken);
      setData(res);
      if (res.linkScope === "GROUP" && res.steps?.length) {
        const firstOpen = res.steps.findIndex(
          (s) => s.configured && publicStepCanSubmit(s)
        );
        setActiveStep(firstOpen >= 0 ? firstOpen : 0);
        setCompleted(
          res.readOnly ||
            res.steps.every((s) => !s.configured || !publicStepCanSubmit(s))
        );
      } else {
        setCompleted(
          res.readOnly ||
            !publicFormCanSubmit(res.readOnly, res.edited, res.publicSubmitEnabled)
        );
      }
    } catch (err) {
      const code = getApiErrorCode(err);
      if (code === "PUBLIC_TOKEN_NOT_FOUND") {
        setError("This form link is invalid or has expired.");
      } else if (code === "FORM_DISABLED") {
        setError("This form is no longer accepting responses.");
      } else {
        setError(getApiErrorMessage(err, "Could not load form."));
      }
    } finally {
      setLoading(false);
    }
  }, [publicToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyCustomerPrefill = useCallback(
    (
      fields: WorkItemFieldDefinition[],
      values: WorkItemFieldValue[]
    ): WorkItemFieldValue[] => {
      const prefill = data?.customerPrefill;
      if (!prefill) return values;
      const map = Object.fromEntries(values.map((v) => [v.fieldId, { ...v }]));
      for (const f of fields) {
        if (f.widget !== "CUSTOMER_LINK" || !f.customerFieldKey) continue;
        const key = f.customerFieldKey;
        const val = prefill[key];
        if (val != null && val !== "") {
          map[f.id] = { fieldId: f.id, value: val };
        }
      }
      return fields.map((f) => map[f.id] ?? { fieldId: f.id });
    },
    [data?.customerPrefill]
  );

  async function uploadPublicFile(
    fieldId: string,
    file: File,
    taskWorkItemId?: string
  ): Promise<WorkItemFileAttachment> {
    const dto = await postPublicWorkItemFieldFile(
      publicToken,
      fieldId,
      file,
      taskWorkItemId
    );
    return apiFileToAttachment(dto);
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-500" aria-hidden />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {error ?? "Form not available."}
        </p>
      </div>
    );
  }

  const taskCanSubmit = publicFormCanSubmit(
    data.readOnly,
    data.edited,
    data.publicSubmitEnabled
  );

  if (completed || data.readOnly || !taskCanSubmit) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <CheckCircle2
          className="mx-auto size-12 text-emerald-500"
          aria-hidden
        />
        <h1 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          Thank you
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Your responses for <strong>{data.anchorName}</strong> have been
          recorded. This form is now read-only.
        </p>
      </div>
    );
  }

  if (data.linkScope === "TASK") {
    return (
      <PublicTaskForm
        data={data}
        publicToken={publicToken}
        applyCustomerPrefill={applyCustomerPrefill}
        uploadPublicFile={uploadPublicFile}
        onSubmitted={() => {
          setCompleted(true);
          void load();
        }}
      />
    );
  }

  return (
    <PublicGroupStepper
      data={data}
      publicToken={publicToken}
      activeStep={activeStep}
      setActiveStep={setActiveStep}
      applyCustomerPrefill={applyCustomerPrefill}
      uploadPublicFile={uploadPublicFile}
      submitting={submitting}
      setSubmitting={setSubmitting}
      onComplete={() => {
        setCompleted(true);
        void load();
      }}
      onReload={() => void load()}
    />
  );
}

function PublicShell({
  data,
  children,
}: {
  data: PublicWorkItemFormResponse;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white px-4 py-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-600">
            {data.engagementTitle}
          </p>
          <h1 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
            {data.anchorName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{data.customerName}</p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}

function PublicTaskForm({
  data,
  publicToken,
  applyCustomerPrefill,
  uploadPublicFile,
  onSubmitted,
}: {
  data: PublicWorkItemFormResponse;
  publicToken: string;
  applyCustomerPrefill: (
    fields: WorkItemFieldDefinition[],
    values: WorkItemFieldValue[]
  ) => WorkItemFieldValue[];
  uploadPublicFile: (
    fieldId: string,
    file: File,
    taskWorkItemId?: string
  ) => Promise<WorkItemFileAttachment>;
  onSubmitted: () => void;
}) {
  const canSubmit = publicFormCanSubmit(
    data.readOnly,
    data.edited,
    data.publicSubmitEnabled
  );
  const fields = data.fields ?? [];
  const values = useMemo(
    () => applyCustomerPrefill(fields, data.values ?? []),
    [fields, data.values, applyCustomerPrefill]
  );
  const getValuesRef = useRef<() => WorkItemFieldValue[]>(() => values);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <PublicShell data={data}>
      <TaskFieldForm
        fields={fields}
        values={values}
        savedAt={null}
        readOnly={data.readOnly || !canSubmit}
        workItemId={data.workItemId ?? ""}
        hideActions
        registerGetValues={(fn) => {
          getValuesRef.current = fn;
        }}
        onSave={() => {}}
        onUploadFieldFile={(fieldId, file) =>
          uploadPublicFile(fieldId, file, data.workItemId)
        }
      />
      {canSubmit ? (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={submitting}
            onClick={() =>
              void putPublicWorkItemFormDraft(publicToken, {
                values: prepareValuesForSubmit(
                  getValuesRef.current(),
                  fields
                ),
            })
          }
        >
          Save draft
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={submitting}
          onClick={() => {
            void (async () => {
              setSubmitting(true);
              setSubmitError(null);
              try {
                await postPublicWorkItemFormSubmit(publicToken, {
                  values: prepareValuesForSubmit(
                    getValuesRef.current(),
                    fields
                  ),
                  });
                  onSubmitted();
                } catch (err) {
                  const code = getApiErrorCode(err);
                  setSubmitError(
                    getApiErrorMessage(
                      err,
                      code === "FORM_ALREADY_SUBMITTED"
                        ? "This form has already been submitted."
                        : "Could not submit form."
                    )
                  );
                } finally {
                  setSubmitting(false);
                }
              })();
            }}
          >
            {submitting ? "Submitting…" : "Submit"}
          </Button>
        </div>
      ) : null}
      {submitError ? (
        <p className="mt-2 text-xs text-error-600">{submitError}</p>
      ) : null}
    </PublicShell>
  );
}

function PublicGroupStepper({
  data,
  publicToken,
  activeStep,
  setActiveStep,
  applyCustomerPrefill,
  uploadPublicFile,
  submitting,
  setSubmitting,
  onComplete,
  onReload,
}: {
  data: PublicWorkItemFormResponse;
  publicToken: string;
  activeStep: number;
  setActiveStep: (n: number) => void;
  applyCustomerPrefill: (
    fields: WorkItemFieldDefinition[],
    values: WorkItemFieldValue[]
  ) => WorkItemFieldValue[];
  uploadPublicFile: (
    fieldId: string,
    file: File,
    taskWorkItemId?: string
  ) => Promise<WorkItemFileAttachment>;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
  onComplete: () => void;
  onReload: () => void;
}) {
  const steps = data.steps ?? [];
  const step = steps[activeStep];
  const values = useMemo(() => {
    if (!step) return [];
    return applyCustomerPrefill(step.fields, step.values ?? []);
  }, [step, applyCustomerPrefill]);
  const getValuesRef = useRef<() => WorkItemFieldValue[]>(() => values);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    getValuesRef.current = () => values;
  }, [values]);

  const stepTabs = useMemo(
    () =>
      steps.map((s, i) => ({
        ...s,
        index: i,
        label: s.taskName,
      })),
    [steps]
  );

  if (!step) {
    return (
      <PublicShell data={data}>
        <p className="text-sm text-gray-500">No steps available.</p>
      </PublicShell>
    );
  }

  const stepCanSubmit = publicStepCanSubmit(step);

  return (
    <PublicShell data={data}>
      <nav
        className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-4 dark:border-gray-700"
        aria-label="Form steps"
      >
        {stepTabs.map((s) => {
          const done = s.configured && !publicStepCanSubmit(s);
          const active = s.index === activeStep;
          const disabled = !s.configured;
          return (
            <button
              key={s.workItemId}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && setActiveStep(s.index)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                active
                  ? "bg-brand-500 text-white"
                  : done
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : disabled
                      ? "bg-gray-100 text-gray-400 dark:bg-gray-800"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {s.index + 1}. {s.label}
              {done ? " ✓" : ""}
            </button>
          );
        })}
      </nav>

      {step.taskDescription ? (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          {step.taskDescription}
        </p>
      ) : null}

      {!step.configured ? (
        <p className="text-sm text-gray-500">
          This step is not available yet ({step.skipReason ?? "not configured"}).
        </p>
      ) : !stepCanSubmit ? (
        <p className="text-sm text-emerald-600">
          You have already submitted this step.
        </p>
      ) : (
        <>
          <TaskFieldForm
            fields={step.fields}
            values={values}
            savedAt={null}
            readOnly={!stepCanSubmit}
            workItemId={step.workItemId}
            hideActions
            registerGetValues={(fn) => {
              getValuesRef.current = fn;
            }}
            onSave={() => {}}
            onUploadFieldFile={(fieldId, file) =>
              uploadPublicFile(fieldId, file, step.workItemId)
            }
          />
          <div className="mt-6 flex flex-wrap gap-2">
            {activeStep > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(activeStep - 1)}
              >
                Back
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submitting}
              onClick={() =>
                void putPublicWorkItemFormDraft(publicToken, {
                  taskWorkItemId: step.workItemId,
                  values: prepareValuesForSubmit(
                    getValuesRef.current(),
                    step.fields
                  ),
                })
              }
            >
              Save draft
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={() => {
                void (async () => {
                  setSubmitting(true);
                  setSubmitError(null);
                  try {
                    const res = await postPublicWorkItemFormStepSubmit(
                      publicToken,
                      step.workItemId,
                      {
                        values: prepareValuesForSubmit(
                          getValuesRef.current(),
                          step.fields
                        ),
                      }
                    );
                    await onReload();
                    if (res.linkEdited || res.readOnly) {
                      onComplete();
                    } else if (
                      res.nextStepIndex != null &&
                      res.nextStepIndex < steps.length
                    ) {
                      setActiveStep(res.nextStepIndex);
                    }
                  } catch (err) {
                    const code = getApiErrorCode(err);
                    setSubmitError(
                      getApiErrorMessage(
                        err,
                        code === "FORM_ALREADY_SUBMITTED"
                          ? "This step has already been submitted."
                          : "Could not submit step."
                      )
                    );
                  } finally {
                    setSubmitting(false);
                  }
                })();
              }}
            >
              {submitting ? "Submitting…" : "Submit this step"}
            </Button>
          </div>
        </>
      )}
      {submitError ? (
        <p className="mt-2 text-xs text-error-600">{submitError}</p>
      ) : null}
    </PublicShell>
  );
}
