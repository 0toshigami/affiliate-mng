# Testing Guide: Program Types (SaaS, Lead Gen, Content/Media)

This guide shows you how to test conversions for all three program types in your affiliate management system.

## Quick Start

### Option 1: Manual API Testing (Fastest)

1. **Start the backend server:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. **Run the test script:**
   ```bash
   chmod +x test_program_types.sh
   ./test_program_types.sh
   ```

This script will:
- Login as admin
- Create all 3 program types
- Create conversions for each
- Validate conversions and create commissions
- Show the results

### Option 2: Automated Tests with pytest

1. **Install test dependencies:**
   ```bash
   cd backend
   pip install pytest pytest-asyncio httpx
   ```

2. **Run the tests:**
   ```bash
   # Run all program type tests
   pytest tests/test_program_types.py -v

   # Run specific test class
   pytest tests/test_program_types.py::TestSaaSProgram -v

   # Run with detailed output
   pytest tests/test_program_types.py -v -s
   ```

### Option 3: Manual Testing via API (Postman/curl)

See detailed steps below.

---

## What Each Program Type Tests

### 1. SaaS Program
- **Type:** `SAAS`
- **Conversion Types:** `SALE`, `SIGNUP`
- **Commission:** 20% percentage-based
- **Example:** $500 sale → $100 commission

**Test Cases:**
- ✅ Sale conversion with order metadata
- ✅ Free trial signup ($0 value)
- ✅ Commission calculation (20% of sale)

### 2. Lead Generation Program
- **Type:** `LEAD_GEN`
- **Conversion Types:** `LEAD`
- **Commission:** $25 fixed per lead
- **Example:** Lead captured → $25 commission

**Test Cases:**
- ✅ Lead conversion with contact info
- ✅ Fixed commission regardless of value
- ✅ Multiple leads = multiple $25 commissions

### 3. Content/Media Program
- **Type:** `CONTENT_MEDIA`
- **Conversion Types:** `SIGNUP`, `CUSTOM`
- **Commission:** Tiered rates (10%, 15%, 20%)
- **Example:** $150 signup → $22.50 commission (tier 2)

**Test Cases:**
- ✅ Tier 1: $50 × 10% = $5
- ✅ Tier 2: $150 × 15% = $22.50
- ✅ Tier 3: $600 × 20% = $120
- ✅ Custom events (workshops, special content)

---

## Manual API Testing Steps

### Prerequisites
```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# In another terminal, set these variables:
export BASE_URL="http://localhost:8000/api/v1"
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="admin123"
```

### Step 1: Get Admin Token
```bash
TOKEN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_EMAIL&password=$ADMIN_PASSWORD" | jq -r '.access_token')

echo "Token: $TOKEN"
```

### Step 2: Create an Affiliate
```bash
AFFILIATE=$(curl -s -X POST "$BASE_URL/affiliates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "Affiliate"
  }')

AFFILIATE_ID=$(echo $AFFILIATE | jq -r '.id')
echo "Affiliate ID: $AFFILIATE_ID"
```

### Step 3: Test SaaS Program

```bash
# Create SaaS program
SAAS_PROGRAM=$(curl -s -X POST "$BASE_URL/programs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cloud SaaS Product",
    "program_type": "SAAS",
    "commission_config": {
      "type": "percentage",
      "value": 20
    }
  }')

SAAS_PROGRAM_ID=$(echo $SAAS_PROGRAM | jq -r '.id')

# Enroll affiliate
curl -X POST "$BASE_URL/programs/$SAAS_PROGRAM_ID/enroll" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"affiliate_id\": \"$AFFILIATE_ID\"}"

# Create referral link
SAAS_LINK=$(curl -s -X POST "$BASE_URL/referrals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"affiliate_id\": \"$AFFILIATE_ID\",
    \"program_id\": \"$SAAS_PROGRAM_ID\",
    \"custom_code\": \"saas-test\"
  }")

SAAS_LINK_CODE=$(echo $SAAS_LINK | jq -r '.code')

# Create conversion
SAAS_CONVERSION=$(curl -s -X POST "$BASE_URL/conversions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"referral_link_code\": \"$SAAS_LINK_CODE\",
    \"visitor_session_id\": \"$(uuidgen)\",
    \"conversion_type\": \"SALE\",
    \"conversion_value\": 500.00,
    \"conversion_metadata\": {
      \"order_id\": \"ORD-001\",
      \"plan\": \"Professional\"
    }
  }")

SAAS_CONVERSION_ID=$(echo $SAAS_CONVERSION | jq -r '.id')

# Validate conversion
curl -X POST "$BASE_URL/conversions/$SAAS_CONVERSION_ID/validate" \
  -H "Authorization: Bearer $TOKEN"

# Check commission (should be $100)
curl -s "$BASE_URL/commissions?conversion_id=$SAAS_CONVERSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.items[0].final_amount'
```

**Expected Result:** `"100.00"` (20% of $500)

### Step 4: Test Lead Gen Program

```bash
# Create Lead Gen program
LEADGEN_PROGRAM=$(curl -s -X POST "$BASE_URL/programs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Insurance Leads",
    "program_type": "LEAD_GEN",
    "commission_config": {
      "type": "fixed",
      "amount": 25
    }
  }')

LEADGEN_PROGRAM_ID=$(echo $LEADGEN_PROGRAM | jq -r '.id')

# Enroll and create link
curl -X POST "$BASE_URL/programs/$LEADGEN_PROGRAM_ID/enroll" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"affiliate_id\": \"$AFFILIATE_ID\"}"

LEADGEN_LINK=$(curl -s -X POST "$BASE_URL/referrals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"affiliate_id\": \"$AFFILIATE_ID\",
    \"program_id\": \"$LEADGEN_PROGRAM_ID\",
    \"custom_code\": \"leadgen-test\"
  }")

LEADGEN_LINK_CODE=$(echo $LEADGEN_LINK | jq -r '.code')

# Create lead conversion
LEADGEN_CONVERSION=$(curl -s -X POST "$BASE_URL/conversions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"referral_link_code\": \"$LEADGEN_LINK_CODE\",
    \"visitor_session_id\": \"$(uuidgen)\",
    \"conversion_type\": \"LEAD\",
    \"conversion_value\": 0.00,
    \"conversion_metadata\": {
      \"lead_quality\": \"high\",
      \"phone\": \"+1234567890\"
    }
  }")

LEADGEN_CONVERSION_ID=$(echo $LEADGEN_CONVERSION | jq -r '.id')

# Validate and check commission
curl -X POST "$BASE_URL/conversions/$LEADGEN_CONVERSION_ID/validate" \
  -H "Authorization: Bearer $TOKEN"

curl -s "$BASE_URL/commissions?conversion_id=$LEADGEN_CONVERSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.items[0].final_amount'
```

**Expected Result:** `"25.00"` (fixed amount)

### Step 5: Test Content/Media Program

```bash
# Create Content/Media program
CONTENT_PROGRAM=$(curl -s -X POST "$BASE_URL/programs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Premium Content",
    "program_type": "CONTENT_MEDIA",
    "commission_config": {
      "type": "tiered",
      "tiers": [
        {"min": 0, "max": 100, "rate": 10},
        {"min": 100, "max": 500, "rate": 15},
        {"min": 500, "rate": 20}
      ]
    }
  }')

CONTENT_PROGRAM_ID=$(echo $CONTENT_PROGRAM | jq -r '.id')

# Enroll and create link
curl -X POST "$BASE_URL/programs/$CONTENT_PROGRAM_ID/enroll" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"affiliate_id\": \"$AFFILIATE_ID\"}"

CONTENT_LINK=$(curl -s -X POST "$BASE_URL/referrals" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"affiliate_id\": \"$AFFILIATE_ID\",
    \"program_id\": \"$CONTENT_PROGRAM_ID\",
    \"custom_code\": \"content-test\"
  }")

CONTENT_LINK_CODE=$(echo $CONTENT_LINK | jq -r '.code')

# Create signup conversion ($150 = tier 2)
CONTENT_CONVERSION=$(curl -s -X POST "$BASE_URL/conversions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"referral_link_code\": \"$CONTENT_LINK_CODE\",
    \"visitor_session_id\": \"$(uuidgen)\",
    \"conversion_type\": \"SIGNUP\",
    \"conversion_value\": 150.00,
    \"conversion_metadata\": {
      \"subscription_type\": \"premium\"
    }
  }")

CONTENT_CONVERSION_ID=$(echo $CONTENT_CONVERSION | jq -r '.id')

# Validate and check commission
curl -X POST "$BASE_URL/conversions/$CONTENT_CONVERSION_ID/validate" \
  -H "Authorization: Bearer $TOKEN"

curl -s "$BASE_URL/commissions?conversion_id=$CONTENT_CONVERSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.items[0].final_amount'
```

**Expected Result:** `"22.50"` (15% of $150, tier 2 rate)

---

## Verification Checklist

After running tests, verify:

- [ ] **SaaS Program**
  - [ ] Sale conversion created with SALE type
  - [ ] Commission = 20% of conversion value
  - [ ] Metadata contains order details

- [ ] **Lead Gen Program**
  - [ ] Lead conversion created with LEAD type
  - [ ] Commission = $25 fixed (regardless of value)
  - [ ] Metadata contains lead information

- [ ] **Content/Media Program**
  - [ ] Signup conversion created with SIGNUP type
  - [ ] Commission uses correct tier rate
  - [ ] Different values trigger different tiers

- [ ] **General**
  - [ ] All conversions start as PENDING
  - [ ] Validation changes status to VALIDATED
  - [ ] Commissions created after validation
  - [ ] Commissions can be approved

---

## View Results

### Via API
```bash
# List all conversions
curl -s "$BASE_URL/conversions" -H "Authorization: Bearer $TOKEN" | jq

# List all commissions
curl -s "$BASE_URL/commissions" -H "Authorization: Bearer $TOKEN" | jq

# Get affiliate performance
curl -s "$BASE_URL/affiliates/$AFFILIATE_ID/performance" \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Via Admin Dashboard
1. Open http://localhost:3000 (frontend)
2. Login as admin
3. Go to **Conversions** page
4. Go to **Commissions** page
5. View affiliate performance

---

## Common Issues

### Issue: "Invalid referral link code"
**Solution:** Make sure the referral link was created and the code is correct.

### Issue: "Commission not created"
**Solution:** You need to **validate** the conversion first. Commissions are only created after validation.

### Issue: "Wrong commission amount"
**Solution:** Check the `commission_config` in the program. Use `jq` to inspect:
```bash
curl -s "$BASE_URL/programs/$PROGRAM_ID" -H "Authorization: Bearer $TOKEN" | jq '.commission_config'
```

### Issue: "Authentication failed"
**Solution:** Make sure you have a valid admin user. Check `backend/app/core/seed.py` for default credentials.

---

## Next Steps

- Add more conversion types (CUSTOM events)
- Test affiliate tier multipliers
- Test program enrollment with custom commission configs
- Test payout processing
- Add validation rules per program type

For more details, see:
- `backend/app/services/conversion_service.py` - Conversion logic
- `backend/app/services/commission_service.py` - Commission calculation
- `backend/app/models/conversion.py` - Data models
