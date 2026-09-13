import Stripe from "stripe";
import { db, nowIso } from "../db";
import { newId, safeParse } from "../util";
import { addPoints } from "./points";

/* ------------------------------------------------------------------ */
/* Config — two interchangeable providers. Ziina (UAE, no trade        */
/* license required) is preferred when configured; Stripe otherwise.   */
/* ------------------------------------------------------------------ */
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const ZIINA_TOKEN = process.env.ZIINA_ACCESS_TOKEN || "";
const ZIINA_TEST = process.env.ZIINA_TEST === "true";
const ZIINA_API = "https://api-v2.ziina.com/api";
// The AED is pegged to the USD at 3.6725 — deterministic conversion for
// our USD catalog into Ziina's AED charges.
const USD_AED_PEG = 3.6725;

export type Provider = "ziina" | "stripe";

export function activeProvider(): Provider | null {
  if (ZIINA_TOKEN) return "ziina";
  if (STRIPE_SECRET) return "stripe";
  return null;
}

export function paymentsConfigured(): boolean {
  return activeProvider() !== null;
}

let stripeClient: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!STRIPE_SECRET) return null;
  if (!stripeClient) stripeClient = new Stripe(STRIPE_SECRET);
  return stripeClient;
}

/* ------------------------------------------------------------------ */
/* Default catalog (DB-stored, admin-editable — never hard-coded in    */
/* the request path; prices live in `plans`/`credit_packages`).        */
/* ------------------------------------------------------------------ */
export function ensureBillingCatalog(): void {
  const n = (db.prepare("SELECT COUNT(*) AS n FROM plans").get() as any).n;
  if (n > 0) return;
  const plans: Array<[string, string, number, string, string, Record<string, unknown>, number]> = [
    ["free", "Free", 0, "month", "Start your first story.", { maxPersonas: 3 }, 0],
    ["plus", "Plus", 499, "month", "More personas + daily bonus points.", { maxPersonas: 10, dailyBonus: 100 }, 1],
    ["pro", "Pro", 1199, "month", "For daily storytellers.", { maxPersonas: 25, dailyBonus: 250 }, 2],
    ["ultra", "Ultra", 2499, "month", "Everything, everywhere, always.", { maxPersonas: 100, dailyBonus: 500 }, 3],
  ];
  const packs: Array<[string, number, number, number]> = [
    ["Starter Pack", 1000, 199, 0],
    ["Adventurer Pack", 5000, 799, 1],
    ["Legend Pack", 12000, 1599, 2],
  ];
  const tx = db.transaction(() => {
    for (const [code, name, price, interval, blurb, features, sort] of plans) {
      db.prepare(
        `INSERT INTO plans (id, code, name, price_cents, currency, interval, features, blurb, active, sort)
         VALUES (?, ?, ?, ?, 'usd', ?, ?, ?, 1, ?)`
      ).run(newId("pln"), code, name, price, interval, JSON.stringify(features), blurb, sort);
    }
    for (const [name, credits, price, sort] of packs) {
      db.prepare(
        `INSERT INTO credit_packages (id, name, credits, price_cents, currency, active, sort)
         VALUES (?, ?, ?, ?, 'usd', 1, ?)`
      ).run(newId("pkd"), name, credits, price, sort);
    }
  });
  tx();
}

export interface PlanRow {
  id: string;
  code: string;
  name: string;
  priceCents: number;
  currency: string;
  interval: string;
  features: Record<string, any>;
  blurb: string;
  sort: number;
}

export function listPlans(): PlanRow[] {
  ensureBillingCatalog();
  const rows = db
    .prepare("SELECT * FROM plans WHERE active = 1 ORDER BY sort ASC")
    .all() as any[];
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    priceCents: r.price_cents,
    currency: r.currency,
    interval: r.interval,
    features: safeParse(r.features, {}),
    blurb: r.blurb,
    sort: r.sort,
  }));
}

export function listPackages() {
  ensureBillingCatalog();
  const rows = db
    .prepare("SELECT * FROM credit_packages WHERE active = 1 ORDER BY sort ASC")
    .all() as any[];
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    credits: r.credits,
    priceCents: r.price_cents,
    currency: r.currency,
  }));
}

/* ------------------------------------------------------------------ */
/* Entitlements                                                        */
/* ------------------------------------------------------------------ */
export function planFeaturesFor(planCode: string | null | undefined): Record<string, any> {
  ensureBillingCatalog();
  const code = planCode || "free";
  const row = db.prepare("SELECT features FROM plans WHERE code = ?").get(code) as any;
  if (row) return safeParse(row.features, {});
  return {};
}

export function getSubscription(userId: string) {
  const row = db.prepare("SELECT * FROM subscriptions WHERE user_id = ?").get(userId) as any;
  if (!row) return null;
  return {
    planCode: row.plan_code,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
  };
}

export class BillingError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------------------------------------------ */
/* Shared fulfilment — the ONLY place purchases grant value. Called    */
/* from Stripe's signed webhook and from Ziina status confirmation.    */
/* Idempotent: a payment transitions pending → succeeded exactly once. */
/* ------------------------------------------------------------------ */
function fulfillPaymentRow(pay: any, customerRef: string | null): boolean {
  if (!pay || pay.status === "succeeded") return false;
  const userId = pay.user_id as string;
  const tx = db.transaction(() => {
    const cur = db.prepare("SELECT status FROM payments WHERE id = ?").get(pay.id) as any;
    if (!cur || cur.status === "succeeded") return false;
    db.prepare(
      "UPDATE payments SET status = 'succeeded', stripe_customer_id = COALESCE(?, stripe_customer_id) WHERE id = ?"
    ).run(customerRef, pay.id);

    if (pay.kind === "credits") {
      const pack = db
        .prepare("SELECT * FROM credit_packages WHERE id = ?")
        .get(pay.item_ref) as any;
      if (pack) addPoints(userId, pack.credits, "purchase", `Purchased ${pack.name}`);
    } else if (pay.kind === "subscription") {
      const plan = db.prepare("SELECT * FROM plans WHERE id = ?").get(pay.item_ref) as any;
      if (plan) {
        db.prepare(
          `INSERT INTO subscriptions (user_id, plan_code, stripe_subscription_id, stripe_customer_id, status, updated_at)
           VALUES (?, ?, ?, ?, 'active', ?)
           ON CONFLICT(user_id) DO UPDATE SET
             plan_code = excluded.plan_code,
             stripe_subscription_id = excluded.stripe_subscription_id,
             stripe_customer_id = excluded.stripe_customer_id,
             status = 'active',
             updated_at = excluded.updated_at`
        ).run(userId, plan.code, null, customerRef, nowIso());
        db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan.code, userId);
      }
    }
    return true;
  });
  return tx();
}

/* ------------------------------------------------------------------ */
/* Checkout                                                            */
/* ------------------------------------------------------------------ */
export interface CheckoutRequest {
  kind: "credits" | "subscription";
  refId: string; // package id or plan id
}

export async function createCheckout(
  userId: string,
  req: CheckoutRequest,
  baseUrl: string
): Promise<{ url: string; paymentId: string; provider: Provider }> {
  const provider = activeProvider();
  if (!provider) throw new BillingError("Payments aren't configured on this deployment.", 503);

  let itemRow: any;
  let amountCents: number;
  let itemName: string;
  if (req.kind === "credits") {
    itemRow = db.prepare("SELECT * FROM credit_packages WHERE id = ? AND active = 1").get(req.refId) as any;
    if (!itemRow) throw new BillingError("Unknown credit package.", 404);
    amountCents = itemRow.price_cents;
    itemName = `${itemRow.credits} Aetheria points`;
  } else {
    itemRow = db.prepare("SELECT * FROM plans WHERE id = ? AND active = 1").get(req.refId) as any;
    if (!itemRow) throw new BillingError("Unknown plan.", 404);
    if (itemRow.price_cents === 0) throw new BillingError("The free plan doesn't need a purchase.", 400);
    amountCents = itemRow.price_cents;
    itemName = `Aetheria ${itemRow.name} (monthly)`;
  }

  const paymentId = newId("pay");
  db.prepare(
    `INSERT INTO payments (id, user_id, kind, item_ref, amount_cents, currency, status, provider, created_at)
     VALUES (?, ?, ?, ?, ?, 'usd', 'pending', ?, ?)`
  ).run(paymentId, userId, req.kind, req.refId, amountCents, provider, nowIso());

  const url =
    provider === "ziina"
      ? await createZiinaIntent(paymentId, amountCents, itemName, baseUrl)
      : await createStripeSession(itemRow, req.kind, amountCents, paymentId, userId, baseUrl);

  return { url, paymentId, provider };
}

/* ---------------- Ziina ---------------- */

async function createZiinaIntent(
  paymentId: string,
  amountCents: number,
  itemName: string,
  baseUrl: string
): Promise<string> {
  // USD cents → AED fils at the fixed peg.
  const aedFils = Math.round(amountCents * USD_AED_PEG);
  const res = await fetch(`${ZIINA_API}/payment_intent`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ZIINA_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: aedFils,
      currency_code: "AED",
      message: itemName,
      success_url: `${baseUrl}/points?checkout=success&pay=${paymentId}`,
      cancel_url: `${baseUrl}/points?checkout=cancelled`,
      failure_url: `${baseUrl}/points?checkout=cancelled`,
      test: ZIINA_TEST,
      allow_tips: false,
    }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data?.redirect_url) {
    console.error("[billing] ziina intent failed:", res.status, data);
    throw new BillingError(data?.message || "Ziina couldn't create the payment. Try again.", 502);
  }
  db.prepare("UPDATE payments SET stripe_session_id = ? WHERE id = ?").run(
    `ziina:${data.id}`,
    paymentId
  );
  return data.redirect_url;
}

/** Server-side confirmation: ask Ziina for the intent's real status and
 *  fulfil if completed. The client can never lie about payment success. */
export async function confirmZiinaPayment(paymentId: string): Promise<{
  status: string;
  fulfilled: boolean;
}> {
  const pay = db.prepare("SELECT * FROM payments WHERE id = ?").get(paymentId) as any;
  if (!pay) throw new BillingError("Unknown payment.", 404);
  if (pay.provider !== "ziina") {
    return { status: pay.status, fulfilled: pay.status === "succeeded" };
  }
  if (pay.status === "succeeded") return { status: "succeeded", fulfilled: true };

  const ref = String(pay.stripe_session_id || "").replace(/^ziina:/, "");
  if (!ref) throw new BillingError("Payment has no provider reference.", 409);

  const res = await fetch(`${ZIINA_API}/payment_intent/${ref}`, {
    headers: { Authorization: `Bearer ${ZIINA_TOKEN}` },
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new BillingError("Couldn't verify the payment with Ziina.", 502);
  }

  if (data.status === "completed") {
    const fulfilled = fulfillPaymentRow(pay, data.account_id || null);
    return { status: "completed", fulfilled };
  }
  return { status: data.status || "unknown", fulfilled: false };
}

/* ---------------- Stripe ---------------- */

async function ensureStripePrice(
  table: "plans" | "credit_packages",
  rowId: string,
  productName: string,
  unitAmount: number,
  recurring: boolean
): Promise<string> {
  const stripe = getStripe()!;
  const row = db
    .prepare(`SELECT stripe_price_id FROM ${table} WHERE id = ?`)
    .get(rowId) as any;
  if (row?.stripe_price_id) return row.stripe_price_id;

  const product = await stripe.products.create({ name: productName });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: unitAmount,
    currency: "usd",
    ...(recurring ? { recurring: { interval: "month" } } : {}),
  });
  db.prepare(`UPDATE ${table} SET stripe_price_id = ? WHERE id = ?`).run(price.id, rowId);
  return price.id;
}

async function createStripeSession(
  itemRow: any,
  kind: "credits" | "subscription",
  amountCents: number,
  paymentId: string,
  userId: string,
  baseUrl: string
): Promise<string> {
  const stripe = getStripe()!;
  const table = kind === "credits" ? "credit_packages" : "plans";
  const priceId = await ensureStripePrice(
    table,
    itemRow.id,
    kind === "credits" ? `Aetheria ${itemRow.credits} Points` : `Aetheria ${itemRow.name}`,
    amountCents,
    kind === "subscription"
  );

  const session = await stripe.checkout.sessions.create({
    mode: kind === "credits" ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { paymentId, userId, kind, refId: itemRow.id },
    success_url: `${baseUrl}/points?checkout=success&pay=${paymentId}`,
    cancel_url: `${baseUrl}/points?checkout=cancelled`,
  });

  db.prepare("UPDATE payments SET stripe_session_id = ? WHERE id = ?").run(
    `stripe:${session.id}`,
    paymentId
  );
  return session.url || "";
}

/* ------------------------------------------------------------------ */
/* Stripe webhook — signature-verified fulfilment                      */
/* ------------------------------------------------------------------ */
export async function handleWebhook(rawBody: string, signature: string | null): Promise<void> {
  const stripe = getStripe();
  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    throw new BillingError("Webhook not configured.", 503);
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature || "", STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new BillingError("Invalid webhook signature.", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.paymentId;
    if (!paymentId) return;
    const pay = db.prepare("SELECT * FROM payments WHERE id = ?").get(paymentId) as any;
    if (pay) {
      fulfillPaymentRow(pay, typeof session.customer === "string" ? session.customer : null);
    }
  } else if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const row = db
      .prepare(
        "SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ? OR stripe_customer_id = ?"
      )
      .get(sub.id, typeof sub.customer === "string" ? sub.customer : "") as any;
    if (row) {
      db.prepare(
        "UPDATE subscriptions SET status = 'canceled', updated_at = ? WHERE user_id = ?"
      ).run(nowIso(), row.user_id);
      db.prepare("UPDATE users SET plan = 'free' WHERE id = ?").run(row.user_id);
    }
  } else if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const row = db
      .prepare(
        "SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ? OR stripe_customer_id = ?"
      )
      .get(sub.id, typeof sub.customer === "string" ? sub.customer : "") as any;
    if (row) {
      const active = sub.status === "active" || sub.status === "trialing";
      const periodEnd = sub.items?.data?.[0]?.current_period_end;
      db.prepare(
        "UPDATE subscriptions SET status = ?, current_period_end = ?, updated_at = ? WHERE user_id = ?"
      ).run(
        active ? "active" : sub.status,
        periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        nowIso(),
        row.user_id
      );
      db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(
        active ? subPlanCode(sub) : "free",
        row.user_id
      );
    }
  }
}

function subPlanCode(sub: Stripe.Subscription): string {
  const priceId = sub.items?.data?.[0]?.price?.id;
  const row = db.prepare("SELECT code FROM plans WHERE stripe_price_id = ?").get(priceId) as any;
  return row?.code || "plus";
}

/* ------------------------------------------------------------------ */
/* Plan bonus for daily claim (premium benefit, server-side)           */
/* ------------------------------------------------------------------ */
export function dailyPlanBonus(planCode: string | null | undefined): number {
  const f = planFeaturesFor(planCode);
  const n = Number(f.dailyBonus);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
