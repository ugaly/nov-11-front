"use client";

import type {
  WorkItemFieldDefinition,
  WorkItemFieldValue,
} from "@/api/types/work-item-template";
import {
  loadWorkItemTemplate,
  loadWorkItemValues,
  saveWorkItemTemplate,
  saveWorkItemValues,
} from "@/lib/work-item-field-store";
import { useCallback, useEffect, useState } from "react";

export function useWorkItemFieldState(
  engagementId: string,
  workItemId: string
) {
  const [fields, setFields] = useState<WorkItemFieldDefinition[]>([]);
  const [configuredAt, setConfiguredAt] = useState<string | null>(null);
  const [values, setValues] = useState<WorkItemFieldValue[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const t = loadWorkItemTemplate(engagementId, workItemId);
    const v = loadWorkItemValues(engagementId, workItemId);
    setFields(t.fields);
    setConfiguredAt(t.configuredAt);
    setValues(v.values);
    setSavedAt(v.savedAt);
    setHydrated(true);
  }, [engagementId, workItemId]);

  const isConfigured = fields.length > 0 && configuredAt != null;

  const persistTemplate = useCallback(
    (next: WorkItemFieldDefinition[]) => {
      saveWorkItemTemplate(engagementId, workItemId, next);
      setFields(next);
      setConfiguredAt(new Date().toISOString());
    },
    [engagementId, workItemId]
  );

  const persistValues = useCallback(
    (next: WorkItemFieldValue[]) => {
      saveWorkItemValues(engagementId, workItemId, next);
      setValues(next);
      setSavedAt(new Date().toISOString());
    },
    [engagementId, workItemId]
  );

  const clearTemplate = useCallback(() => {
    saveWorkItemTemplate(engagementId, workItemId, []);
    saveWorkItemValues(engagementId, workItemId, []);
    setFields([]);
    setConfiguredAt(null);
    setValues([]);
    setSavedAt(null);
  }, [engagementId, workItemId]);

  return {
    fields,
    values,
    configuredAt,
    savedAt,
    hydrated,
    isConfigured,
    persistTemplate,
    persistValues,
    clearTemplate,
  };
}
