"use client";

import { LegalPage, Sec, List } from "@/components/LegalPage";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="17 September 2026">
      <Sec h="1. Who we are">
        <p>Chatworld (&ldquo;we&rdquo;, &ldquo;the platform&rdquo;) is an AI character chat and interactive storytelling service. We built this policy to be short and honest: we collect what the product needs, nothing more, and we don&rsquo;t sell your data.</p>
      </Sec>
      <Sec h="2. What we collect">
        <List items={[
          "Account data: email address, username, and a bcrypt-hashed password. We cannot read your password.",
          "If you sign in with Google: your Google name, email address and profile photo, provided by Google with your permission.",
          "Content you create: characters, worlds, stories, personas, and your chat messages.",
          "Usage data needed to operate the service: point balance, point transactions, and basic request logs.",
          "Feedback you voluntarily send through the in-app feedback form.",
        ]} />
        <p>We do <strong>not</strong> collect: precise location, contacts, advertising identifiers, or data about your device beyond what your browser sends in normal HTTP requests.</p>
      </Sec>
      <Sec h="3. Payments">
        <p>Payments are processed by <strong>Ziina</strong>, a licensed payment provider. Card details are entered on Ziina&rsquo;s hosted payment page and are never seen or stored by Chatworld. We store only the payment reference, amount, and status needed to credit your account and resolve disputes.</p>
      </Sec>
      <Sec h="4. AI processing">
        <p>When you chat, your message and the relevant story context are sent to our AI providers (<strong>Anthropic</strong> and/or <strong>OpenRouter</strong>) to generate a reply. These providers act as our data processors and are contractually restricted from using your data for their own purposes. Don&rsquo;t put real personal secrets (ID numbers, health details, financial data) into chats — treat chat content like content you post on any online service.</p>
      </Sec>
      <Sec h="5. Cookies & local storage">
        <p>We use only <strong>strictly necessary</strong> storage: a session token that keeps you signed in, your display preferences, and your cookie-consent choice. We use <strong>no</strong> tracking cookies, no advertising cookies, and no third-party analytics. Details are in our <Link href="/legal/cookies" className="text-accent-soft hover:underline">Cookie Policy</Link>.</p>
      </Sec>
      <Sec h="6. Children">
        <p>Chatworld is not directed at children under <strong>13</strong>. Users aged 13–17 should have a parent or guardian&rsquo;s permission to use the platform. We do not knowingly collect data from children under 13; if we learn we have, we delete the account. Parents can request deletion via the in-app feedback form.</p>
      </Sec>
      <Sec h="7. Your rights">
        <List items={[
          "Access & export: you can view everything you created in the app at any time.",
          "Deletion: Settings → Delete my account permanently erases your account, chats, characters and personal data. Financial records (payment reference, amount, date) may be retained where the law requires.",
          "Correction: edit your profile, personas and characters at any time.",
          "Depending on where you live (including under the UAE Personal Data Protection Law, Federal Decree-Law No. 45 of 2021, and the EU GDPR), you may also have rights to restriction, portability, and objection. Contact us via the in-app feedback form and we will respond within 30 days.",
        ]} />
      </Sec>
      <Sec h="8. Data retention & security">
        <p>We keep your data while your account exists. Passwords are hashed with bcrypt, sessions are signed with rotating secrets, and all traffic is served over HTTPS. No system is perfectly secure; report issues via the feedback form.</p>
      </Sec>
      <Sec h="9. Third-party services">
        <List items={[
          "Ziina — payment processing.",
          "Google — optional sign-in (only if you choose it).",
          "Anthropic / OpenRouter — AI response generation.",
          "The in-app Feedback button stores your message in a private team inbox inside the service.",
        ]} />
        <p>Each receives only the data it needs for its function. We embed no social-media widgets, ads, or trackers.</p>
      </Sec>
      <Sec h="10. Changes">
        <p>If this policy changes materially, the &ldquo;Last updated&rdquo; date above changes with it. Continued use after a change means you accept it.</p>
      </Sec>
    </LegalPage>
  );
}
