export interface Plan {
  name: string;
  price: string;
  cadence: string;
  note: string;
  href: string;      // base-relative path segment, e.g. "checkout/" or "contact/"
  popular?: boolean;
}

// Single source of truth for pricing — consumed by the landing Pricing
// section and the checkout page so the two never drift.
export const PLANS: Plan[] = [
  {
    name: "Single match review",
    price: "$49",
    cadence: "per match",
    note: "For staff who need one presentation-ready analysis room.",
    href: "checkout/",
  },
  {
    name: "Team package",
    price: "$149",
    cadence: "per batch",
    note: "For clubs or staff groups working through several matches at once.",
    href: "checkout/",
    popular: true,
  },
  {
    name: "Custom workflow",
    price: "Talk to us",
    cadence: "enterprise",
    note: "For recurring ingest, custom reporting, or recruiting-heavy review needs.",
    href: "contact/",
  },
];
