import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice | Project Helper" },
      { name: "description", content: "How Sizcon Studios collects, uses, protects and shares personal data through Project Helper." },
      { property: "og:title", content: "Project Helper Privacy Notice" },
      { property: "og:description", content: "How Sizcon Studios collects, uses, protects and shares personal data through Project Helper." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://getprojecthelper.com/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage title="Privacy Notice" description="This notice explains how Sizcon Studios handles personal data when you use Project Helper.">
      <section>
        <h2>1. Who controls your data</h2>
        <p><strong>Sizcon Studios</strong>, based in India, is the data controller for personal data processed through Project Helper, except where another provider acts independently for its own purposes.</p>
      </section>
      <section>
        <h2>2. Data we collect</h2>
        <ul>
          <li><strong>Account data:</strong> name, email address, login identifiers and profile preferences.</li>
          <li><strong>Project content:</strong> ideas, prompts, documents, code, datasets, messages and other material you submit.</li>
          <li><strong>Usage data:</strong> features used, AI-credit activity, purchase status, timestamps and interaction records.</li>
          <li><strong>Technical data:</strong> IP address, device, browser, diagnostic logs and security events.</li>
          <li><strong>Support data:</strong> messages and information supplied when requesting help or exercising a right.</li>
        </ul>
        <p>Payment card information is collected and processed by Paddle rather than stored by Project Helper.</p>
      </section>
      <section>
        <h2>3. Why we use data</h2>
        <p>We process account and project data to perform our contract by providing the workspace, AI assistance, saved projects and purchased content. We process usage and technical data for our legitimate interests in security, fraud prevention, troubleshooting and product improvement. We process information where necessary to comply with tax, accounting and legal obligations. Where consent is required, such as for optional marketing or non-essential cookies, you may withdraw it.</p>
      </section>
      <section>
        <h2>4. Who receives data</h2>
        <p>We share only what is reasonably necessary with service providers supporting hosting, authentication, AI processing, analytics and customer support; professional advisers such as legal and accounting providers; and authorities when required by law. Paddle receives information needed to act as Merchant of Record for product sales, subscription management where applicable, payments, GST and other tax compliance, refunds and invoicing.</p>
      </section>
      <section>
        <h2>5. Retention</h2>
        <p>We retain account and project data while your account is active and for a reasonable period afterwards so we can provide the service, resolve disputes and meet legal obligations. Transaction and tax records may be retained for legally required periods. Data is deleted or anonymised when it is no longer needed.</p>
      </section>
      <section>
        <h2>6. Security</h2>
        <p>We use appropriate technical and organisational measures, including access controls, encrypted connections and restricted administrative access. No online service can guarantee absolute security.</p>
      </section>
      <section>
        <h2>7. International processing</h2>
        <p>Some providers may process data outside India. Where required, we use contractual and legal safeguards appropriate to the destination and the data involved.</p>
      </section>
      <section>
        <h2>8. Your rights</h2>
        <p>Subject to applicable Indian law, including the Digital Personal Data Protection Act, 2023 as brought into force, you may request access to or correction and erasure of your personal data, withdraw consent where processing relies on it, raise a grievance and nominate another person to exercise relevant rights. Other local laws may provide additional rights. Requests can be made through the support channel published within Project Helper. We may verify your identity before acting on a request.</p>
      </section>
      <section>
        <h2>9. Cookies</h2>
        <p>Project Helper uses essential browser storage and cookies for sign-in, security, preferences and core operation. If optional analytics or marketing cookies are introduced, we will provide appropriate information and choices. You can also control cookies through your browser, although blocking essential cookies may prevent sign-in or saved preferences.</p>
      </section>
      <section>
        <h2>10. Changes</h2>
        <p>We may update this notice as the service or law changes. The effective date above identifies the current version, and material changes will be communicated appropriately.</p>
      </section>
    </LegalPage>
  );
}