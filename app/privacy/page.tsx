import type { Metadata } from "next"
import { LegalLayout } from "../../lib/legal-layout"

export const metadata: Metadata = { title: "Privacy Policy – Supplement Snap", description: "How Supplement Snap collects, uses and protects your information, including account data, photos and payment details.", alternates: { canonical: "https://supplementsnap.io/privacy" } }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-base font-semibold text-zinc-900">{title}</h2>
      {children}
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy">
      <Section title="Introduction">
        <p>Supplement Snap is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights regarding your data.</p>
      </Section>

      <Section title="Information We Collect">
        <p>We collect the following types of information:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><span className="font-medium text-zinc-900">Account information:</span> name, email address, and password when you create an account</li>
          <li><span className="font-medium text-zinc-900">Project data:</span> project names, property addresses, and capture metadata</li>
          <li><span className="font-medium text-zinc-900">Uploaded content:</span> photos, field notes (including voice notes, which are saved as text; we do not store audio recordings), and damage documentation</li>
          <li><span className="font-medium text-zinc-900">Billing information:</span> payment details processed securely through Stripe (we do not store your card numbers)</li>
          <li><span className="font-medium text-zinc-900">Usage data:</span> general information about how you interact with the platform</li>
        </ul>
      </Section>

      <Section title="How We Use Your Information">
        <p>We use your information to:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Provide and maintain the Supplement Snap platform</li>
          <li>Generate supplement documentation and reports</li>
          <li>Process payments and manage subscriptions</li>
          <li>Send transactional emails such as password resets and report deliveries</li>
          <li>Improve the product and user experience</li>
          <li>Communicate important updates about the service</li>
        </ul>
      </Section>

      <Section title="How Data Is Stored">
        <p>Your data is stored securely using industry-standard practices. Account data and project information are stored in Supabase, a managed PostgreSQL database with encryption at rest. Uploaded photos are stored in Supabase Storage. Each photo has a long, hard-to-guess web address, but photos are not behind a login: anyone who has the exact address can view the photo without logging in. Photo addresses do not expire. Do not post or forward photo links you want to keep private. When you delete a photo, finding or project, we remove the photo files from storage; if we cannot confirm a removal, we tell you and ask you to contact us. Copies that someone already downloaded, saved or cached elsewhere are not affected.</p>
        <p className="mt-2">We retain your data for as long as your account is active. Account deletion is handled by request and is not automatic. To delete your account, email privacy@supplementsnap.io from the address on your account. We then delete your account information, project records and uploaded photos from our own systems and cancel any active subscription, and we aim to finish within 30 days of confirming the request. Copies held by our service providers, such as backups and payment records, follow their own retention schedules and may remain for a time after we delete your data.</p>
      </Section>

      <Section title="Third-Party Services">
        <p>We use the following third-party services to operate the platform:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li><span className="font-medium text-zinc-900">Supabase:</span> database, authentication, and file storage</li>
          <li><span className="font-medium text-zinc-900">Stripe:</span> payment processing and subscription management</li>
          <li><span className="font-medium text-zinc-900">Resend:</span> transactional email delivery</li>
          <li><span className="font-medium text-zinc-900">Anthropic (Claude):</span> AI-powered supplement draft generation</li>
          <li><span className="font-medium text-zinc-900">Vercel:</span> application hosting</li>
        </ul>
        <p className="mt-2">Each of these services has its own privacy policy governing how they handle data. Voice notes are turned into text by your phone&apos;s browser, which may send the audio to its own provider; we do not receive or store that audio.</p>
      </Section>

      <Section title="Your Rights">
        <p>You have the right to:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your account and data</li>
          <li>Export your project data</li>
          <li>Opt out of non-essential communications</li>
        </ul>
      </Section>

      <Section title="Cookies">
        <p>Supplement Snap uses essential cookies for authentication and session management. We do not use advertising or tracking cookies.</p>
      </Section>

      <Section title="Changes to This Policy">
        <p>We may update this privacy policy from time to time. Changes will be posted on this page with an updated effective date. Continued use of the platform after changes constitutes acceptance.</p>
      </Section>

      <Section title="Contact">
        <p>For privacy-related questions or requests, contact us at <span className="font-medium text-zinc-900">privacy@supplementsnap.io</span>.</p>
      </Section>
    </LegalLayout>
  )
}
