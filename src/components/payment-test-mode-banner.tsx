import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;
  return (
    <div className="border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-xs text-warning-foreground">
      Test payments are active in preview. No real money will be charged.
    </div>
  );
}