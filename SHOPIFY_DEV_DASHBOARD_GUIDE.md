# Finding Storefront API Token in Dev Dashboard

## You're on the Settings Page - Here's What to Do:

### Step 1: Go to the "Home" Page

1. **Look at the left sidebar** - you'll see:
   - Home ← **CLICK THIS**
   - Versions
   - Monitoring
   - Logs
   - Settings (where you are now)

2. **Click "Home"** in the left sidebar

### Step 2: Find API Credentials on Home Page

On the Home page, you should see:

1. **API credentials** section
2. **Storefront API access token** - This is what you need!
3. **Configure scopes** button or link

### Alternative: Check Versions Tab

If not on Home:

1. Click **"Versions"** in left sidebar
2. Look for **"API credentials"** or **"Storefront API"** section
3. Find the **access token** there

## What You're Looking For:

### Storefront API Access Token
- Format: Usually starts with `shpat_` or a long string
- Location: Under "API credentials" or "Storefront API" section
- Action: Click **"Reveal"** or **"Show"** to see it, then **copy it**

### Configure Scopes
- Look for button: **"Configure Storefront API scopes"** or **"Edit scopes"**
- Click it to select permissions:
  - ✅ `unauthenticated_read_product_listings`
  - ✅ `unauthenticated_write_checkouts`

## Quick Navigation:

```
Dev Dashboard
├── Home ← GO HERE FIRST
│   └── Storefront API access token
│   └── Configure scopes button
├── Versions (might have API credentials)
├── Monitoring
├── Logs
└── Settings (where you are now - has Client ID/Secret, not access token)
```

## Important Notes:

- **Client ID** and **Secret** (on Settings page) are different from the **Storefront API access token**
- The **Storefront API access token** is what you need for your website
- It's usually on the **Home** page or **Versions** page, not Settings

## If You Still Can't Find It:

1. Click **"Home"** in left sidebar
2. Look for **"Storefront API"** section
3. Look for **"API credentials"** or **"Access tokens"**
4. The token might be hidden - click **"Reveal"** or **"Show"** button

