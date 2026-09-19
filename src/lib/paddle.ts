import { resolveProjectPrice } from "@/lib/premade.functions";

const clientToken = import.meta.env["VITE_PAYMENTS_CLIENT_TOKEN"];

type CheckoutEvent = { name?: string };

type PaddleWindow = Window & {
  Paddle?: {
    Environment: { set: (environment: "sandbox" | "production") => void };
    Initialize: (options: { token: string; eventCallback?: (event: CheckoutEvent) => void }) => void;
    Checkout: { open: (options: Record<string, unknown>) => void };
    PricePreview: (options: Record<string, unknown>) => Promise<{
      data?: {
        currencyCode?: string;
        details?: { lineItems?: Array<{ totals?: { total?: string }; formattedTotals?: { total?: string } }> };
      };
    }>;
  };
};

export type PaddleEnvironment = "sandbox" | "live";

export function getPaddleEnvironment(): PaddleEnvironment {
  return clientToken?.startsWith("test_") ? "sandbox" : "live";
}

let initialization: Promise<void> | null = null;

export function initializePaddle(): Promise<void> {
  if (initialization) return initialization;
  initialization = new Promise((resolve, reject) => {
    if (!clientToken) {
      reject(new Error("Payments are not configured yet."));
      return;
    }
    const paddleWindow = window as PaddleWindow;
    if (paddleWindow.Paddle) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    script.onload = () => {
      if (!paddleWindow.Paddle) {
        reject(new Error("Checkout could not be loaded."));
        return;
      }
      paddleWindow.Paddle.Environment.set(
        getPaddleEnvironment() === "sandbox" ? "sandbox" : "production",
      );
      paddleWindow.Paddle.Initialize({ token: clientToken });
      resolve();
    };
    script.onerror = () => reject(new Error("Checkout could not be loaded."));
    document.head.appendChild(script);
  });
  return initialization;
}

export async function getPaddlePriceId(priceId: string): Promise<string> {
  return resolveProjectPrice({ data: { priceId, environment: getPaddleEnvironment() } });
}

export async function getLocalizedProjectPrice(priceId: string): Promise<string | null> {
  return (await getLocalizedProjectPricing(priceId, 0)).salePrice;
}

export async function getLocalizedProjectPricing(
  priceId: string,
  discountPercent: number,
): Promise<{ salePrice: string | null; regularPrice: string | null }> {
  await initializePaddle();
  const paddle = (window as PaddleWindow).Paddle;
  if (!paddle) return { salePrice: null, regularPrice: null };
  const internalPriceId = await getPaddlePriceId(priceId);
  const preview = await paddle.PricePreview({ items: [{ priceId: internalPriceId, quantity: 1 }] });
  const lineItem = preview.data?.details?.lineItems?.[0];
  const salePrice = lineItem?.formattedTotals?.total ?? null;
  const amount = Number(lineItem?.totals?.total);
  const currency = preview.data?.currencyCode;
  const fraction = (100 - discountPercent) / 100;
  const regularPrice = amount > 0 && currency && fraction > 0
    ? new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount / 100 / fraction)
    : null;
  return { salePrice, regularPrice };
}

export async function openProjectCheckout(options: {
  priceId: string;
  catalogProjectId: string;
  userId: string;
  customerEmail?: string;
}): Promise<void> {
  await initializePaddle();
  const paddle = (window as PaddleWindow).Paddle;
  if (!paddle) throw new Error("Checkout could not be loaded.");
  const internalPriceId = await getPaddlePriceId(options.priceId);
  paddle.Checkout.open({
    items: [{ priceId: internalPriceId, quantity: 1 }],
    customer: options.customerEmail ? { email: options.customerEmail } : undefined,
    customData: { userId: options.userId, catalogProjectId: options.catalogProjectId },
    settings: {
      displayMode: "overlay",
      successUrl: `${window.location.origin}/checkout/success?project=${encodeURIComponent(options.catalogProjectId)}`,
      allowLogout: false,
      variant: "one-page",
      showAddDiscounts: false,
    },
  });
}