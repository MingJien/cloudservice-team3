import { Badge } from "@/components/ui/badge";
import type { BillingCycle } from "./types";

export const billingCycleLabels: Record<BillingCycle, string> = {
  Monthly: "Hàng tháng",
  Quarterly: "Hàng quý",
  Yearly: "Hàng năm",
};

export const billingCycles: readonly BillingCycle[] = ["Monthly", "Quarterly", "Yearly"];

const billingCycleVariants: Record<BillingCycle, "info" | "warning" | "success"> = {
  Monthly: "info",
  Quarterly: "warning",
  Yearly: "success",
};

export function BillingCycleBadge({ cycle }: { cycle: BillingCycle }) {
  return <Badge variant={billingCycleVariants[cycle]}>{billingCycleLabels[cycle]}</Badge>;
}
