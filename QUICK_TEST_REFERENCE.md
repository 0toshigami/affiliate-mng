# Quick Test Reference: Program Types

## TL;DR - Run Tests Now

```bash
# Option 1: Run the bash script (fastest)
chmod +x test_program_types.sh
./test_program_types.sh

# Option 2: Run pytest (recommended)
cd backend
pip install pytest pytest-asyncio httpx
pytest tests/test_program_types.py -v
```

---

## What Gets Tested

| Program Type | Conversion Type | Commission Config | Expected Commission |
|---|---|---|---|
| **SAAS** | SALE | 20% percentage | $500 → $100 |
| **LEAD_GEN** | LEAD | $25 fixed | Any value → $25 |
| **CONTENT_MEDIA** | SIGNUP | Tiered (10/15/20%) | $150 → $22.50 (tier 2) |

---

## Expected Results

### ✅ SaaS Program
```json
{
  "program_type": "SAAS",
  "conversion_type": "SALE",
  "conversion_value": 500.00,
  "commission_amount": 100.00,  // 20% of $500
  "commission_type": "percentage"
}
```

### ✅ Lead Generation Program
```json
{
  "program_type": "LEAD_GEN",
  "conversion_type": "LEAD",
  "conversion_value": 0.00,      // Leads have no value
  "commission_amount": 25.00,    // Fixed $25
  "commission_type": "fixed"
}
```

### ✅ Content/Media Program
```json
{
  "program_type": "CONTENT_MEDIA",
  "conversion_type": "SIGNUP",
  "conversion_value": 150.00,
  "commission_amount": 22.50,    // 15% (tier 2 rate)
  "commission_type": "tiered"
}
```

---

## Running Specific Tests

```bash
# Test only SaaS program
pytest tests/test_program_types.py::TestSaaSProgram -v

# Test only Lead Gen program
pytest tests/test_program_types.py::TestLeadGenerationProgram -v

# Test only Content/Media program
pytest tests/test_program_types.py::TestContentMediaProgram -v

# Test specific scenario
pytest tests/test_program_types.py::TestSaaSProgram::test_saas_sale_conversion -v
```

---

## Verify Results via API

```bash
# Get all conversions
curl http://localhost:8000/api/v1/conversions \
  -H "Authorization: Bearer $TOKEN" | jq

# Get all commissions
curl http://localhost:8000/api/v1/commissions \
  -H "Authorization: Bearer $TOKEN" | jq

# Filter by program type
curl "http://localhost:8000/api/v1/programs?program_type=SAAS" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Key Validation Points

### For Each Program Type, Verify:

1. **Conversion Created**
   - Status: PENDING
   - Correct conversion_type
   - Correct conversion_value

2. **Conversion Validated**
   - Status changed: PENDING → VALIDATED
   - Commission automatically created

3. **Commission Calculated**
   - base_amount matches expected calculation
   - tier_multiplier applied (based on affiliate tier)
   - final_amount = base_amount × tier_multiplier

4. **Metadata Stored**
   - conversion_metadata contains program-specific data
   - JSONB field allows flexible data structure

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Tests fail with "no module named app" | Run from `backend/` directory |
| "Table already exists" error | Database not cleaned between tests |
| Wrong commission amount | Check commission_config in program |
| Conversion not validated | Must call `/validate` endpoint |
| Commission not created | Conversion must be VALIDATED first |

---

## Files Created

- ✅ `test_program_types.sh` - Bash script for manual testing
- ✅ `backend/tests/test_program_types.py` - Pytest test suite
- ✅ `backend/tests/conftest.py` - Test fixtures and configuration
- ✅ `backend/pytest.ini` - Pytest settings
- ✅ `TESTING_GUIDE.md` - Detailed testing guide
- ✅ `QUICK_TEST_REFERENCE.md` - This file

---

## Next Steps

1. Run the tests to verify everything works
2. Check the admin dashboard to see the results visually
3. Add more test cases for edge scenarios
4. Consider adding type-specific validation rules

For detailed instructions, see `TESTING_GUIDE.md`
