"use client";

import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import React, { useState } from "react";

type ExportListMenuProps = {
  disabled?: boolean;
  /** Button label (default: Export list). */
  label?: string;
  onExportPdf: () => void | Promise<void>;
  onExportExcel: () => void | Promise<void>;
};

export default function ExportListMenu({
  disabled,
  label = "Export list",
  onExportPdf,
  onExportExcel,
}: ExportListMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function runExport(fn: () => void | Promise<void>) {
    setExporting(true);
    setOpen(false);
    try {
      await fn();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || exporting}
        onClick={() => setOpen((v) => !v)}
        className="dropdown-toggle"
      >
        <Download className="mr-1.5 size-4" aria-hidden />
        {exporting ? "Exporting…" : label}
      </Button>
      <Dropdown isOpen={open} onClose={() => setOpen(false)} className="w-48 p-2">
        <DropdownItem
          onItemClick={() => void runExport(onExportPdf)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <FileText className="size-4 shrink-0 text-error-500" aria-hidden />
          Download PDF
        </DropdownItem>
        <DropdownItem
          onItemClick={() => void runExport(onExportExcel)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
        >
          <FileSpreadsheet
            className="size-4 shrink-0 text-success-600"
            aria-hidden
          />
          Download Excel
        </DropdownItem>
      </Dropdown>
    </div>
  );
}
