# MeltingICE.app

A community safety platform designed to help communities document, report, and stay informed. Built with privacy-first principles and local-first data storage.

![License](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![PHP](https://img.shields.io/badge/PHP-8.0+-purple)

## Features

- Emergency Mode - Quick access to rights information and emergency contacts
- Private Reporting - Document incidents locally with optional public sharing
- Live Activity Map - Community-sourced activity reports
- Know Your Rights - Swipeable cards with scripts to use
- Emergency SMS - One-tap alert to trusted contacts
- Community Hub - Events, donations, and resources

## Architecture

```
meltingice/
  app/                    # Next.js 15 frontend (App Router)
  components/             # React components
  hooks/                  # React hooks
  lib/                    # Frontend utilities and API client
  public/                 # Static assets
  backend/
    api/                  # PHP REST API
    migrations/           # SQL migration files
    vendor/               # PHP dependencies (Composer)
```

## Privacy First

- Local-first storage: All personal data stays in your browser (IndexedDB)
- No tracking: No analytics, no cookies, no user accounts required
- Sanitization: Public reports are stripped of identifying information
- Your choice: You decide what (if anything) to share publicly

## Development Setup

### Prerequisites

- Node.js 18+
- PHP 8.0+ with PDO MySQL
- MySQL/MariaDB database
- Composer (for PHP dependencies)

### Frontend

```bash
cd meltingice
npm install
npm run dev
```

### Backend

1. Copy environment template:
```bash
cp backend/.env.example backend/.env
```

2. Configure your database credentials in `backend/.env` (never commit this file)

3. Run migrations:
```sql
-- Run these in your database management tool
-- See backend/migrations/ for all SQL files
```

4. Install PHP dependencies:
```bash
cd backend
composer install
```

### Environment Variables

Backend (server `.env`):

| Variable | Description |
|----------|-------------|
| `DB_HOST` | Database host |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASS` | Database password |
| `ADMIN_SECRET` | Secret key for admin API endpoints |
| `SMTP_PASSWORD` | Email SMTP token |

Frontend (`.env.local` in `meltingice/`):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Base URL for the PHP API (e.g., `https://your-domain.com/api`) |

## Admin and Moderation

- `/admin` is the admin UI. It requires login, but the route is still publicly reachable. In production, restrict access at the server (basic auth, IP allowlist, or a separate admin deployment).
- Admin login: `POST /api/admin/login.php` returns a bearer token stored in localStorage for moderation requests.
- Community approval endpoints (`/api/admin/community/*`) require `X-Admin-Key: $ADMIN_SECRET`. Do not call these from the browser; keep them server-side or in internal tools.
- phpMyAdmin should never be public. Lock it down with IP allowlist or password protection.

## Security

- All admin endpoints require authentication or `ADMIN_SECRET`
- No hardcoded credentials in the codebase
- SQL injection prevention via prepared statements
- XSS prevention via input sanitization
- Rate limiting recommended at server level
- Use HTTPS and limit CORS to your actual domains

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the **AGPL-3.0 License** - see the [LICENSE](LICENSE) file for details.

This means:
- You can use, modify, and distribute this software
- You can run it for any purpose
- If you modify and host it publicly, you must share your changes
- Derivative works must also be AGPL-3.0

## Disclaimer

This software is provided for educational and community safety purposes. It is not legal advice. Always consult with qualified legal professionals for guidance on your specific situation.

---

Made with care for communities
