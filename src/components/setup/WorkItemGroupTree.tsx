"use client";

import type { WorkGroupSection } from "@/lib/work-item-tree";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

export default function WorkItemGroupTree({
  sections,
  renderTask,
  renderGroupActions,
}: {
  sections: WorkGroupSection[];
  renderTask: (
    task: WorkGroupSection["tasks"][number]["task"],
    ctx: { taskRoman: string; groupNumber: number; groupTitle: string | null }
  ) => ReactNode;
  /** Shown on group header (e.g. share GROUP form link). */
  renderGroupActions?: (section: WorkGroupSection) => ReactNode;
}) {
  const groupKeys = useMemo(
    () =>
      sections
        .filter((s) => s.groupNumber > 0)
        .map((s) => s.key),
    [sections]
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const key of groupKeys) init[key] = false;
    return init;
  });

  function toggle(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function isExpanded(section: WorkGroupSection) {
    if (section.groupNumber === 0) return true;
    return expanded[section.key] !== false;
  }

  return (
    <div className="space-y-1">
      {sections.map((section, sectionIdx) => {
        const isStandalone = section.groupNumber === 0;
        const isLast = sectionIdx === sections.length - 1;
        const open = isExpanded(section);
        const doneCount = section.tasks.filter(
          (t) => t.task.status === "DONE"
        ).length;

        return (
          <div key={section.key} className="relative flex items-start gap-3">
            {!isStandalone ? (
              <div className="relative w-9 shrink-0 self-stretch">
                {sectionIdx > 0 ? (
                  <div
                    className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-brand-200 dark:bg-brand-800"
                    style={{ height: "0.625rem" }}
                    aria-hidden
                  />
                ) : null}
                <span className="relative z-10 mx-auto mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white shadow ring-2 ring-brand-100 dark:ring-brand-950/80">
                  {section.groupNumber}
                </span>
                {open && section.tasks.length > 0 ? (
                  <div
                    className="absolute left-1/2 top-[2.125rem] bottom-0 w-px -translate-x-1/2 bg-brand-200 dark:bg-brand-800"
                    aria-hidden
                  />
                ) : !isLast ? (
                  <div
                    className="absolute left-1/2 top-[2.125rem] bottom-0 w-px -translate-x-1/2 bg-brand-100 dark:bg-brand-900"
                    aria-hidden
                  />
                ) : null}
              </div>
            ) : (
              <div className="w-9 shrink-0" />
            )}

            <div className={`min-w-0 flex-1 ${isLast ? "" : "pb-4"}`}>
              {!isStandalone ? (
                <button
                  type="button"
                  onClick={() => toggle(section.key)}
                  aria-expanded={open}
                  className="group flex w-full items-center gap-2 rounded-lg border border-transparent px-1 py-1.5 text-left transition-colors hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800/50"
                >
                  {open ? (
                    <ChevronDown
                      className="size-4 shrink-0 text-gray-400"
                      aria-hidden
                    />
                  ) : (
                    <ChevronRight
                      className="size-4 shrink-0 text-gray-400"
                      aria-hidden
                    />
                  )}
                  <h5 className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {section.title ?? `Group ${section.groupNumber}`}
                  </h5>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {doneCount}/{section.tasks.length} done
                  </span>
                  {renderGroupActions && section.groupNumber > 0 ? (
                    <span
                      className="shrink-0"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      {renderGroupActions(section)}
                    </span>
                  ) : null}
                </button>
              ) : null}

              {open ? (
                <ul
                  className={`space-y-3 ${!isStandalone ? "mt-2" : ""}`}
                >
                  {section.tasks.map(({ task, taskRoman }, taskIdx) => {
                    const isLastTask = taskIdx === section.tasks.length - 1;
                    return (
                      <li key={task.id} className="relative flex gap-2">
                        <div className="relative flex w-8 shrink-0 flex-col items-center">
                          {!isStandalone ? (
                            <>
                              <span
                                className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-brand-100 dark:bg-brand-900/80"
                                style={{
                                  height: isLastTask ? "1.25rem" : "100%",
                                }}
                                aria-hidden
                              />
                              <span
                                className="absolute left-1/2 top-5 h-px w-5 -translate-y-1/2 bg-brand-200 dark:bg-brand-800"
                                aria-hidden
                              />
                            </>
                          ) : null}
                          <span
                            className={`relative z-10 flex size-7 items-center justify-center rounded-md border border-brand-200 bg-white font-serif text-xs font-semibold text-brand-700 dark:border-brand-700 dark:bg-gray-900 dark:text-brand-300 ${isStandalone ? "" : "mt-3"}`}
                            title={`Task ${taskRoman}`}
                          >
                            {taskRoman}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          {renderTask(task, {
                            taskRoman,
                            groupNumber: section.groupNumber,
                            groupTitle: section.title,
                          })}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : !isStandalone ? (
                <p className="mt-1 pl-6 text-xs text-gray-400">
                  {section.tasks.length} task
                  {section.tasks.length === 1 ? "" : "s"} hidden — click to
                  expand
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
