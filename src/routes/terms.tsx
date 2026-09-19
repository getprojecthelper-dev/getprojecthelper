import { createFileRoute } from "@tanstack/react-router";

import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms and Conditions | Project Helper" },
      { name: "description", content: "Terms governing your use of Project Helper, provided by Sizcon Studios." },
      { property: "og:title", content: "Project Helper Terms and Conditions" },
      { property: "og:description", content: "Terms governing your use of Project Helper, provided by Sizcon Studios." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://getprojecthelper.com/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions" description="These terms govern your use of Project Helper and purchases made through the service.">
      <section>
        <h2>1. Who we are and acceptance</h2>
        <p>Project Helper is provided by <strong>Sizcon Studios</strong>, based in India (“we”, “us” or “our”). You contract with Sizcon Studios when you use the service. By creating an account, continuing to use Project Helper, or making a purchase, you agree to these terms. If you use the service for an organisation, you confirm that you have authority to bind it.</p>
      </section>
      <section>
        <h2>2. The service and your licence</h2>
        <p>Project Helper is an educational project workspace that helps users plan, build, document, test and present projects. We grant you a limited, non-exclusive, non-transferable licence to use the service and purchased project materials for your own lawful educational or professional work. You may not resell, redistribute, reverse engineer or bypass technical limits of the service.</p>
      </section>
      <section>
        <h2>3. Accounts and acceptable use</h2>
        <p>You must provide accurate information, protect your login credentials and remain responsible for activity on your account. You must not:</p>
        <ul>
          <li>use the service unlawfully, fraudulently, for spam or to harm another person;</li>
          <li>upload content you do not have permission to use or infringe intellectual-property rights;</li>
          <li>introduce malware, probe security, scrape the service or interfere with its operation;</li>
          <li>generate illegal content, deceptive deepfakes, hateful abuse, malware or attempts to bypass safety controls;</li>
          <li>misrepresent AI-assisted work as independently completed where academic or professional rules require disclosure.</li>
        </ul>
      </section>
      <section>
        <h2>4. Your content and AI output</h2>
        <p>You retain your rights in prompts, files and project content you provide. You grant us a limited licence to host and process that content only to operate, secure and improve the service. Subject to applicable law and third-party rights, you may use outputs created for you.</p>
        <p>AI output can be inaccurate, incomplete or unsuitable. You are responsible for your prompts, verifying outputs, testing code, checking citations and using results lawfully. Project Helper does not replace qualified academic, legal, financial, medical or other professional advice. We may filter or remove content and restrict accounts to enforce these terms. Rights holders may report suspected infringement through our published support channel; repeated infringement may lead to termination.</p>
      </section>
      <section>
        <h2>5. Ownership</h2>
        <p>Sizcon Studios and its licensors retain all rights in Project Helper, including its software, design, documentation, branding and original catalogue material. These terms do not transfer ownership of the service to you.</p>
      </section>
      <section>
        <h2>6. Payments, GST and refunds</h2>
        <p>Prices are shown in the currency presented at checkout. Applicable Indian GST or other taxes may be calculated and collected as required. Credit packs and project purchases are one-time purchases unless a checkout expressly states otherwise.</p>
        <p>Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle provides all customer service inquiries and handles returns. Payment, billing, tax, cancellation and refund mechanics are also governed by <a href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noreferrer">Paddle’s Buyer Terms</a> and our <a href="/refund-policy">Refund Policy</a>.</p>
      </section>
      <section>
        <h2>7. Availability and changes</h2>
        <p>We aim to provide a reliable service, but do not guarantee uninterrupted, error-free or permanently available access. We may update, suspend or discontinue features where reasonably necessary. Material changes to these terms will be communicated through the service or by another appropriate method.</p>
      </section>
      <section>
        <h2>8. Suspension and termination</h2>
        <p>We may suspend or terminate access for a material breach, non-payment, security or fraud risk, or repeated or serious policy violations. You may stop using the service at any time. When access ends, content may be deleted after a reasonable period, subject to legal and operational retention requirements.</p>
      </section>
      <section>
        <h2>9. Warranties and liability</h2>
        <p>To the fullest extent permitted by law, the service is provided “as is” without implied warranties of merchantability or fitness for a particular purpose. We are not liable for indirect, consequential or special loss, including lost profits, data or goodwill. Our aggregate liability relating to the service will not exceed the amount you paid us during the 12 months before the event giving rise to the claim. Nothing excludes liability that cannot legally be excluded, including liability for fraud, death or personal injury caused by negligence.</p>
      </section>
      <section>
        <h2>10. Governing law</h2>
        <p>These terms are governed by the laws of India. Courts with competent jurisdiction in India will have jurisdiction, subject to any mandatory consumer rights that apply where you live.</p>
      </section>
    </LegalPage>
  );
}