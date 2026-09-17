"use client";

import { LegalPage, Sec, List } from "@/components/LegalPage";

export default function RefundPage() {
  return (
    <LegalPage title="Refund Policy" updated="17 September 2026">
      <Sec h="The short version">
        <p>Points and plans on Chatworld are <strong>digital goods that are credited to your account instantly</strong>. Because they are delivered immediately and have no cash value, all purchases are <strong>final sale</strong>.</p>
      </Sec>
      <Sec h="What this means in practice">
        <List items={[
          "Once a purchase completes, the points appear in your balance right away and can be spent immediately — that is the delivery of the product.",
          "Points do not expire while your account is active, so there is never pressure to spend them.",
          "Accidental double-purchase? Duplicate charges for the same order will always be refunded.",
          "If a payment fails but your bank still charged you, contact us via the in-app Feedback button with the date and amount and we will resolve it.",
        ]} />
      </Sec>
      <Sec h="Your legal rights">
        <p>Nothing in this policy removes rights you have under mandatory consumer-protection law where you live (for example statutory rights for faulty digital services in the EU/UK or equivalent UAE consumer law). If such a right applies to you, it overrides this policy — tell us via Feedback and we will honour it.</p>
      </Sec>
      <Sec h="How to request a refund review">
        <p>Use the in-app <strong>Feedback</strong> button with: your account email, the purchase date, and what went wrong. We review every request individually and respond within 5 business days.</p>
      </Sec>
    </LegalPage>
  );
}
