# Promo System

Backend and administration system for a five-week promotional campaign.

The system manages participant receipt submissions, manual receipt verification, weekly prize draws, winner confirmation and replacement, reporting, exports, and audit history.

## Technology

### Backend

- PHP 8.3+
- Laravel 13
- Laravel Sanctum
- MySQL
- PHPUnit

### Frontend

- React 19
- React Router
- TypeScript
- Vite
- Tailwind CSS

## Campaign Rules

Participation is receipt-based.

One valid receipt represents one entry in the prize draw.

A participant may submit multiple receipts. Each approved receipt participates independently.

When a receipt is selected as a winner, that receipt is permanently excluded from future draws. Other approved receipts belonging to the same participant remain eligible.

The campaign contains five weekly draws.

Current campaign prize inventory:

| Prize | Quantity |
|---|---:|
| Burn | 500 |
| New Balance Certificate | 20 |
| Electric Scooter | 5 |

Prize quantities are allocated across weekly draws by the organizer.

### Participant and receipt review rules

- A participant is identified by the exact normalized Armenian phone number and lowercase email pair.
- Different receipts submitted with the same participant identity belong to that participant.
- Participants do not have approval, rejection or suspicious statuses. Review state belongs to each receipt.
- Every accepted submission starts as `submitted` and must be permanently `approved` or `rejected` by an administrator.
- Only approved receipts are eligible for a draw. Approving a suspicious receipt keeps its review flags for audit history.
- A suspicious receipt requires an administrator review note before approval. Rejection always requires a reason.
- Receipt numbers are stored as trimmed strings, including leading zeroes. Non-numeric and duplicate numbers are review signals, not automatic rejection reasons.
- Exact duplicate images, reused phone/email identities and participant name mismatches are also receipt-level review signals.
- A rejected receipt may be resubmitted for correction; the new submission is independently reviewed and duplicate signals remain visible.

Production receipt submissions require `CAMPAIGN_START_AT` and
`CAMPAIGN_END_AT`. Both values are interpreted in `APP_TIMEZONE`; production
fails closed when the window is missing or invalid.

## Draw Process

A draw follows these states:

1. Draft or scheduled
2. Prize configuration
3. Participant snapshot preparation
4. Running
5. Randomization and execution
6. Completed
7. Winner confirmation or replacement

Before execution, the system creates an immutable snapshot of all receipts eligible for that draw.

The number of configured prize slots may not exceed the number of eligible receipts.

Once the snapshot is created, the draw configuration and prize allocation are locked.

## Randomization

The application supports two random providers.

### Local provider

Used for local development and testing.

```env
RANDOM_PROVIDER=local
```

### Random.org provider

Production draws use Random.org. Configure the key, then make one real request before opening the campaign:

```env
RANDOM_PROVIDER=random_org
RANDOM_ORG_API_KEY=your-production-key
```

```bash
php artisan promo:random-org-smoke
```

The command validates that Random.org returned a complete permutation and prints the provider request ID. It does not create or modify a campaign draw.

## Local Setup

Requirements: PHP 8.3+, Composer, MySQL, and Node.js `^20.19.0` or `>=22.12.0` with npm 10+.

```bash
composer setup
composer dev
```

`composer setup` uses `npm ci`, so frontend dependencies are installed exactly from `package-lock.json`. CAPTCHA is disabled in local development by default. Demo data remains disabled unless `SEED_DATASET=light` or `SEED_DATASET=full` is explicitly selected.

## Production Release

Start from `.env.production.example`, replace every placeholder, and keep the production file outside version control. In particular, set the real application URL, database credentials, campaign window, organizer identity, privacy contact, Turnstile keys and hostname, Random.org key, and initial administrator credentials.

Run the release process in this order:

```bash
composer install --no-dev --prefer-dist --optimize-autoloader
npm ci --ignore-scripts
npm run check
php artisan test
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan promo:release-check
php artisan promo:random-org-smoke
```

The release check fails unless production uses HTTPS, secure database-backed sessions, no demo data, a valid campaign window, real public/legal identity values, Turnstile, and Random.org.

After deployment, manually verify:

1. English and Armenian landing content, Privacy Policy, Official Rules, CAPTCHA and a real receipt submission.
2. Administrator login/logout and expired-session handling.
3. Receipt approval, suspicious-review note requirement, rejection reason and permanent decisions.
4. Draw preparation, prevention of early execution, successful Random.org execution and stored request ID.
5. Winner contact, confirmation, cancellation and reserve replacement.
6. Receipt, winner and draw CSV downloads in spreadsheet software.
7. Dashboard counts, Recent activity links and receipt/winner review links.

Back up the database and private receipt storage before deployment and before every migration. Confirm a restore procedure with the production host before the campaign opens.
