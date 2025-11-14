#!/bin/bash

# Test script for SaaS, Lead Gen, and Content/Media program types
# This script tests the complete conversion workflow for each program type

BASE_URL="http://localhost:8000/api/v1"
ADMIN_TOKEN=""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Testing Affiliate Management System ===${NC}\n"

# Step 1: Login as admin
echo -e "${GREEN}1. Logging in as admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=admin123")

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo -e "${RED}Failed to login. Response: $LOGIN_RESPONSE${NC}"
  exit 1
fi

echo -e "✓ Logged in successfully\n"

# Step 2: Create an affiliate
echo -e "${GREEN}2. Creating test affiliate...${NC}"
AFFILIATE_RESPONSE=$(curl -s -X POST "$BASE_URL/affiliates" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.affiliate@example.com",
    "first_name": "Test",
    "last_name": "Affiliate",
    "company_name": "Test Company"
  }')

AFFILIATE_ID=$(echo $AFFILIATE_RESPONSE | jq -r '.id')
echo -e "✓ Created affiliate: $AFFILIATE_ID\n"

# Function to test a program type
test_program_type() {
  local PROGRAM_TYPE=$1
  local CONVERSION_TYPE=$2
  local CONVERSION_VALUE=$3
  local COMMISSION_CONFIG=$4

  echo -e "${BLUE}=== Testing $PROGRAM_TYPE Program ===${NC}"

  # Create program
  echo -e "${GREEN}Creating $PROGRAM_TYPE program...${NC}"
  PROGRAM_RESPONSE=$(curl -s -X POST "$BASE_URL/programs" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Test $PROGRAM_TYPE Program\",
      \"description\": \"Testing $PROGRAM_TYPE conversions\",
      \"program_type\": \"$PROGRAM_TYPE\",
      \"commission_config\": $COMMISSION_CONFIG,
      \"cookie_duration_days\": 30
    }")

  PROGRAM_ID=$(echo $PROGRAM_RESPONSE | jq -r '.id')
  echo -e "✓ Program ID: $PROGRAM_ID"

  # Enroll affiliate
  echo -e "${GREEN}Enrolling affiliate in program...${NC}"
  curl -s -X POST "$BASE_URL/programs/$PROGRAM_ID/enroll" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"affiliate_id\": \"$AFFILIATE_ID\"
    }" > /dev/null
  echo -e "✓ Affiliate enrolled"

  # Create referral link
  echo -e "${GREEN}Creating referral link...${NC}"
  LINK_RESPONSE=$(curl -s -X POST "$BASE_URL/referrals" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"affiliate_id\": \"$AFFILIATE_ID\",
      \"program_id\": \"$PROGRAM_ID\",
      \"custom_code\": \"test-$PROGRAM_TYPE\"
    }")

  LINK_CODE=$(echo $LINK_RESPONSE | jq -r '.code')
  echo -e "✓ Referral link code: $LINK_CODE"

  # Simulate visitor session (generate UUID)
  VISITOR_SESSION=$(uuidgen)

  # Create conversion
  echo -e "${GREEN}Creating $CONVERSION_TYPE conversion...${NC}"
  CONVERSION_RESPONSE=$(curl -s -X POST "$BASE_URL/conversions" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"referral_link_code\": \"$LINK_CODE\",
      \"visitor_session_id\": \"$VISITOR_SESSION\",
      \"conversion_type\": \"$CONVERSION_TYPE\",
      \"conversion_value\": $CONVERSION_VALUE,
      \"conversion_metadata\": {
        \"test\": true,
        \"program_type\": \"$PROGRAM_TYPE\"
      }
    }")

  CONVERSION_ID=$(echo $CONVERSION_RESPONSE | jq -r '.id')
  echo -e "✓ Conversion ID: $CONVERSION_ID"
  echo -e "  Value: \$$CONVERSION_VALUE"

  # Validate conversion
  echo -e "${GREEN}Validating conversion...${NC}"
  curl -s -X POST "$BASE_URL/conversions/$CONVERSION_ID/validate" \
    -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
  echo -e "✓ Conversion validated"

  # Get commission
  echo -e "${GREEN}Checking commission...${NC}"
  COMMISSION_RESPONSE=$(curl -s -X GET "$BASE_URL/commissions?conversion_id=$CONVERSION_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")

  COMMISSION_AMOUNT=$(echo $COMMISSION_RESPONSE | jq -r '.items[0].final_amount')
  COMMISSION_ID=$(echo $COMMISSION_RESPONSE | jq -r '.items[0].id')

  echo -e "✓ Commission created: \$$COMMISSION_AMOUNT (ID: $COMMISSION_ID)"

  # Approve commission
  echo -e "${GREEN}Approving commission...${NC}"
  curl -s -X POST "$BASE_URL/commissions/$COMMISSION_ID/approve" \
    -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
  echo -e "✓ Commission approved"

  echo -e "${BLUE}✓ $PROGRAM_TYPE test complete!\n${NC}"
}

# Test SaaS Program (Percentage commission)
test_program_type "SAAS" "SALE" "500.00" '{"type": "percentage", "value": 20}'

# Test Lead Generation Program (Fixed commission)
test_program_type "LEAD_GEN" "LEAD" "0.00" '{"type": "fixed", "amount": 25}'

# Test Content/Media Program (Tiered commission)
test_program_type "CONTENT_MEDIA" "SIGNUP" "150.00" '{
  "type": "tiered",
  "tiers": [
    {"min": 0, "max": 100, "rate": 10},
    {"min": 100, "max": 500, "rate": 15},
    {"min": 500, "rate": 20}
  ]
}'

echo -e "${GREEN}=== All Tests Complete! ===${NC}"
echo -e "\nSummary:"
echo -e "1. SaaS (SALE): \$500 × 20% = \$100 commission"
echo -e "2. Lead Gen (LEAD): \$0 value, \$25 fixed commission"
echo -e "3. Content/Media (SIGNUP): \$150 × 15% (tier 2) = \$22.50 commission"
echo -e "\nCheck the admin dashboard to verify!"
