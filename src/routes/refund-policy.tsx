import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund Policy | Project Helper" },
      { name: "description", content: "The 30-day refund policy for Project Helper purchases from Sizcon Studios." },
      { property: "og:title", content: "Project Helper Refund Policy" },
      { property: "og:description", content: "The 30-day refund policy for Project Helper purchases from Sizcon Studios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://getprojecthelper.com/refund-policy" }],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" description="A straightforward 30-day refund policy for purchases made through Project Helper.">
      <section>
        <h2>30-day money-back guarantee</h2>
        <p>Sizcon Studios offers a 30-day money-back guarantee. If you are not satisfied with a credit pack or project purchase, you may request a full refund within 30 days of the order date.</p>
      </section>
      <section>
        <h2>How to request a refund</h2>
        <p>Payments and refunds are handled by Paddle, our Merchant of Record. To request a refund, visit <a href="https://paddle.net" target="_blank" rel="noreferrer">paddle.net</a> and use the email address associated with your purchase. Paddle may ask for your transaction details to identify the order.</p>
      </section>
      <section>
        <h2>Processing</h2>
        <p>Approved refunds are returned to the original payment method. Bank processing times can vary. Where required, applicable taxes, including GST, are adjusted as part of the refund.</p>
      </section>
      <section>
        <h2>Your statutory rights</h2>
        <p>This policy does not limit rights or remedies available under applicable consumer-protection law. Paddle’s <a href="https://www.paddle.com/legal/refund-policy" target="_blank" rel="noreferrer">Refund Policy</a> also applies to purchases processed by Paddle.</p>
      </section>
    </LegalPage>
  );
}