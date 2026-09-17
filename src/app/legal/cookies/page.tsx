"use client";

import { LegalPage, Sec, List } from "@/components/LegalPage";

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" updated="17 September 2026">
      <Sec h="What we use">
        <p>Chatworld uses only <strong>strictly necessary</strong> browser storage. Under the UAE PDPL, the EU ePrivacy Directive and the UK GDPR, this category does not require consent — but we show you a notice anyway so you always know.</p>
      </Sec>
      <Sec h="The full list">
        <List items={[
          "Session token (local storage) — keeps you signed in. Without it, every page would log you out.",
          "Theme / display preferences (local storage) — remembers how you like the interface.",
          "Cookie notice choice (local storage) — remembers that you dismissed the banner so it doesn&rsquo;t nag you.",
          "Recent searches (local storage) — makes the Discover search box convenient for you.",
        ]} />
        <p>That&rsquo;s everything. We use <strong>no</strong> advertising cookies, <strong>no</strong> third-party analytics, <strong>no</strong> social-media trackers, and <strong>no</strong> fingerprinting.</p>
      </Sec>
      <Sec h="Third-party pages">
        <p>When you pay, you are redirected to <strong>Ziina&rsquo;s</strong> hosted payment page. Any cookies on that page are governed by Ziina&rsquo;s own policy and are required for the payment to work. If you sign in with Google, Google&rsquo;s pages may set their own cookies under Google&rsquo;s policies.</p>
      </Sec>
      <Sec h="Managing storage">
        <p>You can clear all Chatworld storage at any time in your browser settings (it will sign you out). Browser &ldquo;private mode&rdquo; also works — nothing persists after you close the window.</p>
      </Sec>
    </LegalPage>
  );
}
