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
