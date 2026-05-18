"use client";

import DashboardSectionLead from "@/components/dashboard/DashboardSectionLead";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  setupListTableSectionClass,
  setupListTdClass,
  setupListThClass,
  setupTableClass,
  setupTableRowClass,
} from "@/components/setup/setup-table-styles";
import {
  DUMMY_RECENT_ENGAGEMENTS,
  DUMMY_RECENT_WORK_ITEMS,
} from "@/lib/dashboard-dummy-data";
import { ClipboardList, ListTodo } from "lucide-react";

function engagementStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "active" || s === "completed")
    return { color: "success" as const, label: status };
  if (s === "draft") return { color: "light" as const, label: status };
  if (s === "on hold") return { color: "warning" as const, label: status };
  if (s === "cancelled") return { color: "error" as const, label: status };
  return { color: "info" as const, label: status };
}

function workStatusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "done") return { color: "success" as const, label: status };
  if (s === "in progress") return { color: "info" as const, label: status };
  if (s === "blocked") return { color: "error" as const, label: status };
  if (s === "pending") return { color: "warning" as const, label: status };
  return { color: "light" as const, label: status };
}

export default function DashboardTablesSection() {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <DashboardSectionLead
            icon={<ClipboardList className="size-5" aria-hidden />}
            title="Recent engagements"
            subtitle="Latest client engagements · sample data"
          />
        </div>
        <div className={`px-4 pb-5 sm:px-6 ${setupListTableSectionClass}`}>
          <Table className={setupTableClass}>
            <TableHeader>
              <TableRow>
                {["Reference", "Customer", "Catalog", "Status", "Time"].map((h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className={`${setupListThClass} whitespace-nowrap`}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {DUMMY_RECENT_ENGAGEMENTS.map((row) => {
                const b = engagementStatusBadge(row.status);
                return (
                  <TableRow key={row.reference} className={setupTableRowClass}>
                    <TableCell
                      className={`${setupListTdClass} font-mono text-xs font-semibold`}
                    >
                      {row.reference}
                    </TableCell>
                    <TableCell className={`${setupListTdClass} font-medium`}>
                      {row.customer}
                    </TableCell>
                    <TableCell className={`${setupListTdClass} max-w-[10rem] text-xs`}>
                      <span className="block truncate" title={row.catalog}>
                        {row.catalog}
                      </span>
                    </TableCell>
                    <TableCell className={setupListTdClass}>
                      <Badge size="sm" color={b.color}>
                        {b.label}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`${setupListTdClass} text-xs text-gray-500`}
                    >
                      {row.time}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
          <DashboardSectionLead
            icon={<ListTodo className="size-5" aria-hidden />}
            title="Recent work items"
            subtitle="Latest tasks across engagements · sample data"
          />
        </div>
        <div className={`px-4 pb-5 sm:px-6 ${setupListTableSectionClass}`}>
          <Table className={setupTableClass}>
            <TableHeader>
              <TableRow>
                {["Engagement", "Task", "Department", "Status", "Time"].map((h) => (
                  <TableCell
                    key={h}
                    isHeader
                    className={`${setupListThClass} whitespace-nowrap`}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {DUMMY_RECENT_WORK_ITEMS.map((row, i) => {
                const b = workStatusBadge(row.status);
                return (
                  <TableRow key={`${row.engagement}-${i}`} className={setupTableRowClass}>
                    <TableCell className={`${setupListTdClass} max-w-[8rem] text-xs`}>
                      <span className="block truncate" title={row.engagement}>
                        {row.engagement}
                      </span>
                    </TableCell>
                    <TableCell className={`${setupListTdClass} font-medium`}>
                      {row.task}
                    </TableCell>
                    <TableCell className={`${setupListTdClass} text-xs`}>
                      {row.department}
                    </TableCell>
                    <TableCell className={setupListTdClass}>
                      <Badge size="sm" color={b.color}>
                        {b.label}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`${setupListTdClass} text-xs text-gray-500`}
                    >
                      {row.time}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
