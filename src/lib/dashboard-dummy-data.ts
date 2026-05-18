import type { CategorySeries } from "@/lib/dashboard-chart-types";
import {
  formatDayLabel,
  lastNDays,
  lastNMonths,
} from "@/lib/dashboard-period";

/** Placeholder dashboard data — replace with API when endpoints are ready. */

const SAMPLE_CATEGORIES = [
  "Company secretarial",
  "Tax & compliance",
  "Legal advisory",
  "Formation & registry",
] as const;

/** Category performance chart — engagements by category (daily + monthly). */
export function getDummyCategorySeries(): CategorySeries {
  const dayLabels = lastNDays(7).map(formatDayLabel);
  const monthlyLabels = lastNMonths(6).map((m) => m.label);

  const dailyValues: number[][] = [
    [3, 5, 4, 6, 8, 2, 4],
    [1, 2, 3, 4, 5, 1, 2],
    [0, 1, 2, 3, 2, 1, 1],
    [2, 3, 4, 3, 5, 2, 3],
  ];
  const monthlyValues: number[][] = [
    [12, 14, 11, 16, 18, 15],
    [8, 9, 10, 11, 12, 10],
    [5, 6, 7, 6, 8, 7],
    [10, 11, 9, 13, 14, 12],
  ];

  return {
    categories: [...SAMPLE_CATEGORIES],
    daily: {
      labels: dayLabels,
      series: SAMPLE_CATEGORIES.map((name, i) => ({
        name,
        data: dailyValues[i] ?? [],
      })),
    },
    monthly: {
      labels: monthlyLabels,
      series: SAMPLE_CATEGORIES.map((name, i) => ({
        name,
        data: monthlyValues[i] ?? [],
      })),
    },
  };
}

export const DUMMY_WORK_BY_CATEGORY_HOURLY = {
  labels: ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "Now"],
  series: [
    { name: "Company secretarial", data: [2, 4, 6, 5, 8, 7, 9, 6] },
    { name: "Tax & compliance", data: [1, 3, 4, 6, 5, 4, 6, 5] },
    { name: "Legal advisory", data: [0, 2, 3, 4, 3, 5, 4, 3] },
    { name: "Formation & registry", data: [3, 2, 5, 4, 6, 5, 7, 8] },
  ],
};

export const DUMMY_ENGAGEMENT_STATUS_MIX = {
  labels: ["Active", "Draft", "On hold", "Completed"],
  series: [48, 12, 6, 34],
};

export const DUMMY_ENGAGEMENTS_WEEKLY = {
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  series: [{ name: "New engagements", data: [4, 6, 5, 8, 7, 2, 1] }],
};

export type DummyRecentEngagement = {
  reference: string;
  customer: string;
  catalog: string;
  category: string;
  status: string;
  time: string;
};

export const DUMMY_RECENT_ENGAGEMENTS: DummyRecentEngagement[] = [
  {
    reference: "ENG-2026-0142",
    customer: "Kilimanjaro Trading Co.",
    catalog: "Formation of new company in Tanzania",
    category: "Company secretarial",
    status: "Active",
    time: "10:24",
  },
  {
    reference: "ENG-2026-0140",
    customer: "Serengeti Holdings Ltd",
    catalog: "Annual returns & filings",
    category: "Company secretarial",
    status: "Draft",
    time: "09:58",
  },
  {
    reference: "ENG-2026-0138",
    customer: "Coastal Ventures",
    catalog: "VAT registration & returns",
    category: "Tax & compliance",
    status: "On hold",
    time: "09:31",
  },
  {
    reference: "ENG-2026-0135",
    customer: "Urban Retail TZ",
    catalog: "Share transfer & board resolutions",
    category: "Legal advisory",
    status: "Active",
    time: "08:47",
  },
  {
    reference: "ENG-2026-0132",
    customer: "East Africa Imports Ltd",
    catalog: "Company secretarial retainer",
    category: "Company secretarial",
    status: "Completed",
    time: "08:12",
  },
];

export type DummyRecentWorkItem = {
  engagement: string;
  task: string;
  department: string;
  status: string;
  time: string;
};

export const DUMMY_RECENT_WORK_ITEMS: DummyRecentWorkItem[] = [
  {
    engagement: "Formation of new company",
    task: "Prepare memorandum & articles",
    department: "Corporate",
    status: "In progress",
    time: "10:18",
  },
  {
    engagement: "Annual returns & filings",
    task: "File annual return with BRELA",
    department: "Compliance",
    status: "Pending",
    time: "10:02",
  },
  {
    engagement: "VAT registration",
    task: "Submit TRA application",
    department: "Tax",
    status: "Done",
    time: "09:44",
  },
  {
    engagement: "Share transfer",
    task: "Draft transfer forms",
    department: "Legal",
    status: "In progress",
    time: "09:20",
  },
  {
    engagement: "Secretarial retainer",
    task: "Board meeting minutes",
    department: "Corporate",
    status: "Blocked",
    time: "08:55",
  },
];
