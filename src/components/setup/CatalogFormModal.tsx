"use client";

import { getApiErrorMessage } from "@/api/errors";
import {
  createServiceCatalog,
  listServiceCategories,
} from "@/api/template-config/template-config.api";
import type {
  CreateServiceCatalogRequest,
  ServiceCategoryResponse,
} from "@/api/types/template-config";
import PricingFields from "@/components/setup/PricingFields";
import { setupFormModalClass } from "@/components/setup/setupFormModal";
import RecurrenceFields from "@/components/setup/RecurrenceFields";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { useTemplateOptions } from "@/hooks/useTemplateOptions";
import {
  appendRecurrenceFields,
  emptyRecurrenceForm,
  type RecurrenceFormState,
} from "@/lib/template-recurrence";
import {
  appendPricingFields,
  emptyPricingForm,
  type PricingFormState,
} from "@/lib/template-pricing";
import React, { useEffect, useState } from "react";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function CatalogFormModal({
  open,
  companyId,
  categoryId: fixedCategoryId,
  onClose,
  onCreated,
}: {
  open: boolean;
  companyId: string;
  /** When set, catalog is created under this category only. */
  categoryId?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { currencies, timelineUnits, recurrenceTypes } =
    useTemplateOptions(companyId);
  const [categories, setCategories] = useState<ServiceCategoryResponse[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("1");
  const [pricing, setPricing] = useState<PricingFormState>(emptyPricingForm);
  const [recurrence, setRecurrence] = useState<RecurrenceFormState>(
    emptyRecurrenceForm
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedCategoryId = fixedCategoryId ?? categoryId;

  useEffect(() => {
    if (!open || fixedCategoryId) return;
    void (async () => {
      try {
        const list = await listServiceCategories(companyId);
        setCategories(list);
        if (list[0]) setCategoryId(list[0].id);
      } catch {
        setError("Could not load categories.");
      }
    })();
  }, [open, companyId, fixedCategoryId]);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setSortOrder("1");
      setPricing(emptyPricingForm());
      setRecurrence(emptyRecurrenceForm());
      setError(null);
      if (fixedCategoryId) setCategoryId(fixedCategoryId);
    }
  }, [open, fixedCategoryId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    if (!resolvedCategoryId) {
      setError("Service category is required.");
      return;
    }
    if (
      recurrence.recurrenceType === "CUSTOM" &&
      !recurrence.recurrenceIntervalValue.trim()
    ) {
      setError("Custom recurrence requires an interval value.");
      return;
    }
    const body = appendRecurrenceFields(
      appendPricingFields<CreateServiceCatalogRequest>(
        {
          name: trimmed,
          description: description.trim() || undefined,
          sortOrder: Number.parseInt(sortOrder, 10) || undefined,
          recurrenceType: recurrence.recurrenceType,
        },
        pricing
      ),
      recurrence
    );
    setSubmitting(true);
    setError(null);
    try {
      await createServiceCatalog(companyId, resolvedCategoryId, body);
      onCreated();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create catalog."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={onClose} className={setupFormModalClass}>
      <h3 className="text-lg font-semibold">New service catalog</h3>
      <p className="mt-1 text-xs text-gray-500">
        Code is generated automatically from the name.
      </p>
      <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        {error ? <p className="text-sm text-error-600">{error}</p> : null}
        {!fixedCategoryId ? (
          <div>
            <Label>Service category *</Label>
            <select
              className={selectClass}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <Label>Sort order</Label>
          <Input
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </div>
        <RecurrenceFields
          value={recurrence}
          onChange={setRecurrence}
          recurrenceTypes={recurrenceTypes}
        />
        <PricingFields
          value={pricing}
          onChange={setPricing}
          currencies={currencies}
          timelineUnits={timelineUnits}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Saving…" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
