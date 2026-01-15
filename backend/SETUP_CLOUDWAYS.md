# MeltingICE.app - Cloudways Setup Instructions

## Prerequisites
- Cloudways account with a PHP application
- MySQL/MariaDB database
- Your Next.js frontend deployed (Vercel, Netlify, or self-hosted)

---

## Step 1: Database Setup

### 1.1 Create Database
1. Go to Cloudways Dashboard > Your Application > Database
2. Note your database credentials:
   - Database Name
   - Username
   - Password
   - Host (usually localhost)

### 1.2 Run Schema
1. Access phpMyAdmin from the Cloudways dashboard
2. Select your database
3. Go to the "SQL" tab
4. Paste the contents of `backend/schema.sql`
5. Click "Go" to execute

This creates:
- `public_reports` - Sanitized public reports
- `rate_limits` - Rate limiting tracking
- `resources` - KYR cards, agencies, templates, hotlines
- Seed data for resources

---

## Step 2: Upload PHP Files

### 2.1 File Structure
Upload the `backend/api/` folder to your Cloudways `public_html`:

```
public_html/
  api/
    init.php
    reports/
      list.php
      create.php
    resources/
      list.php
```

### 2.2 Configure Database Connection
Prefer environment variables in Cloudways:
- Go to Application Settings > Environment Variables
- Add: DB_HOST, DB_NAME, DB_USER, DB_PASS

If you must edit `api/init.php`, do it on the server only and never commit credentials.

### 2.3 Update CORS Origins
In `api/init.php`, update the allowed origins:

```php
$allowed_origins = [
    'https://meltingice.app',
    'https://www.meltingice.app',
    // Remove localhost for production
];
```

---

## Step 3: Configure HTTPS and Domain

1. Go to Application > Domain Management
2. Add your domain (e.g., api.meltingice.app or meltingice.app)
3. Enable SSL (Let's Encrypt)

---

## Step 4: Test Endpoints

### Test Resources List
```bash
curl -X GET "https://your-domain.com/api/resources/list.php"
```

Expected response:
```json
{
    "success": true,
    "data": {
        "kyr": [...],
        "agency": [...],
        "hotline": [...]
    }
}
```

### Test Reports List
```bash
curl -X GET "https://your-domain.com/api/reports/list.php"
```

### Test Report Creation
```bash
curl -X POST "https://your-domain.com/api/reports/create.php"   -H "Content-Type: application/json"   -d '{
    "lat": 34.052,
    "lng": -118.243,
    "event_time": "2024-01-15T14:30:00Z",
    "city": "Los Angeles",
    "state": "CA",
    "tag": "vehicle",
    "summary": "White van spotted near downtown area. Two officers in uniform."
  }'
```

Expected response:
```json
{
    "success": true,
    "message": "Report submitted successfully",
    "data": {
        "id": "uuid-here",
        "visible_at": "2024-01-15T15:30:00+00:00",
        "expires_at": "2024-01-17T14:30:00+00:00"
    }
}
```

---

## Step 5: Cron Job (Auto-Expire Reports)

Set up a cron job to delete expired reports:

1. Go to Cloudways > Application > Cron Jobs
2. Add new cron (runs every hour):

```
0 * * * * cd /home/master/applications/XXXXX/public_html && php -r "require 'api/init.php'; $pdo = getDB(); $pdo->exec('DELETE FROM public_reports WHERE expires_at < NOW()');"
```

---

## Step 6: Frontend Configuration

### 6.1 Environment Variable
Create `.env.local` in your Next.js project:

```
NEXT_PUBLIC_API_URL=https://meltingice.app/api
```

### 6.2 Build and Deploy
```bash
npm run build
npm run start
```

Or deploy to Vercel/Netlify with the environment variable set in their dashboard.

---

## Security Checklist

- [ ] Database credentials not committed to git
- [ ] CORS limited to your actual domains
- [ ] HTTPS enabled
- [ ] Rate limiting tested (10 requests/hour per IP)
- [ ] Removed localhost from CORS in production
- [ ] Tested content filtering (addresses, phone numbers blocked)
- [ ] phpMyAdmin is not publicly accessible
- [ ] ADMIN_SECRET set and kept server-side

---

## Troubleshooting

### CORS Errors
- Check `$allowed_origins` in init.php
- Ensure your frontend URL is listed exactly (with https://)

### Database Connection Failed
- Verify DB credentials in init.php or environment variables
- Check if database exists
- Ensure MySQL service is running

### 500 Errors
- Check PHP error logs: Cloudways > Logs > PHP Error Logs
- Enable error logging in init.php for debugging

### Rate Limit Issues
- Check rate_limits table
- Adjust RATE_LIMIT_MAX and RATE_LIMIT_WINDOW in init.php
