# Affiliate Conversion Tracking SDK

A lightweight JavaScript SDK for tracking affiliate conversions on your website. Easily integrate affiliate tracking into your e-commerce store, SaaS application, or lead generation forms.

## Features

- 🚀 **Easy Integration** - Single script tag installation
- 🔗 **Auto-Detection** - Automatically detects referral codes from URL parameters
- 🍪 **Session Persistence** - Stores visitor sessions with configurable attribution windows
- 📊 **Flexible Tracking** - Support for sales, leads, signups, and custom events
- 🔒 **Privacy-First** - GDPR-compliant with configurable cookie consent
- 📦 **Lightweight** - Minimal bundle size (~5KB gzipped)
- 🎯 **TypeScript Support** - Full TypeScript definitions included

## Quick Start

### 1. Installation

#### CDN (Recommended)

```html
<script src="https://cdn.yoursite.com/affiliate-sdk.min.js"></script>
```

#### NPM

```bash
npm install @affiliate-mng/tracking-sdk
```

### 2. Initialize the SDK

```html
<script>
  AffiliateSDK.init({
    apiUrl: 'https://api.yoursite.com/api/v1'
  });
</script>
```

### 3. Track Conversions

```javascript
// Track a sale
await AffiliateSDK.trackConversion({
  type: 'SALE',
  value: 99.99,
  currency: 'USD',
  customerId: 'customer-123'
});
```

## Configuration

### Initialization Options

```typescript
AffiliateSDK.init({
  // Required
  apiUrl: string;              // Your API endpoint URL

  // Optional
  apiKey?: string;             // API key (if required by your backend)
  attributionWindow?: number;  // Attribution window in days (default: 30)
  cookieConsent?: boolean;     // Wait for consent before tracking (default: false)
  debug?: boolean;             // Enable debug logging (default: false)
  cookiePrefix?: string;       // Custom cookie name prefix (default: '_aff')
  useLocalStorage?: boolean;   // Use localStorage instead of cookies (default: false)
});
```

### Auto-Initialization with Data Attributes

You can also initialize the SDK using data attributes on the script tag:

```html
<script
  src="https://cdn.yoursite.com/affiliate-sdk.min.js"
  data-api-url="https://api.yoursite.com/api/v1"
  data-debug="true"
  data-attribution-window="30"
  data-cookie-consent="false">
</script>
```

## API Reference

### `AffiliateSDK.init(config)`

Initialize the SDK with configuration options.

**Parameters:**
- `config` (object) - Configuration options (see above)

**Example:**
```javascript
AffiliateSDK.init({
  apiUrl: 'https://api.yoursite.com/api/v1',
  debug: true
});
```

---

### `AffiliateSDK.trackConversion(options)`

Track a conversion event.

**Parameters:**
- `options` (object):
  - `type` (required): Conversion type - `'SALE' | 'LEAD' | 'SIGNUP' | 'CUSTOM'`
  - `value` (optional): Conversion value (e.g., order total)
  - `currency` (optional): Currency code (ISO 4217, default: 'USD')
  - `customerId` (optional): Customer identifier
  - `metadata` (optional): Custom metadata object

**Returns:** `Promise<void>`

**Example:**
```javascript
await AffiliateSDK.trackConversion({
  type: 'SALE',
  value: 149.99,
  currency: 'USD',
  customerId: 'user-456',
  metadata: {
    orderId: 'ORD-789',
    items: ['product-1', 'product-2'],
    couponCode: 'SAVE10'
  }
});
```

---

### `AffiliateSDK.setConsent(granted)`

Set cookie consent (for GDPR compliance).

**Parameters:**
- `granted` (boolean) - Whether consent was granted

**Example:**
```javascript
// When user accepts cookies
AffiliateSDK.setConsent(true);

// When user rejects cookies
AffiliateSDK.setConsent(false);
```

---

### `AffiliateSDK.hasConsent()`

Check if cookie consent was granted.

**Returns:** `boolean`

**Example:**
```javascript
if (AffiliateSDK.hasConsent()) {
  console.log('User has granted consent');
}
```

---

### `AffiliateSDK.identify(customerId)`

Associate a customer ID with the current session.

**Parameters:**
- `customerId` (string) - Customer identifier

**Example:**
```javascript
// After user logs in
AffiliateSDK.identify('customer-123');
```

---

### `AffiliateSDK.getSessionInfo()`

Get current session information.

**Returns:** Object with session data:
```typescript
{
  sessionId: string | null;
  referralCode: string | null;
  firstVisit: string | null;
  lastVisit: string | null;
}
```

**Example:**
```javascript
const session = AffiliateSDK.getSessionInfo();
console.log('Current session:', session);
```

---

### `AffiliateSDK.clear()`

Clear all tracking data (cookies/localStorage).

**Example:**
```javascript
AffiliateSDK.clear();
```

## Events

The SDK dispatches custom events that you can listen to:

### `affiliateSDK:referral_detected`

Fired when a referral code is detected in the URL.

```javascript
window.addEventListener('affiliateSDK:referral_detected', (e) => {
  console.log('Referral code:', e.detail.referralCode);
});
```

### `affiliateSDK:conversion_tracked`

Fired when a conversion is successfully tracked.

```javascript
window.addEventListener('affiliateSDK:conversion_tracked', (e) => {
  console.log('Conversion tracked:', e.detail);
});
```

### `affiliateSDK:conversion_not_attributed`

Fired when a conversion couldn't be attributed (no referral code).

```javascript
window.addEventListener('affiliateSDK:conversion_not_attributed', (e) => {
  console.log('Reason:', e.detail.reason);
});
```

### `affiliateSDK:conversion_error`

Fired when there's an error tracking a conversion.

```javascript
window.addEventListener('affiliateSDK:conversion_error', (e) => {
  console.error('Error:', e.detail.error);
});
```

### `affiliateSDK:customer_identified`

Fired when a customer is identified.

```javascript
window.addEventListener('affiliateSDK:customer_identified', (e) => {
  console.log('Customer ID:', e.detail.customerId);
});
```

## Usage Examples

### E-commerce Checkout

```javascript
// Initialize SDK
AffiliateSDK.init({
  apiUrl: 'https://api.yourstore.com/api/v1'
});

// After successful checkout
document.getElementById('checkout-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Process payment...
  const order = await processPayment();

  // Track conversion
  await AffiliateSDK.trackConversion({
    type: 'SALE',
    value: order.total,
    currency: 'USD',
    customerId: order.customerId,
    metadata: {
      orderId: order.id,
      items: order.items,
      paymentMethod: order.paymentMethod
    }
  });

  // Redirect to confirmation page
  window.location.href = '/order-confirmation';
});
```

### SaaS Sign-Up

```javascript
// Track signup conversion
async function handleSignup(userData) {
  // Create user account...
  const user = await createAccount(userData);

  // Track conversion
  await AffiliateSDK.trackConversion({
    type: 'SIGNUP',
    customerId: user.id,
    metadata: {
      plan: user.plan,
      source: 'signup_form'
    }
  });
}
```

### Lead Generation

```javascript
// Track lead form submission
document.getElementById('contact-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const email = formData.get('email');

  // Submit lead to CRM...
  await submitToCRM(formData);

  // Track lead conversion
  await AffiliateSDK.trackConversion({
    type: 'LEAD',
    value: 50, // Estimated lead value
    customerId: email,
    metadata: {
      source: 'contact_form',
      interest: formData.get('interest')
    }
  });

  // Show thank you message
  showThankYou();
});
```

### GDPR Compliance

```javascript
// Initialize with cookie consent requirement
AffiliateSDK.init({
  apiUrl: 'https://api.yoursite.com/api/v1',
  cookieConsent: true  // SDK won't track until consent is granted
});

// When user accepts cookies
document.getElementById('accept-cookies').addEventListener('click', () => {
  AffiliateSDK.setConsent(true);
  // SDK will now start tracking
});

// When user rejects cookies
document.getElementById('reject-cookies').addEventListener('click', () => {
  AffiliateSDK.setConsent(false);
});
```

## How It Works

### 1. Referral Detection

When a user clicks an affiliate link (e.g., `https://yoursite.com?ref=abc123`), the SDK automatically:

- Detects the `ref` parameter in the URL
- Stores the referral code in a cookie/localStorage
- Creates a unique visitor session ID
- Sets an attribution window (default: 30 days)

### 2. Session Tracking

The SDK maintains visitor session data:

```
{
  sessionId: "550e8400-e29b-41d4-a716-446655440000",
  referralCode: "abc123",
  firstVisit: "2024-01-15T10:30:00Z",
  lastVisit: "2024-01-15T11:45:00Z"
}
```

### 3. Conversion Tracking

When a conversion occurs (sale, signup, etc.):

1. SDK retrieves the stored referral code and session ID
2. Sends conversion data to your backend API
3. Backend attributes the conversion to the affiliate
4. Commission is calculated and credited

### 4. Attribution Window

Conversions are attributed to affiliates within the attribution window (default: 30 days). After this period, the referral code expires.

## Development

### Building the SDK

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Build and watch for changes
npm run dev

# Type check
npm run typecheck
```

### Output Files

After building, the following files are generated in `dist/`:

- `affiliate-sdk.js` - UMD build (unminified)
- `affiliate-sdk.min.js` - UMD build (minified)
- `affiliate-sdk.esm.js` - ES Module build
- `index.d.ts` - TypeScript definitions

## Browser Support

- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- iOS Safari (last 2 versions)

## Privacy & Security

### Cookie Usage

The SDK stores the following data in cookies or localStorage:

- `_aff_session_id` - Visitor session UUID
- `_aff_referral_code` - Referral link code
- `_aff_first_visit` - First visit timestamp
- `_aff_last_visit` - Last visit timestamp
- `_aff_consent` - Cookie consent status

### GDPR Compliance

To comply with GDPR:

1. Set `cookieConsent: true` in configuration
2. Request user consent before tracking
3. Call `setConsent(true)` only after user accepts

```javascript
AffiliateSDK.init({
  apiUrl: 'https://api.yoursite.com/api/v1',
  cookieConsent: true
});

// Later, after user consents
AffiliateSDK.setConsent(true);
```

### Data Security

- All API requests are sent over HTTPS
- No sensitive customer data is stored in cookies
- Session IDs are randomly generated UUIDs
- Optional API key authentication support

## Troubleshooting

### Conversions not tracking

1. Check browser console for errors (enable `debug: true`)
2. Verify the referral code exists in URL (`?ref=...`)
3. Ensure API endpoint is correct and accessible
4. Check CORS settings on your backend
5. Verify cookies/localStorage are enabled

### No referral code detected

- Make sure the URL contains `?ref=YOUR_CODE` parameter
- Check that the SDK is initialized before page load completes
- Verify attribution window hasn't expired

### CORS errors

Add CORS headers to your backend API:

```python
# FastAPI example
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yoursite.com"],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)
```

## Support

For issues, questions, or contributions:

- GitHub Issues: [link]
- Documentation: [link]
- Email: support@yoursite.com

## License

MIT License - see LICENSE file for details
