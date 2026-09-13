import Stripe from "stripe";
import { db, nowIso } from "../db";
import { newId, safeParse } from "../util";
import { addPoints } from "./points";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */
const SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

export function paymentsConfigured(): boolean {
  return !!SECRET_KEY;
}

let stripeClient: Stripe | null = null;
export function getStripe(): Stripe | null {
  if (!SECRET_KEY) return null;
  if (!stripeClient) stripeClient = new Stripe(SECRET_KEY);
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

/* ------------------------------------------------------------------ */
/* Stripe price provisioning (created once per catalog item)           */
/* ------------------------------------------------------------------ */
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
): Promise<{ url: string; paymentId: string }> {
  const stripe = getStripe();
  if (!stripe) throw new BillingError("Payments aren't configured on this deployment.", 503);

  let priceId: string;
  let amountCents: number;
  let itemName: string;

  if (req.kind === "credits") {
    const pack = db.prepare("SELECT * FROM credit_packages WHERE id = ? AND active = 1").get(req.refId) as any;
    if (!pack) throw new BillingError("Unknown credit package.", 404);
    priceId = await ensureStripePrice("credit_packages", pack.id, `Aetheria ${pack.credits} Points`, pack.price_cents, false);
    amountCents = pack.price_cents;
    itemName = `${pack.credits} points`;
  } else {
    const plan = db.prepare("SELECT * FROM plans WHERE id = ? AND active = 1").get(req.refId) as any;
    if (!plan) throw new BillingError("Unknown plan.", 404);
    if (plan.price_cents === 0) throw new BillingError("The free plan doesn't need a purchase.", 400);
    priceId = await ensureStripePrice("plans", plan.id, `Aetheria ${plan.name}`, plan.price_cents, true);
    amountCents = plan.price_cents;
    itemName = `Aetheria ${plan.name}`;
  }

  const paymentId = newId("pay");
  db.prepare(
    `INSERT INTO payments (id, user_id, kind, item_ref, amount_cents, currency, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'usd', 'pending', ?)`
  ).run(paymentId, userId, req.kind, req.refId, amountCents, nowIso());

  const session = await stripe.checkout.sessions.create({
    mode: req.kind === "credits" ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { paymentId, userId, kind: req.kind, refId: req.refId },
    success_url: `${baseUrl}/points?checkout=success`,
    cancel_url: `${baseUrl}/points?checkout=cancelled`,
    customer_email: undefined,
  });

  db.prepare("UPDATE payments SET stripe_session_id = ? WHERE id = ?").run(session.id, paymentId);
  return { url: session.url || "", paymentId };
}

export class BillingError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------------------------------------------ */
/* Webhook — the ONLY place purchases are fulfilled. The client never  */
/* confirms a payment; Stripe's signed webhook does.                   */
/* ------------------------------------------------------------------ */
export async function handleWebhook(rawBody: string, signature: string | null): Promise<void> {
  const stripe = getStripe();
  if (!stripe || !WEBHOOK_SECRET) {
    throw new BillingError("Webhook not configured.", 503);
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature || "", WEBHOOK_SECRET);
  } catch {
    throw new BillingError("Invalid webhook signature.", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await fulfillSession(stripe, session);
  } else if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const row = db
      .prepare("SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?")
      .get(sub.id) as any;
    if (row) {
      db.prepare(
        "UPDATE subscriptions SET status = 'canceled', updated_at = ? WHERE user_id = ?"
      ).run(nowIso(), row.user_id);
      db.prepare("UPDATE users SET plan = 'free' WHERE id = ?").run(row.user_id);
    }
  } else if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const row = db
      .prepare("SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?")
      .get(sub.id) as any;
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
      db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(active ? subPlanCode(sub) : "free", row.user_id);
    }
  }
}

function subPlanCode(sub: Stripe.Subscription): string {
  // Map the Stripe price back to a plan via stored price ids.
  const priceId = sub.items?.data?.[0]?.price?.id;
  const row = db.prepare("SELECT code FROM plans WHERE stripe_price_id = ?").get(priceId) as any;
  return row?.code || "plus";
}

async function fulfillSession(stripe: Stripe, session: Stripe.Checkout.Session): Promise<void> {
  const paymentId = session.metadata?.paymentId;
  const userId = session.metadata?.userId;
  const kind = session.metadata?.kind;
  const refId = session.metadata?.refId;
  if (!paymentId || !userId) return;

  const tx = db.transaction(() => {
    const pay = db.prepare("SELECT * FROM payments WHERE id = ?").get(paymentId) as any;
    if (!pay || pay.status === "succeeded") return; // idempotent
    db.prepare(
      "UPDATE payments SET status = 'succeeded', stripe_customer_id = ? WHERE id = ?"
    ).run(typeof session.customer === "string" ? session.customer : null, paymentId);

    if (kind === "credits") {
      const pack = db.prepare("SELECT * FROM credit_packages WHERE id = ?").get(refId) as any;
      if (pack) addPoints(userId, pack.credits, "purchase", `Purchased ${pack.name}`);
    } else if (kind === "subscription") {
      const plan = db.prepare("SELECT * FROM plans WHERE id = ?").get(refId) as any;
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
        ).run(
          userId,
          plan.code,
          typeof session.subscription === "string" ? session.subscription : null,
          typeof session.customer === "string" ? session.customer : null,
          nowIso()
        );
        db.prepare("UPDATE users SET plan = ? WHERE id = ?").run(plan.code, userId);
      }
    }
  });
  tx();
}

/* ------------------------------------------------------------------ */
/* Plan bonus for daily claim (premium benefit, server-side)           */
/* ------------------------------------------------------------------ */
export function dailyPlanBonus(planCode: string | null | undefined): number {
  const f = planFeaturesFor(planCode);
  const n = Number(f.dailyBonus);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
