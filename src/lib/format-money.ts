import type { MoneyAmountDto } from "@/api/types/template-config";

export function formatMoneyTotals(
  totals: MoneyAmountDto[] | null | undefined
): string {
  if (!totals?.length) return "—";
  return totals
    .map(
      (t) =>
        `${t.currency} ${t.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    )
    .join(" · ");
}
