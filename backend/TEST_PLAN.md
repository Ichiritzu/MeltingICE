# MeltingICE.app - Test Plan

## API Endpoint Tests (curl)

### 1. Health Check - Resources List
```bash
curl -X GET "https://YOUR_DOMAIN/api/resources/list.php" \
  -H "Accept: application/json"
```

**Expected:** JSON with KYR cards, agencies, hotlines, templates

---

### 2. Resources by Category
```bash
curl -X GET "https://YOUR_DOMAIN/api/resources/list.php?category=kyr"
```

**Expected:** Array of KYR card objects

---

### 3. Empty Reports List (Fresh DB)
```bash
curl -X GET "https://YOUR_DOMAIN/api/reports/list.php"
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "reports": [],
    "pagination": { "total": 0, "limit": 50, "offset": 0, "has_more": false }
  }
}
```

---

### 4. Create Report - Valid
```bash
curl -X POST "https://YOUR_DOMAIN/api/reports/create.php" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 34.052,
    "lng": -118.243,
    "event_time": "2024-01-15T14:30:00Z",
    "city": "Los Angeles",
    "state": "CA",
    "tag": "vehicle",
    "summary": "White van spotted near downtown area with uniformed officers."
  }'
```

**Expected:** Success with UUID, visible_at (60 mins later), expires_at (48 hours later)

---

### 5. Create Report - Missing Location (Should Fail)
```bash
curl -X POST "https://YOUR_DOMAIN/api/reports/create.php" \
  -H "Content-Type: application/json" \
  -d '{
    "event_time": "2024-01-15T14:30:00Z",
    "summary": "Test without location"
  }'
```

**Expected:** Error "Location (lat/lng) is required"

---

### 6. Create Report - Unsafe Content (Should Fail)
```bash
curl -X POST "https://YOUR_DOMAIN/api/reports/create.php" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 34.052,
    "lng": -118.243,
    "event_time": "2024-01-15T14:30:00Z",
    "summary": "They are at 123 Main Street, apartment 4B. Call 555-123-4567."
  }'
```

**Expected:** Error "Report contains potentially unsafe content"

---

### 7. Rate Limiting Test
```bash
for i in {1..15}; do
  curl -s -X POST "https://YOUR_DOMAIN/api/reports/create.php" \
    -H "Content-Type: application/json" \
    -d '{"lat":34.052,"lng":-118.243,"event_time":"2024-01-15T14:30:00Z","summary":"Rate limit test '"$i"'"}' \
    | grep -o '"success":[^,]*'
  echo " - Request $i"
done
```

**Expected:** First 10 succeed, requests 11+ return "Rate limit exceeded"

---

### 8. Reports with Filter
```bash
curl -X GET "https://YOUR_DOMAIN/api/reports/list.php?city=Los%20Angeles&limit=10"
```

---

## Frontend Manual Tests

### Test 1: Local Storage (IndexedDB)
1. Open DevTools → Application → IndexedDB → meltingice-vault
2. Go to Report → Create New
3. Add description, get GPS, add photo
4. Verify data appears in IndexedDB
5. Refresh page - data should persist

### Test 2: Offline Capability
1. Load the app fully
2. Go to DevTools → Network → Offline
3. Navigate between pages
4. Verify core screens work (may show "Loading" for API data)
5. Go back online, data should load

### Test 3: Quick Exit
1. Click "Exit" button
2. Should redirect to weather.com
3. Press browser back - should NOT return to app

### Test 4: Wipe All Data
1. Create some reports locally
2. Go to Settings → Delete All Data
3. Confirm
4. Verify IndexedDB is empty
5. Report list should show "No incident reports"

### Test 5: Public Report Flow
1. Create local incident with GPS + description
2. Click "Post" button
3. Should show success with visibility delay
4. Wait 60+ minutes (or test with reduced delay)
5. Check home page map for marker

### Test 6: PDF Export
1. Create incident with details + attachments
2. Click "PDF" button
3. Verify PDF downloads with correct info
4. Check attachments are listed (not embedded)

### Test 7: Emergency SMS
1. Go to Right Now
2. Set up trusted contact
3. Tap "Emergency SMS"
4. Should open SMS app with pre-filled message

### Test 8: Content Sanitization
1. Create incident with:
   - Description containing "123 Main St" → Should NOT be allowed to post
   - Phone number → Should NOT be allowed to post
   - Clean description → Should post successfully

---

## Database Verification

### Check Coordinate Rounding
```sql
SELECT id, lat_approx, lng_approx FROM public_reports ORDER BY created_at DESC LIMIT 5;
```
Coordinates should have 3 decimal places max.

### Check Time Bucketing
```sql
SELECT id, event_time_bucket, created_at FROM public_reports ORDER BY created_at DESC LIMIT 5;
```
event_time_bucket minutes should be 00 or 30 only.

### Check Visibility Delay
```sql
SELECT id, created_at, visible_at, 
       TIMESTAMPDIFF(MINUTE, created_at, visible_at) as delay_mins 
FROM public_reports 
ORDER BY created_at DESC LIMIT 5;
```
delay_mins should be ~60.

### Check Expiration
```sql
SELECT id, created_at, expires_at,
       TIMESTAMPDIFF(HOUR, created_at, expires_at) as expire_hours
FROM public_reports
ORDER BY created_at DESC LIMIT 5;
```
expire_hours should be ~48.

### Verify No Sensitive Data
```sql
SELECT summary FROM public_reports WHERE 
  summary REGEXP '[0-9]{3}[-.]?[0-9]{3}[-.]?[0-9]{4}' OR
  summary REGEXP '[0-9]+\s+(street|st|avenue|ave|road|rd)';
```
Should return 0 rows.
