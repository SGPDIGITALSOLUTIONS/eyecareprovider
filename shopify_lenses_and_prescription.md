# Lens & Prescription Options (Headless Shopify) — How to Pass to Shopify on Order

## Pricing note

All prices shown in this document are **for reference only** and are used to illustrate the lens flow and option structure.

**Do not rely on the prices in this file for calculations or checkout logic.**

The source of truth for all lens pricing is the `lenses.ts` file.  
Any updates to pricing should be made in `lenses.ts` and reflected dynamically in the UI.

---

This guide shows how to:
- define **lens options** (lens codes, coatings, thickness) in your website
- collect **prescription** details (text fields)
- send everything to **Shopify** so it appears on the **order** when the customer checks out

> Note: you wrote “spotify” — I’m assuming you mean **Shopify**. This document is for Shopify.

---

## 1) The clean data model

### Frames + colours
- **Frame** = Shopify **Product**
- **Colour** = Shopify **Variant** (`Option1 Name = Colour`)

### Lenses + coatings + prescription
Do **NOT** create these as Shopify variants (you’ll hit the 100-variant limit fast).

Instead, treat them as:
- **configuration options** chosen on your website
- stored as **line item attributes** (key/value pairs) on the cart line

Those attributes show up in:
- Shopify Admin → Orders (line item properties)
- Order confirmation emails (depending on template)

---

## 2) What you store on the website

Create a single source of truth file in your codebase, e.g.:

- `src/lib/lenses.ts` (TypeScript)
- or `lenses.js` (plain JS)

### Example lens catalogue (codes + pricing)

```ts
export const LENS_OPTIONS = {
  type: [
    { code: "SV", label: "Single Vision", price: 60 },
    { code: "VARI", label: "Varifocal", price: 120 },
    { code: "BIF", label: "Bifocal", price: 110 },
  ],
  index: [
    { code: "1.50", label: "Standard (1.50)", price: 0 },
    { code: "1.60", label: "Thin (1.60)", price: 25 },
    { code: "1.67", label: "Ultra-thin (1.67)", price: 45 },
  ],
  coatings: [
    { code: "AR", label: "Anti-reflective", price: 20 },
    { code: "BL", label: "Blue light filter", price: 25 },
    { code: "TR", label: "Transitions", price: 60 },
  ],
};
```

### What the user selects on the product page
You’ll hold these in UI state, e.g.:

- Lens Type: `SV`
- Lens Index: `1.60`
- Coatings: `AR` + `BL` (multi-select)
- Prescription fields (text/numbers)

---

## 3) Prescription fields (recommended minimum)

Most practical minimum fields:

- Right Eye: `SPH`, `CYL`, `AXIS`
- Left Eye: `SPH`, `CYL`, `AXIS`
- `PD` (pupillary distance)
- `ADD` (optional; for varifocals)
- `Notes` (optional)

Example UI state shape:

```ts
type Rx = {
  r_sph: string; r_cyl: string; r_axis: string;
  l_sph: string; l_cyl: string; l_axis: string;
  pd: string;
  add?: string;
  notes?: string;
};
```

Validation: keep it light. Don’t block checkout for minor formatting—just store what they enter.

---

## 4) How to pass lens + Rx to Shopify (line item attributes)

### Key idea
When you add a variant to cart, you also attach **attributes** (key/value pairs).

Shopify calls these:
- **cart line attributes** (Storefront API)
- they appear as **line item properties** on the order

### Attribute naming conventions
Use consistent keys so your fulfilment process is clear:

- `Lens Type Code` → `SV`
- `Lens Type` → `Single Vision`
- `Lens Index Code` → `1.60`
- `Lens Index` → `Thin (1.60)`
- `Coatings` → `AR, BL`
- `Rx R SPH` → `-1.25`
- `Rx R CYL` → `-0.50`
- `Rx R AXIS` → `180`
- `Rx L SPH` → `-1.75`
- `Rx L CYL` → `-0.25`
- `Rx L AXIS` → `170`
- `PD` → `63`
- `ADD` → `+2.00` (if used)
- `Rx Notes` → `...`

> Tip: include both **codes** and **labels**. Codes help you price/standardise. Labels help humans fulfil.

---

## 5) Storefront API (GraphQL) — Add to cart with attributes

### A) Create a cart (once per user/session)

```graphql
mutation CartCreate {
  cartCreate {
    cart {
      id
      checkoutUrl
    }
    userErrors { field message }
  }
}
```

### B) Add a line (variant) with attributes

**GraphQL**

```graphql
mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
  cartLinesAdd(cartId: $cartId, lines: $lines) {
    cart { id checkoutUrl }
    userErrors { field message }
  }
}
```

**Variables example**  
Replace `merchandiseId` with the selected **variant ID**.

```json
{
  "cartId": "gid://shopify/Cart/....",
  "lines": [
    {
      "quantity": 1,
      "merchandiseId": "gid://shopify/ProductVariant/1234567890",
      "attributes": [
        { "key": "Lens Type Code", "value": "SV" },
        { "key": "Lens Type", "value": "Single Vision" },
        { "key": "Lens Index Code", "value": "1.60" },
        { "key": "Lens Index", "value": "Thin (1.60)" },
        { "key": "Coatings", "value": "AR, BL" },

        { "key": "Rx R SPH", "value": "-1.25" },
        { "key": "Rx R CYL", "value": "-0.50" },
        { "key": "Rx R AXIS", "value": "180" },
        { "key": "Rx L SPH", "value": "-1.75" },
        { "key": "Rx L CYL", "value": "-0.25" },
        { "key": "Rx L AXIS", "value": "170" },
        { "key": "PD", "value": "63" }
      ]
    }
  ]
}
```

### C) Send customer to checkout
Redirect the user to:
- `cart.checkoutUrl`

That checkout is hosted by Shopify and will create the order with the attached attributes.

---

## 6) How to price lenses (two common approaches)

### Option 1 (recommended early): Include lens cost in your “total shown”, but keep Shopify price = frame only
- Pros: simplest, no extra products
- Cons: you need a manual workflow to charge lens upgrades unless you implement option 2

If you need Shopify to actually charge the lens cost, do option 2.

### Option 2 (best for charging upgrades): Add a “Lens Add-on” product to Shopify
Create a Shopify product like:
- Product: `Lens Add-on`
- Variants: `SV`, `VARI`, `BIF`, maybe also index/coating bundles, each with prices

Then when user picks lenses:
- add the frame variant **and**
- add the matching lens add-on variant to cart

This ensures the checkout total is correct without hacks.

> If you want fully flexible combos (type + index + coating), you can either:
> - create a small set of “bundled” lens variants, or
> - create separate add-on products (Lens Type, Lens Index Upgrade, Coating) and add multiple lines.

---

## 7) Optional: Prescription upload (PDF/JPG)
Shopify line item attributes cannot store a file. The standard approach is:

1. Upload file to your storage (Cloudinary / S3 / Vercel Blob)
2. Store the **file URL** in the line item attributes:

- `Prescription File URL` → `https://...`

---

## 8) Fulfilment: where you’ll see the data in Shopify
After checkout, in Shopify Admin → Orders:
- open the order
- open the line item
- you’ll see your attributes as **properties**

That’s what your lab/fulfilment team uses.

---

## 9) Implementation checklist (copy/paste)

- [ ] Frames are products, colours are variants
- [ ] Build lens options in code (`lenses.ts` / `lenses.js`)
- [ ] Build Rx form on product page
- [ ] On add-to-cart, attach lens + Rx as `attributes`
- [ ] Redirect to `checkoutUrl`
- [ ] Confirm attributes appear on Shopify order
- [ ] (If charging lens upgrades) implement “Lens Add-on” products and add those variants too

---

## 10) Example: attribute keys you can standardise on
Use these exact keys if you want consistency:

- `Lens Type Code`
- `Lens Type`
- `Lens Index Code`
- `Lens Index`
- `Coatings`
- `Rx R SPH`
- `Rx R CYL`
- `Rx R AXIS`
- `Rx L SPH`
- `Rx L CYL`
- `Rx L AXIS`
- `PD`
- `ADD`
- `Rx Notes`
- `Prescription File URL`

---
