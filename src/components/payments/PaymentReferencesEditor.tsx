"use client";

import type {
  PaymentReferenceDto,
  PaymentReferenceKind,
} from "@/api/types/payment";
import ReferenceBox from "@/components/shared/ReferenceBox";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Plus } from "lucide-react";
import { useState } from "react";

const KIND_OPTIONS: { value: PaymentReferenceKind; label: string }[] = [
  { value: "INVOICE", label: "Invoice" },
  { value: "ENGAGEMENT", label: "Engagement" },
  { value: "CONTROL_NUMBER", label: "Control no." },
  { value: "OTHER", label: "Other" },
];

export function referenceKindLabel(kind: PaymentReferenceKind): string {
  return KIND_OPTIONS.find((o) => o.value === kind)?.label ?? kind;
}

export default function PaymentReferencesEditor({
  references,
  editable,
  onChange,
}: {
  references: PaymentReferenceDto[];
  editable: boolean;
  onChange?: (next: PaymentReferenceDto[]) => void;
}) {
  const [kind, setKind] = useState<PaymentReferenceKind>("INVOICE");
  const [value, setValue] = useState("");

  function removeAt(index: number) {
    if (!onChange) return;
    onChange(references.filter((_, i) => i !== index));
  }

  function addReference() {
    const trimmed = value.trim();
    if (!trimmed || !onChange) return;
    onChange([
      ...references,
      {
        kind,
        value: trimmed,
      },
    ]);
    setValue("");
  }

  return (
    <div className="space-y-3">
      {references.length === 0 ? (
        <p className="text-sm text-gray-500">No linked references.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {references.map((ref, index) => (
            <ReferenceBox
              key={ref.id ?? `${ref.kind}-${ref.value}-${index}`}
              label={referenceKindLabel(ref.kind)}
              value={ref.value}
              readOnly={!editable}
              onRemove={editable ? () => removeAt(index) : undefined}
            />
          ))}
        </div>
      )}
      {editable ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Add reference
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <div className="min-w-[8rem] flex-1">
              <Label className="text-xs">Type</Label>
              <select
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value as PaymentReferenceKind)
                }
              >
                {KIND_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[10rem] flex-[2]">
              <Label className="text-xs">Reference</Label>
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. INV-2026-0042"
                className="mt-1"
              />
            </div>
            <Button type="button" size="sm" variant="outline" onClick={addReference}>
              <Plus className="mr-1 size-3.5" aria-hidden />
              Add
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
