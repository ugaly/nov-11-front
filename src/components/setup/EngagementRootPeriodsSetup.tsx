"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  setEngagementRootPeriods,
  suggestEngagementPeriods,
} from "@/api/template-config/template-config.api";
import type {
  EngagementPeriodInstanceDto,
  PeriodSuggestionDto,
} from "@/api/types/template-config";
import DatePicker from "@/components/form/date-picker";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { useEffect, useState } from "react";

type PeriodDraft = {
  id?: string;
  label: string;
  periodStart: string;
  periodEnd: string | null;
  sortOrder: number;
};

function toDrafts(suggestions: PeriodSuggestionDto[]): PeriodDraft[] {
  return suggestions.map((s) => ({
    label: s.label,
    periodStart: s.periodStart,
    periodEnd: s.periodEnd,
    sortOrder: s.sortOrder,
  }));
}

function fromSavedPeriods(periods: EngagementPeriodInstanceDto[]): PeriodDraft[] {
  return periods.map((p) => ({
    id: p.id,
    label: p.label,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    sortOrder: p.sortOrder,
  }));
}

export default function EngagementRootPeriodsSetup({
  companyId,
  catalogId,
  engagementId,
  rootNodeId,
  rootName,
  initialPeriods,
  mode = "setup",
  onSaved,
  onCancel,
}: {
  companyId: string;
  catalogId: string;
  engagementId: string;
  rootNodeId: string;
  rootName: string;
  initialPeriods?: EngagementPeriodInstanceDto[];
  mode?: "setup" | "edit";
  onSaved: () => void | Promise<void>;
  onCancel?: () => void;
}) {
  const isEdit = mode === "edit";

  const [anchorDate, setAnchorDate] = useState(
    () => initialPeriods?.[0]?.periodStart ?? ""
  );
  const [drafts, setDrafts] = useState<PeriodDraft[]>(() =>
    initialPeriods?.length ? fromSavedPeriods(initialPeriods) : []
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialPeriods?.length) {
      setDrafts(fromSavedPeriods(initialPeriods));
      setAnchorDate(initialPeriods[0]?.periodStart ?? "");
    }
  }, [initialPeriods]);

  async function generateAll() {
    setLoading(true);
    setError(null);
    try {
      const suggestions = await suggestEngagementPeriods(
        companyId,
        catalogId,
        rootNodeId,
        { periodStart: anchorDate.trim() || undefined }
      );
      setDrafts(toDrafts(suggestions));
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not generate periods."));
    } finally {
      setLoading(false);
    }
  }

  function addPeriod() {
    const nextSort = drafts.length;
    setDrafts((prev) => [
      ...prev,
      {
        label: `Period ${nextSort + 1}`,
        periodStart: anchorDate.trim() || new Date().toISOString().slice(0, 10),
        periodEnd: null,
        sortOrder: nextSort,
      },
    ]);
  }

  function updateLabel(index: number, label: string) {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, label } : d))
    );
  }

  function removePeriod(index: number) {
    setDrafts((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((d, i) => ({ ...d, sortOrder: i }))
    );
  }

  async function save() {
    if (drafts.length === 0) {
      setError("Add at least one period tab.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setEngagementRootPeriods(companyId, engagementId, rootNodeId, {
        periodStart: anchorDate.trim() || undefined,
        periods: drafts.map((d) => ({
          ...(d.id ? { id: d.id } : {}),
          catalogNodeId: rootNodeId,
          label: d.label.trim() || d.periodStart,
          periodStart: d.periodStart,
          periodEnd: d.periodEnd,
          sortOrder: d.sortOrder,
        })),
      });
      await onSaved();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not save periods."));
    } finally {
      setSaving(false);
    }
  }

  const shellClass = isEdit
    ? "rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900/40"
    : "rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/20";

  return (
    <div className={shellClass}>
      <p
        className={
          isEdit
            ? "text-sm font-medium text-gray-800 dark:text-white/90"
            : "text-sm font-medium text-amber-900 dark:text-amber-100"
        }
      >
        {isEdit ? `Edit period tabs — ${rootName}` : `Configure periods for ${rootName}`}
      </p>
      <p
        className={
          isEdit
            ? "mt-1 text-xs text-gray-500"
            : "mt-1 text-xs text-amber-800/90 dark:text-amber-200/90"
        }
      >
        {isEdit
          ? "Rename tabs, add new ones, or remove empty tabs. Tabs with saved task data cannot be removed."
          : "Generate all tabs at once from a start date, or add them one by one. You can rename each tab before saving."}
      </p>

      {error ? <p className="mt-2 text-xs text-error-600">{error}</p> : null}

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <DatePicker
            id={`period-anchor-${rootNodeId}-${mode}`}
            label="Cycle anchor"
            placeholder="Start date"
            value={anchorDate}
            onValueChange={setAnchorDate}
          />
        </div>
        {!isEdit ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => void generateAll()}
          >
            {loading ? "Generating…" : "Generate all tabs"}
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="outline" onClick={addPeriod}>
          Add one tab
        </Button>
      </div>

      {drafts.length > 0 ? (
        <div className="mt-3 space-y-2">
          {drafts.map((d, index) => (
            <div
              key={d.id ?? `${d.sortOrder}-${index}`}
              className="flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/50"
            >
              <Input
                value={d.label}
                onChange={(e) => updateLabel(index, e.target.value)}
                placeholder="Tab name"
                className="min-w-[10rem] flex-1"
              />
              <span className="text-xs text-gray-500">
                {d.periodEnd
                  ? `${d.periodStart} → ${d.periodEnd}`
                  : d.periodStart}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => removePeriod(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-1">
            {onCancel ? (
              <Button type="button" size="sm" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Save period tabs"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
