import { getPaddleEnvironment } from "@/lib/paddle";

export function PaymentTestModeBanner() {
  if (getPaddleEnvironment() !== "sandbox") return null;
  return (
    <div className="workspace-preview-banner border-b px-4 py-2 text-center text-xs">
      Test payments are active in preview. No real money will be charged.
    </div>
  );
}
