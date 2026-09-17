"use client";

import { LegalPage, Sec, List } from "@/components/LegalPage";
import Link from "next/link";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="17 September 2026">
      <Sec h="1. The agreement">
        <p>By creating an account or using Chatworld, you agree to these terms and our <Link href="/legal/privacy" className="text-accent-soft hover:underline">Privacy Policy</Link>. If you don&rsquo;t agree, don&rsquo;t use the service.</p>
      </Sec>
      <Sec h="2. Eligibility">
        <p>You must be at least <strong>13 years old</strong>. If you are 13–17, you may only use Chatworld with a parent or guardian&rsquo;s permission. You confirm the age statement you make at sign-up is true.</p>
      </Sec>
      <Sec h="3. Your account">
        <List items={[
          "Keep your password secret; you are responsible for activity on your account.",
          "One account per person unless we say otherwise.",
          "We may suspend or delete accounts that violate these terms.",
        ]} />
      </Sec>
      <Sec h="4. AI-generated content">
        <p>Chatworld characters are <strong>AI-generated fiction</strong>. They are not human, their statements are not facts, and nothing they say is professional, medical, legal, or financial advice. Stories may contain dramatic or mature themes; you choose what to engage with. The AI will never control your character&rsquo;s words or decisions — those are always yours.</p>
      </Sec>
      <Sec h="5. Acceptable use">
        <p>You agree not to:</p>
        <List items={[
          "Create characters or content that sexualises minors, incites violence or hatred, harasses real people, or violates applicable law.",
          "Impersonate real people in a defamatory or deceptive way.",
          "Attempt to break the service, bypass point limits, abuse referral/promo codes, or access data that isn&rsquo;t yours.",
          "Scrape, resell, or reverse-engineer the platform.",
        ]} />
        <p>We may remove violating content and accounts at our discretion.</p>
      </Sec>
      <Sec h="6. Your content & ownership">
        <p>You keep ownership of the characters, worlds, and stories you create. You grant us a limited licence to host, display, and run them so the service works (including letting other users chat with characters you publish). If you delete content or your account, we stop displaying it.</p>
      </Sec>
      <Sec h="7. Points, plans & payments">
        <List items={[
          "Points are a prepaid virtual balance with no cash value. They are not currency and cannot be exchanged for money.",
          "Purchases are charged in the currency shown at checkout (AED or USD) by our payment provider, Ziina. The price shown is the price you pay — there are no hidden platform fees.",
          "Purchases are final sale. See the Refund Policy for the limited exceptions.",
          "Points never expire while your account is active, unless required by law.",
        ]} />
      </Sec>
      <Sec h="8. Availability">
        <p>We aim for high availability but the service is provided &ldquo;as is&rdquo;. We may change features, models, or pricing with notice where practical. AI outputs vary by nature; we don&rsquo;t guarantee any specific result.</p>
      </Sec>
      <Sec h="9. Liability">
        <p>To the maximum extent permitted by law, our total liability for any claim is limited to the amount you paid us in the 12 months before the claim. We are not liable for indirect or consequential damages. Nothing here limits liability that cannot legally be limited.</p>
      </Sec>
      <Sec h="10. Termination">
        <p>You can leave at any time: Settings → Delete my account. We may terminate accounts that breach these terms.</p>
      </Sec>
      <Sec h="11. Law & disputes">
        <p>These terms are governed by the laws of the United Arab Emirates. Courts of the Emirate of Sharjah have exclusive jurisdiction, without prejudice to mandatory consumer protections of your country of residence.</p>
      </Sec>
      <Sec h="12. Contact">
        <p>Questions about these terms? Use the in-app <strong>Feedback</strong> button — it reaches the team directly.</p>
      </Sec>
    </LegalPage>
  );
}
