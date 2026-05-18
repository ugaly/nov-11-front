export type CategorySeries = {
  categories: string[];
  daily: { labels: string[]; series: { name: string; data: number[] }[] };
  monthly: { labels: string[]; series: { name: string; data: number[] }[] };
};
