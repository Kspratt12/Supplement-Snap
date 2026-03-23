import type { Metadata } from "next"
import { LegalLayout } from "../../lib/legal-layout"

export const metadata: Metadata = { title: "Refund Policy – Supplement Snap" }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-zinc-900">{title}</h2>
      {children}
    </section>
  )
}

export default function RefundPolicyPage() {
  return (
    <LegalLayout title="Refund Policy">
      <Section title="Overview">
        <p>We want every customer to have a positive experience with Supplement Snap. This policy outlines our approach to refunds for our software subscription service.</p>
      </Section>

      <Section title="Free Trial">
        <p>All paid plans include a 14-day free trial. During the trial period, you have full access to the plan features. If you cancel before the trial ends, you will not be charged.</p>
      </Section>

      <Section title="Monthly Subscription">
        <p>Your monthly subscription is billed on a recurring basis. You may cancel your subscription at any time through the Manage Billing portal in your dashboard.</p>
        <p className="mt-2">Upon cancellation:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Your access will remain active until the end of the current billing period</li>
          <li>No further charges will be applied after cancellation</li>
          <li>No partial refunds are issued for unused days within a billing cycle</li>
        </ul>
      </Section>

      <Section title="Billing Disputes">
        <p>If you believe you were charged in error or have a billing dispute, please contact us within 30 days of the charge. We will review the issue and work with you to resolve it promptly.</p>
      </Section>

      <Section title="Service Issues">
        <p>If you experience significant service disruptions or technical issues that prevent you from using the platform, contact our support team. We will evaluate the situation on a case-by-case basis and may offer credits or adjustments at our discretion.</p>
      </Section>

      <Section title="How to Request a Refund">
        <p>To request a refund or discuss a billing concern, contact us at <span className="font-medium text-zinc-900">billing@supplementsnap.com</span> with your account email and a description of the issue.</p>
        <p className="mt-2">We aim to respond to all refund requests within 2 business days.</p>
      </Section>

      <Section title="Changes to This Policy">
        <p>We reserve the right to update this refund policy at any time. Changes will be reflected on this page with an updated date.</p>
      </Section>
    </LegalLayout>
  )
}
