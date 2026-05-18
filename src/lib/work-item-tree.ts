import type {
  EngagementWorkItemResponse,
  WorkItemStatus,
} from "@/api/types/template-config";

export interface WorkItemTreeNode extends EngagementWorkItemResponse {
  children: WorkItemTreeNode[];
}

const ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
] as const;

export function toRoman(index: number): string {
  return ROMAN[index] ?? String(index + 1);
}

const LOWER_ROMAN = [
  "i",
  "ii",
  "iii",
  "iv",
  "v",
  "vi",
  "vii",
  "viii",
  "ix",
  "x",
  "xi",
  "xii",
  "xiii",
  "xiv",
  "xv",
] as const;

/** Task index within a group (i, ii, iii…) */
export function toTaskRoman(index: number): string {
  return LOWER_ROMAN[index] ?? String(index + 1);
}

export interface WorkGroupSection {
  key: string;
  groupNumber: number;
  title: string | null;
  groupRoman: string | null;
  tasks: {
    task: EngagementWorkItemResponse;
    taskRoman: string;
  }[];
}

export function buildWorkGroupSections(
  tree: WorkItemTreeNode[]
): WorkGroupSection[] {
  const sections: WorkGroupSection[] = [];

  for (let i = 0; i < tree.length; i++) {
    const root = tree[i]!;
    if (root.nodeType === "TASK") {
      sections.push({
        key: root.id,
        groupNumber: 0,
        title: null,
        groupRoman: null,
        tasks: [{ task: root, taskRoman: toTaskRoman(0) }],
      });
      continue;
    }

    const tasks: WorkGroupSection["tasks"] = [];
    const collectTasks = (node: WorkItemTreeNode) => {
      if (node.nodeType === "TASK") {
        tasks.push({ task: node, taskRoman: toTaskRoman(tasks.length) });
        return;
      }
      for (const child of node.children) collectTasks(child);
    };
    for (const child of root.children) collectTasks(child);

    if (tasks.length > 0) {
      sections.push({
        key: root.id,
        groupNumber: i + 1,
        title: root.name,
        groupRoman: toRoman(i),
        tasks,
      });
    }
  }

  return sections;
}

export function buildWorkItemTree(
  items: EngagementWorkItemResponse[]
): WorkItemTreeNode[] {
  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
  const nodes = new Map<string, WorkItemTreeNode>(
    sorted.map((item) => [item.id, { ...item, children: [] }])
  );
  const roots: WorkItemTreeNode[] = [];

  for (const item of sorted) {
    const node = nodes.get(item.id)!;
    if (item.parentId && nodes.has(item.parentId)) {
      nodes.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export interface WorkItemCounts {
  groups: number;
  tasks: number;
  done: number;
  inProgress: number;
  pending: number;
  blocked: number;
  notApplicable: number;
}

export function countWorkItems(
  items: EngagementWorkItemResponse[]
): WorkItemCounts {
  const tasks = items.filter((i) => i.nodeType === "TASK");
  const count = (status: WorkItemStatus) =>
    tasks.filter((t) => t.status === status).length;

  return {
    groups: items.filter((i) => i.nodeType === "GROUP").length,
    tasks: tasks.length,
    done: count("DONE"),
    inProgress: count("IN_PROGRESS"),
    pending: count("PENDING"),
    blocked: count("BLOCKED"),
    notApplicable: count("NOT_APPLICABLE"),
  };
}

/** Task nodes with their parent group label for the work panel. */
export interface TaskWithGroup {
  task: EngagementWorkItemResponse;
  groupLabel: string | null;
  groupRoman: string | null;
}

export function listTasksWithGroups(
  tree: WorkItemTreeNode[]
): TaskWithGroup[] {
  const result: TaskWithGroup[] = [];

  tree.forEach((root, rootIndex) => {
    if (root.nodeType === "TASK") {
      result.push({
        task: root,
        groupLabel: null,
        groupRoman: null,
      });
      return;
    }

    const roman = toRoman(rootIndex);
    const walk = (node: WorkItemTreeNode, groupName: string, groupRoman: string) => {
      if (node.nodeType === "TASK") {
        result.push({
          task: node,
          groupLabel: groupName,
          groupRoman,
        });
        return;
      }
      for (const child of node.children) {
        walk(child, groupName, groupRoman);
      }
    };

    for (const child of root.children) {
      if (child.nodeType === "TASK") {
        result.push({
          task: child,
          groupLabel: root.name,
          groupRoman: roman,
        });
      } else {
        walk(child, root.name, roman);
      }
    }
  });

  return result;
}
