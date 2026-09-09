# SpendWise — Architecture & Design Specification

> Source of truth for the build. Derived from `IDEA.md` (36 sections).
> Status: **design approved pending your go-ahead**. No code written yet.
> Stack: React (Vite) + Tailwind + Express + MongoDB/Mongoose + JWT. No extras beyond justified additions in §1.4.

---

## 0. Major design decisions (read this first)

`IDEA.md` §32.3 asks me to explain reasoning before major architectural decisions. These seven decisions shape everything below. Each one is a place where the obvious approach is wrong.

### D1 — Store money as integer paise, never floats

**Decision:** every monetary field is an `Number` holding **paise** (₹1 = 100 paise). `₹8,000` is stored as `800000`. Formatting to `₹8,000.00` happens only in the UI.

**Why:** JavaScript floats cannot represent decimal currency exactly. `0.1 + 0.2 === 0.30000000000000004`. In a splitting app this is not academic — it is the core feature. Splitting ₹8,000 three ways with floats gives `2666.6666666666665` each, summing to `7999.999999999999`. Your balances drift by fractions of a rupee, and after a hundred expenses a group's balances no longer sum to zero, which is the one invariant that must always hold.

With integers, the split is provably exact: `800000 / 3 → 266667 + 266667 + 266666 = 800000`. Exactly. Every time. (The distribution rule is the largest-remainder method, §6.2.)

**Tradeoff:** you must remember to multiply by 100 on input and divide by 100 on display. That is two utility functions (`toPaise`, `formatMoney`) used in exactly two places — the form layer and the display layer. That is a cheap price for an invariant you can never violate.

### D2 — One `Transaction` collection, discriminated by `type`

**Decision:** income and expenses live in one collection with `type: 'income' | 'expense'`, not two collections.

**Why:** the transaction history page (§9) and the money timeline (§22) interleave both in one chronological list. Two collections means every list query is two queries plus an in-memory merge plus broken pagination. One collection means one indexed query with a sort. The dashboard's `income - expense` becomes a single `$group` aggregation. Fields are ~90% identical anyway.

### D3 — Group members may not be registered users ("ghost members")

**Decision:** `Group.members[]` is an array of member objects with an **optional** `userId`. A member is either a linked SpendWise account or a name-only placeholder.

**Why:** this is the decision that makes the app usable on day one. Your `IDEA.md` example is "Goa Trip 2026 — Me, Rahul, Priya, Aman." Rahul, Priya and Aman do not have SpendWise accounts. If `members` were `[ObjectId]` referencing `User`, you could not create that group until you convinced three friends to sign up. The app would be unusable for its own headline example.

So each member carries its own stable `_id`, a `name`, an optional `email`, and an optional `userId`. All splits, balances and settlements reference the **member `_id`**, never the `userId`. If Rahul signs up later, you set `userId` on his member row and every historical balance still resolves correctly — no data migration.

**Tradeoff:** one level of indirection (member `_id` → maybe a user). Worth it. The alternative blocks the primary use case.

### D4 — Balances are computed, never stored

**Decision:** no `balance` field anywhere. `GET /groups/:id/balances` recomputes from `GroupExpense` + `Settlement` documents on every call.

**Why:** a stored balance is a cache, and a cache of financial data must be invalidated correctly on every create, edit, delete and settle, across concurrent requests. Get one path wrong and the app silently reports wrong money — the worst possible bug class here, because it is invisible and destroys trust. Computing from the source documents makes wrong balances *impossible by construction*.

The cost is real but small: a group with 500 expenses and 10 members is ~500 documents and a linear pass — single-digit milliseconds. You are nowhere near needing a cache.

**When to revisit:** if a single group exceeds ~5,000 expenses, add a `GroupBalanceSnapshot` collection with incremental updates. The API contract in §3 does not change, so this is a pure internal swap. Do not do it now.

### D5 — A group expense is NOT a personal transaction

**Decision:** creating a group expense writes **only** a `GroupExpense` document. It does not write a `Transaction`.

**Why:** this is the subtlest correctness issue in the product, and getting it wrong makes your dashboard lie.

You pay the ₹8,000 hotel bill for four people. How much did *you* spend? Not ₹8,000 — ₹6,000 of that is money other people owe you. It is a **receivable**, not an expense. Your actual personal spending is your ₹2,000 share.

If you naively wrote a ₹8,000 `Transaction`, the dashboard would show ₹8,000 of expenses and simultaneously ₹6,000 owed to you — double-counting the same rupees and understating your balance by ₹6,000.

So: `Transaction` stays purely personal. The dashboard summary (§3.7) runs three aggregations and combines them in the service layer:

```
totalExpenses  = Σ(personal expense transactions)
               + Σ(my share of every group expense I participate in)
othersOweMe    = Σ(what I paid on others' behalf, minus settlements received)
iOweOthers     = Σ(others paid on my behalf, minus settlements sent)
balance        = totalIncome − totalExpenses
```

Every rupee is counted exactly once. The transaction history page merges the two sources at read time for display (§3.4), tagging each row with its `source`.

**Tradeoff:** the dashboard endpoint is three queries instead of one. That is the correct price for a dashboard that tells the truth.

### D6 — Debt simplification is a *view*, not a mutation

**Decision:** simplification runs at read time behind `GET /groups/:id/balances?simplify=true`. It never rewrites, merges or deletes expense records.

**Why:** the raw expense ledger is the audit trail. When Rahul asks "why do I owe you ₹500?", you must be able to show him the dinner, the hotel and the cab that produced that number. If simplification collapsed `Rahul → Priya → Me` into `Rahul → Me` *in the database*, Priya's actual participation would be erased and the number would be unexplainable.

Both views are always available from the same immutable ledger. Settlements record what people *actually paid*, which may follow either view.

### D7 — Access token in memory, refresh token in an httpOnly cookie

**Decision:** short-lived access JWT (15 min) held in React state only. Long-lived refresh JWT (7 days) in an `httpOnly; Secure; SameSite` cookie. Axios interceptor transparently refreshes on `401`.

**Why:** `localStorage` is readable by any JavaScript on the page, so a single XSS bug — one compromised npm package, one unescaped render — hands an attacker a token that works for its full lifetime. `httpOnly` cookies are invisible to JavaScript entirely. Keeping the *access* token in memory means it dies on tab close and never touches disk; the refresh cookie silently restores the session on reload.

**Tradeoff:** cross-origin cookies need correct CORS (`credentials: true`, explicit origin, `SameSite=None; Secure` in production). This is the one genuine deployment friction point in the project — §5.6 documents the exact config so it does not bite you in Phase 10.

---

## 1. Deliverable 1 — Architecture & folder structure

### 1.1 System architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                          BROWSER (SPA)                           │
│                                                                  │
│   React 18 + Vite                                                │
│   ├─ Router (react-router-dom v6)  ── route guards               │
│   ├─ Context: AuthContext (user + access token in memory)        │
│   ├─ Pages ──► Feature components ──► UI primitives              │
│   ├─ Hooks  (useAuth, useFetch, useForm, useGroupBalances…)      │
│   └─ services/*.js  ── the ONLY place axios is called            │
│         │                                                        │
└─────────┼────────────────────────────────────────────────────────┘
          │  HTTPS  ·  Authorization: Bearer <access>
          │           Cookie: refreshToken (httpOnly)
          ▼
┌──────────────────────────────────────────────────────────────────┐
│                    EXPRESS API  (stateless)                      │
│                                                                  │
│  helmet → cors → rateLimit → json → cookieParser → morgan        │
│                          ↓                                       │
│  routes/      thin: path + middleware + controller ref           │
│      ↓                                                           │
│  middleware/  protect · validate(zod) · authorizeGroupMember     │
│      ↓                                                           │
│  controllers/ HTTP only: read req → call service → send res      │
│      ↓                                                           │
│  services/    ALL business logic. No req/res. Pure + testable.   │
│      │        splitService · balanceService · settlementService  │
│      ↓        dashboardService · reminderService                 │
│  models/      Mongoose schemas + indexes + validators            │
│      ↓                                                           │
│  errorHandler (last)  ── single JSON error shape                 │
└─────────┼────────────────────────────────────────────────────────┘
          ▼
   MongoDB Atlas  ·  Mongoose ODM
```

### 1.2 The layering rule (the one rule that keeps this maintainable)

**Controllers must contain no business logic. Services must contain no `req`/`res`.**

A controller reads input off the request, calls one service function, and sends the result. That is all. Every calculation — split maths, balance computation, debt simplification, dashboard aggregation — lives in `services/`.

Why this matters concretely: `splitService.calculateSplits()` is the highest-risk code in the app. Kept pure (plain inputs → plain outputs, no database, no HTTP), you can unit-test it against a table of tricky cases — ₹100 split 3 ways, percentages summing to 99.99, one participant, a zero share — in milliseconds with no server running. Tangled into a controller, you can only test it by firing HTTP requests at a live database, so in practice you won't test it, and the rounding bugs ship.

### 1.3 Repository layout

```
SpendWise/
├── IDEA.md
├── ARCHITECTURE.md            ← this file
├── README.md
├── .gitignore
│
├── client/                    React frontend (Vite)
│   ├── .env                   VITE_API_URL=http://localhost:5000/api
│   ├── index.html
│   ├── vite.config.js         includes @tailwindcss/vite plugin
│   ├── package.json           (Tailwind v4 needs no tailwind.config.js
│   │                           and no postcss.config.js — theme tokens
│   │                           live in src/index.css under @theme)
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                    router + provider tree
│       ├── index.css                  @import "tailwindcss" + @theme tokens
│       │
│       ├── assets/
│       │
│       ├── components/
│       │   ├── ui/                    dumb primitives, zero app knowledge
│       │   │   ├── Button.jsx  Input.jsx  Select.jsx  Modal.jsx
│       │   │   ├── Card.jsx  Badge.jsx  Avatar.jsx  Tabs.jsx
│       │   │   ├── Spinner.jsx  Skeleton.jsx  Toast.jsx
│       │   │   ├── EmptyState.jsx  ErrorState.jsx  ConfirmDialog.jsx
│       │   │   ├── DatePicker.jsx  AmountInput.jsx  Progress.jsx
│       │   │   └── Dropdown.jsx  Table.jsx  Pagination.jsx
│       │   │
│       │   ├── layout/
│       │   │   ├── Sidebar.jsx        desktop nav
│       │   │   ├── Topbar.jsx         search, profile menu
│       │   │   ├── BottomNav.jsx      mobile nav (§27)
│       │   │   └── PageHeader.jsx     title + primary action
│       │   │
│       │   ├── transactions/
│       │   │   ├── TransactionList.jsx      date-grouped
│       │   │   ├── TransactionRow.jsx
│       │   │   ├── TransactionForm.jsx      shared: income + expense
│       │   │   ├── TransactionFilters.jsx
│       │   │   └── CategoryPicker.jsx
│       │   │
│       │   ├── dashboard/
│       │   │   ├── SummaryCards.jsx
│       │   │   ├── BalanceCard.jsx
│       │   │   ├── SpendingByCategory.jsx
│       │   │   ├── RecentTransactions.jsx
│       │   │   └── DebtSummary.jsx
│       │   │
│       │   ├── groups/
│       │   │   ├── GroupCard.jsx
│       │   │   ├── GroupForm.jsx
│       │   │   ├── MemberList.jsx
│       │   │   ├── MemberInput.jsx          ghost-member entry (D3)
│       │   │   ├── GroupExpenseList.jsx
│       │   │   ├── GroupExpenseRow.jsx
│       │   │   └── GroupExpenseForm.jsx     orchestrates split UI
│       │   │
│       │   ├── splits/
│       │   │   ├── SplitTypeSelector.jsx    equal|exact|percentage|shares
│       │   │   ├── SplitEqual.jsx
│       │   │   ├── SplitExact.jsx
│       │   │   ├── SplitPercentage.jsx
│       │   │   ├── SplitShares.jsx
│       │   │   └── SplitSummary.jsx         live totals + validation banner
│       │   │
│       │   ├── settlements/
│       │   │   ├── BalanceList.jsx
│       │   │   ├── BalanceRow.jsx           owes / owed, with actions
│       │   │   ├── SettleUpModal.jsx
│       │   │   ├── SimplifyToggle.jsx
│       │   │   └── ReminderModal.jsx         generate + copy (§16)
│       │   │
│       │   ├── charts/
│       │   │   ├── IncomeExpenseChart.jsx
│       │   │   ├── CategoryPieChart.jsx
│       │   │   ├── MonthlyTrendChart.jsx
│       │   │   └── ChartContainer.jsx        title + loading + empty
│       │   │
│       │   └── common/
│       │       ├── ProtectedRoute.jsx
│       │       ├── PublicOnlyRoute.jsx
│       │       └── ErrorBoundary.jsx
│       │
│       ├── pages/                     one folder-free file per route
│       │   ├── Landing.jsx      Register.jsx   Login.jsx
│       │   ├── Dashboard.jsx    Transactions.jsx
│       │   ├── AddIncome.jsx    AddExpense.jsx
│       │   ├── Analytics.jsx    Reports.jsx
│       │   ├── Groups.jsx       GroupDetails.jsx  AddGroupExpense.jsx
│       │   ├── Settlements.jsx  Budgets.jsx
│       │   ├── Profile.jsx      Settings.jsx
│       │   └── NotFound.jsx
│       │
│       ├── layouts/
│       │   ├── AppLayout.jsx          sidebar + topbar + outlet
│       │   └── AuthLayout.jsx         centred card for login/register
│       │
│       ├── context/
│       │   ├── AuthContext.jsx        user, accessToken, login/logout
│       │   └── ToastContext.jsx
│       │
│       ├── hooks/
│       │   ├── useAuth.js       useForm.js      useFetch.js
│       │   ├── useDebounce.js   useMediaQuery.js
│       │   ├── useSplitCalculator.js   ← mirrors backend split maths
│       │   └── useGroupBalances.js
│       │
│       ├── services/                  ONLY axios lives here (§32.14)
│       │   ├── api.js                 axios instance + interceptors
│       │   ├── authService.js     transactionService.js
│       │   ├── groupService.js    expenseService.js
│       │   ├── settlementService.js   dashboardService.js
│       │   ├── categoryService.js     budgetService.js
│       │   └── reminderService.js
│       │
│       └── utils/
│           ├── money.js               toPaise · fromPaise · formatMoney
│           ├── date.js                formatDate · groupByDate · ranges
│           ├── splitCalculator.js     pure; shared logic with backend
│           ├── validators.js
│           └── constants.js           categories, methods, split types
│
└── server/                     Express backend
    ├── .env                    PORT MONGO_URI JWT_* CLIENT_URL
    ├── .env.example            committed; real .env is gitignored
    ├── package.json
    └── src/
        ├── server.js                  entry: connect DB, listen
        ├── app.js                     express app + middleware chain
        │
        ├── config/
        │   ├── db.js                  mongoose connection
        │   ├── env.js                 validate env vars at boot, fail fast
        │   └── constants.js           enums shared across models
        │
        ├── models/
        │   ├── User.js         Transaction.js   Category.js
        │   ├── Group.js        GroupExpense.js  Settlement.js
        │   ├── Budget.js       (Phase 9)
        │   └── Account.js      (Phase 9)
        │
        ├── routes/
        │   ├── index.js               mounts all routers under /api
        │   ├── authRoutes.js          transactionRoutes.js
        │   ├── categoryRoutes.js      groupRoutes.js
        │   ├── groupExpenseRoutes.js  mergeParams under /groups/:groupId
        │   ├── settlementRoutes.js    dashboardRoutes.js
        │   └── reminderRoutes.js
        │
        ├── controllers/               HTTP only, one per route file
        │
        ├── services/                  ALL business logic
        │   ├── authService.js
        │   ├── transactionService.js
        │   ├── splitService.js        ★ split maths (§6.1–6.3)
        │   ├── balanceService.js      ★ who-owes-whom (§6.4)
        │   ├── simplifyService.js     ★ debt simplification (§6.5)
        │   ├── settlementService.js
        │   ├── dashboardService.js
        │   ├── reminderService.js
        │   └── notification/          ← §17 seam, empty until Phase 9
        │       └── index.js           sendReminder(channel, payload)
        │
        ├── middleware/
        │   ├── protect.js             verify access JWT → req.user
        │   ├── validate.js            zod schema → 422 with field errors
        │   ├── authorizeGroupMember.js
        │   ├── errorHandler.js        single JSON error shape
        │   ├── notFound.js
        │   └── rateLimiter.js         strict on /auth, loose elsewhere
        │
        ├── validators/                zod schemas per resource
        │   ├── authValidators.js      transactionValidators.js
        │   ├── groupValidators.js     expenseValidators.js
        │   └── settlementValidators.js
        │
        └── utils/
            ├── ApiError.js            statusCode + code + message
            ├── tokens.js              sign/verify access + refresh
            ├── money.js               paise helpers, largest-remainder
            └── logger.js
```

### 1.4 Dependencies, and why each one is justified

`IDEA.md` §32.11 says: no unnecessary libraries. Every package below earns its place.

**Client**

| Package | Why |
|---|---|
| `react`, `react-dom` | core |
| `react-router-dom` | routing + guards (specified §3) |
| `axios` | interceptors — needed for silent token refresh (D7) |
| `tailwindcss` | specified §3 |
| `recharts` | specified §3; React-native charting |
| `date-fns` | date grouping/formatting; ~2KB per function vs moment's 70KB |
| `lucide-react` | icons; tree-shakeable |

**Server**

| Package | Why |
|---|---|
| `express`, `mongoose`, `dotenv` | core |
| `bcryptjs` | password hashing (§28) |
| `jsonwebtoken` | JWT (§28) |
| `cookie-parser` | read the httpOnly refresh cookie (D7) |
| `cors` | separate origins |
| `helmet` | security headers (§28) |
| `express-rate-limit` | §28 explicitly asks for rate limiting |
| `zod` | validation. Chosen over `express-validator` because the *same* schema file can be imported by the client (§32.16 wants validation on both sides), so the two can never drift |
| `morgan` | request logging (dev) |

**Deliberately excluded:** Redux (Context is enough — see §4.4), TypeScript (§32.8 asks for beginner-friendly; adds build friction), Docker (§30 doesn't ask), any UI kit (Tailwind + own primitives, per §26's "don't make everything a card").

---

## 2. Deliverable 2 — MongoDB schema

Conventions: all amounts are **integer paise** (D1). All schemas use `{ timestamps: true }`. `★` marks a field that differs from the draft in `IDEA.md` §23 — reasons given inline.

### 2.1 `User`

```js
{
  _id:          ObjectId,
  name:         String,   // required, trim, 2–60
  email:        String,   // required, unique, lowercase, trim, indexed
  password:     String,   // required, bcrypt hash, select: false        ★
  profileImage: String,   // URL, default ''
  currency:     String,   // default 'INR'                               ★
  refreshTokenHash: String, // sha256 of current refresh token, select:false ★
  passwordResetToken:   String,  // sha256, select: false                ★
  passwordResetExpires: Date,                                          // ★
  createdAt, updatedAt
}
```

★ `select: false` on `password` means it is **never** returned by a query unless explicitly asked for (`.select('+password')`). This turns "don't leak the hash" from a thing you must remember on every endpoint into a default that fails safe.

★ `refreshTokenHash` enables real logout. A JWT is valid until it expires — you cannot un-issue one. Storing a hash of the current refresh token and clearing it on logout means a stolen refresh token stops working immediately. Storing the *hash* rather than the token means a database leak does not hand over live sessions.

★ `currency` — the app is rupee-first, but one field now avoids a migration later.

**Indexes:** `{ email: 1 }` unique.

**Hooks:** `pre('save')` — hash password with bcrypt (cost 10) only when modified.
**Methods:** `comparePassword(plain)`.

### 2.2 `Category`

```js
{
  _id:       ObjectId,
  userId:    ObjectId | null,  // null = system default, visible to all   ★
  name:      String,           // 'Food'
  type:      'income' | 'expense',
  icon:      String,           // lucide icon name
  color:     String,           // hex, for chart consistency              ★
  isDefault: Boolean,          // system-seeded, not user-deletable
  createdAt, updatedAt
}
```

★ **Why a collection instead of an enum.** §6 requires custom categories. A `userId: null` row is a shared system default (Food, Transport, Rent…); a row with a `userId` is that user's own. One query `{ userId: { $in: [null, me] } }` returns both. `color` stored here means a category is the same colour in the pie chart, the trend chart and the transaction row — visual consistency for free.

**Indexes:** `{ userId: 1, type: 1 }`, `{ userId: 1, name: 1 }` unique (partial, `userId != null`).

### 2.3 `Transaction` — personal income & expenses only (D5)

```js
{
  _id:           ObjectId,
  userId:        ObjectId,   // ref User, required, indexed
  type:          'income' | 'expense',
  amount:        Number,     // paise, required, min 1 (never ≤ 0)        ★
  categoryId:    ObjectId,   // ref Category                             ★
  description:   String,     // required, 1–140
  paymentMethod: 'upi'|'cash'|'credit_card'|'debit_card'|'bank_transfer'|'wallet'|'other',
  accountId:     ObjectId | null,  // ref Account — Phase 9, null in MVP  ★
  date:          Date,       // required — the transaction date, not createdAt
  notes:         String,     // optional, ≤ 500
  createdAt, updatedAt
}
```

★ `min: 1` at the schema level directly satisfies §29's "negative expense" and "invalid amount" error cases. Sign is carried by `type`, never by the amount — mixing both is how ledgers end up with `-(-500)`.

★ `categoryId` as a ref rather than a string, so renaming a category updates history instead of orphaning it.

★ `date` is separate from `createdAt`: you record Saturday's dinner on Monday. Every list, filter and chart sorts on `date`; `createdAt` is audit only.

**Indexes:**
- `{ userId: 1, date: -1 }` — the transaction list and timeline. The workhorse.
- `{ userId: 1, type: 1, date: -1 }` — dashboard income/expense aggregation.
- `{ userId: 1, categoryId: 1, date: -1 }` — category breakdown.
- `{ description: 'text' }` — §9 search.

### 2.4 `Group`

```js
{
  _id:       ObjectId,
  name:      String,     // required, 1–60, e.g. 'Goa Trip 2026'
  description: String,   // optional
  createdBy: ObjectId,   // ref User, required
  members: [{                                                          // ★
    _id:      ObjectId,          // auto; THE identity used by all splits
    userId:   ObjectId | null,   // ref User; null = ghost member (D3)
    name:     String,            // required — display name, always present
    email:    String | null,     // optional; used to invite/link later
    phone:    String | null,     // optional; for future WhatsApp/SMS (§17)
    role:     'admin' | 'member',
    joinedAt: Date
  }],
  currency:  String,     // default 'INR'
  isArchived: Boolean,   // default false — never hard-delete a ledger  ★
  createdAt, updatedAt
}
```

★ **Members are embedded, not a separate collection.** Groups are small (typically 2–20, bounded in practice) and members are *always* loaded with the group — every balance screen needs the full roster. Embedding makes that one read instead of a join. This is the textbook case for embedding in MongoDB: small, bounded, always-accessed-together.

★ **`isArchived` instead of deletion.** Deleting a group with unsettled balances destroys the record of who owes whom. Archive hides it; the ledger survives. `DELETE /groups/:id` therefore archives, and is refused outright while non-zero balances exist (§3.5).

**Indexes:** `{ 'members.userId': 1 }` — "list every group I'm in" (multikey). `{ createdBy: 1 }`.

### 2.5 `GroupExpense` — the ledger

```js
{
  _id:         ObjectId,
  groupId:     ObjectId,   // ref Group, required, indexed
  description: String,     // required, e.g. 'Hotel'
  totalAmount: Number,     // paise, required, min 1
  currency:    String,
  paidBy:      ObjectId,   // ← member._id, NOT userId (D3)              ★
  splitType:   'equal' | 'exact' | 'percentage' | 'shares',
  participants: [{                                                      // ★
    memberId: ObjectId,    // ← member._id
    share:    Number,      // paise this member owes — ALWAYS resolved   ★
    value:    Number       // the raw input: % or share count; null for equal/exact
  }],
  category:    String,     // optional, loose grouping for trip expenses
  date:        Date,       // required
  notes:       String,
  receiptUrl:  String | null,   // Phase 9 (§18)
  createdBy:   ObjectId,   // ref User — audit: who entered it           ★
  createdAt, updatedAt
}
```

★ **`share` is always stored as a resolved paise amount, for every split type.** This is the most important schema decision after D1.

The temptation is to store percentages for a percentage split and let the reader recompute. Don't. Then *every* consumer — balances, simplification, the UI, the reminder generator — must independently re-derive the amounts and independently reproduce the exact same rounding, and any one of them getting it slightly wrong produces balances that don't reconcile. Instead, the split is resolved **once** at write time by `splitService`, validated to sum exactly to `totalAmount`, and stored. Every reader just adds up integers.

`value` retains the original input (40 for 40%, 2 for 2 shares) purely so the edit form can repopulate and so the UI can display "40%" rather than a bare rupee figure. It is never used in arithmetic.

**The invariant, enforced at write time and testable at any moment:**
```
Σ participants[].share === totalAmount    // exactly, in integer paise
```

**Indexes:** `{ groupId: 1, date: -1 }` — expense list + balance computation. `{ groupId: 1, 'participants.memberId': 1 }`. `{ 'participants.memberId': 1 }` — "my share across all groups" for the dashboard (D5).

### 2.6 `Settlement`

```js
{
  _id:        ObjectId,
  groupId:    ObjectId | null,   // null allows future non-group settlements ★
  fromMember: ObjectId,   // member._id — the payer
  toMember:   ObjectId,   // member._id — the receiver
  amount:     Number,     // paise, min 1
  status:     'pending' | 'confirmed' | 'cancelled',                    // ★
  method:     'upi'|'cash'|'bank_transfer'|'other',
  note:       String,
  recordedBy: ObjectId,   // ref User — who clicked "settle up"
  settledAt:  Date,       // when the money actually moved
  confirmedAt: Date | null,
  createdAt, updatedAt
}
```

★ **`pending | confirmed | cancelled`, not just `pending | settled`.** §14 asks for Pending → Settled. Two additions matter:

- A settlement recorded by the *receiver* ("Rahul paid me ₹2,000") is trustworthy and can be `confirmed` immediately. One recorded by the *payer* about a receiver who has a linked account is a claim the other side should confirm. Modelling this now means the trust flow can be switched on later without a migration.
- `cancelled` gives you a reversal path. A settlement is a financial record; deleting one erases history. Cancelling preserves it. **Only `confirmed` settlements affect balances** — one clear rule, stated once, applied everywhere.

**Indexes:** `{ groupId: 1, status: 1 }`, `{ fromMember: 1 }`, `{ toMember: 1 }`, `{ recordedBy: 1, createdAt: -1 }`.

### 2.7 Post-MVP models (defined now so nothing needs restructuring later)

```js
// Budget — §20, Phase 9
{ _id, userId, categoryId, amount /*paise*/, period: 'monthly',
  startDate, isActive, createdAt, updatedAt }
// index: { userId: 1, categoryId: 1, period: 1 } unique

// Account — §7, Phase 9. MVP uses the paymentMethod enum instead.
{ _id, userId, name /*'HDFC Bank'*/, type: 'bank'|'wallet'|'cash'|'card',
  balance /*paise*/, isActive, createdAt, updatedAt }
// NOTE (§7): never store PINs, CVVs, passwords or account numbers.

// Reminder — §16 history, Phase 8
{ _id, groupId, fromMember, toMember, amount, channel: 'copy'|'email'|'sms'|'whatsapp',
  message, status: 'generated'|'sent'|'failed', sentAt, createdAt }
```

### 2.8 Relationship map

```
User ─1:N─ Transaction          (userId)
User ─1:N─ Category             (userId; null = system default)
User ─1:N─ Group                (createdBy)
User ─M:N─ Group                (members[].userId — nullable, D3)

Group ─1:N─ GroupExpense        (groupId)
Group ─1:N─ Settlement          (groupId)
Group.members[]._id  ◄── referenced by ──  GroupExpense.paidBy
                                            GroupExpense.participants[].memberId
                                            Settlement.fromMember / toMember

Balances: DERIVED from GroupExpense + confirmed Settlement.  Never stored. (D4)
```

---

## 3. Deliverable 3 — REST API design

### 3.1 Conventions

**Base URL:** `/api` · **Auth:** `Authorization: Bearer <accessToken>` except where marked public.

**Every response uses one envelope**, so the client never guesses at shape:

```jsonc
// success
{ "success": true, "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 87 } }

// error  (§29 wants useful error responses)
{ "success": false,
  "error": {
    "code": "SPLIT_TOTAL_MISMATCH",       // stable, machine-readable
    "message": "Split amounts must add up to ₹8,000.00 (currently ₹7,500.00)",
    "fields": { "participants": "Short by ₹500.00" }   // for inline form errors
  } }
```

`code` is stable and switchable in client code; `message` is human-facing and safe to display; `fields` maps directly onto form inputs so §29's "friendly messages" land next to the offending input rather than in a generic banner.

**Status codes:** `200` ok · `201` created · `204` deleted · `400` malformed · `401` missing/expired token · `403` authenticated but not permitted · `404` not found *or not yours* · `409` conflict (duplicate email, settling a settled debt) · `422` validation failed · `429` rate-limited · `500` unexpected.

> **`404` for another user's data, never `403`.** Returning `403` confirms the resource exists, which leaks information. §28 requires users cannot access others' financial data — that includes not learning it exists.

**Money over the wire:** integers in paise, both directions. `{ "amount": 800000 }` means ₹8,000.00. The client converts at the form boundary.

**Errors used across the app** (§29 checklist, one code each):
`VALIDATION_ERROR` · `INVALID_CREDENTIALS` · `EMAIL_EXISTS` · `TOKEN_EXPIRED` · `TOKEN_INVALID` · `UNAUTHORIZED` · `FORBIDDEN` · `NOT_FOUND` · `INVALID_AMOUNT` · `SPLIT_TOTAL_MISMATCH` · `PERCENTAGE_NOT_100` · `INVALID_PARTICIPANTS` · `PAYER_NOT_MEMBER` · `GROUP_HAS_BALANCES` · `ALREADY_SETTLED` · `RATE_LIMITED`

### 3.2 Auth — `/api/auth`

| Method | Path | Auth | MVP | Purpose |
|---|---|---|:--:|---|
| POST | `/register` | public | ✅ | Create user, seed default categories, issue tokens |
| POST | `/login` | public | ✅ | Verify credentials, issue tokens |
| POST | `/refresh` | cookie | ✅ | New access token from refresh cookie |
| POST | `/logout` | cookie | ✅ | Clear cookie + `refreshTokenHash` |
| GET | `/me` | ✅ | ✅ | Current user |
| PATCH | `/me` | ✅ | — | Update name / profileImage |
| PATCH | `/change-password` | ✅ | — | Requires current password |
| POST | `/forgot-password` | public | — | Email reset token |
| POST | `/reset-password/:token` | public | — | Consume token, set password |

```jsonc
// POST /api/auth/register
→ { "name": "Prity", "email": "p@ex.com", "password": "••••••••" }
← 201 { "success": true,
        "data": { "user": { "_id": "…", "name": "Prity", "email": "p@ex.com" },
                  "accessToken": "eyJ…" } }
   Set-Cookie: refreshToken=eyJ…; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800
```
The refresh token appears **only** in the cookie, never in the JSON body. `Path=/api/auth` means the browser doesn't attach it to unrelated requests.

### 3.3 Categories — `/api/categories`

| Method | Path | MVP | Notes |
|---|---|:--:|---|
| GET | `/?type=expense` | ✅ | System defaults + this user's custom |
| POST | `/` | ✅ | Custom category (§6) |
| PATCH | `/:id` | — | Own custom only |
| DELETE | `/:id` | — | `409` if transactions reference it |

### 3.4 Transactions — `/api/transactions`

| Method | Path | MVP | Notes |
|---|---|:--:|---|
| GET | `/` | ✅ | List + filter + search + paginate |
| POST | `/` | ✅ | Create income or expense |
| GET | `/:id` | ✅ | |
| PATCH | `/:id` | ✅ | Partial update |
| DELETE | `/:id` | ✅ | |
| GET | `/timeline` | — | §22, date-bucketed |

**Query params on `GET /`** (covers all of §9):
`type` · `categoryId` · `paymentMethod` · `from` / `to` (ISO dates) · `minAmount` / `maxAmount` (paise) · `search` (text on description) · `sort` (`date`|`amount`, default `-date`) · `page` · `limit` (default 20, max 100)

```jsonc
// GET /api/transactions?type=expense&from=2026-09-01&page=1
← 200 { "success": true,
        "data": [ { "_id":"…", "type":"expense", "amount":45000,
                    "category": { "_id":"…","name":"Food","icon":"utensils","color":"#F97316" },
                    "description":"Dinner", "paymentMethod":"upi",
                    "date":"2026-09-08T00:00:00.000Z", "source":"personal" } ],
        "meta": { "page":1, "limit":20, "total":37, "totalPages":2 } }
```

`source` is `"personal"` here. The **history view** (`GET /transactions?include=group,settlements`) merges in group expenses (as your resolved share) and settlements, each tagged `source: "group" | "settlement"` and carrying `groupId`/`groupName`. Per D5 these are read-time projections, not stored rows — so the list satisfies §9 without ever double-counting money.

### 3.5 Groups — `/api/groups`

| Method | Path | MVP | Notes |
|---|---|:--:|---|
| GET | `/` | ✅ | My groups + my net balance in each |
| POST | `/` | ✅ | Creator auto-added as `admin` member |
| GET | `/:groupId` | ✅ | Group + members + summary |
| PATCH | `/:groupId` | ✅ | Rename / describe (admin) |
| DELETE | `/:groupId` | ✅ | Archive; `409 GROUP_HAS_BALANCES` if unsettled |
| POST | `/:groupId/members` | ✅ | Add member — ghost or linked (D3) |
| PATCH | `/:groupId/members/:memberId` | — | Rename, attach email |
| DELETE | `/:groupId/members/:memberId` | ✅ | `409` if member has any expense/balance |

```jsonc
// POST /api/groups   — ghost members need only a name (D3)
→ { "name": "Goa Trip 2026",
    "members": [ { "name": "Rahul", "email": "rahul@ex.com" },
                 { "name": "Priya" },
                 { "name": "Aman" } ] }
← 201 data.members = [ { "_id":"m1","userId":"<me>","name":"Prity","role":"admin" },
                       { "_id":"m2","userId":null,"name":"Rahul","email":"rahul@ex.com" },
                       { "_id":"m3","userId":null,"name":"Priya" },
                       { "_id":"m4","userId":null,"name":"Aman" } ]
```

### 3.6 Group expenses & balances — `/api/groups/:groupId/…`

| Method | Path | MVP | Notes |
|---|---|:--:|---|
| POST | `/expenses` | ✅ | Create; server resolves + validates split |
| GET | `/expenses` | ✅ | Paginated, `-date` |
| GET | `/expenses/:expenseId` | ✅ | With per-member resolved shares |
| PATCH | `/expenses/:expenseId` | ✅ | Re-resolves and re-validates the split |
| DELETE | `/expenses/:expenseId` | ✅ | |
| POST | `/expenses/preview` | ✅ | **Validate a split without saving** |
| GET | `/balances` | ✅ | Net + pairwise; `?simplify=true` |
| GET | `/summary` | — | Totals, per-member spend, top category |

`POST /expenses/preview` exists so the split form can show live, *server-authoritative* per-person amounts as the user types — identical maths to the save path, so the preview can never disagree with what gets stored.

```jsonc
// POST /api/groups/g1/expenses   — equal split, ₹8,000, 4 people
→ { "description": "Hotel", "totalAmount": 800000, "date": "2026-09-08",
    "paidBy": "m1", "splitType": "equal",
    "participants": [ {"memberId":"m1"},{"memberId":"m2"},
                      {"memberId":"m3"},{"memberId":"m4"} ] }
← 201 data.participants = [ {"memberId":"m1","share":200000},
                            {"memberId":"m2","share":200000},
                            {"memberId":"m3","share":200000},
                            {"memberId":"m4","share":200000} ]

// percentage split
→ { …, "splitType": "percentage",
    "participants": [ {"memberId":"m1","value":40},{"memberId":"m2","value":20},
                      {"memberId":"m3","value":20},{"memberId":"m4","value":20} ] }
   // 422 PERCENTAGE_NOT_100 if Σvalue ≠ 100

// exact split
→ { …, "splitType": "exact",
    "participants": [ {"memberId":"m1","share":200000},{"memberId":"m2","share":150000},
                      {"memberId":"m3","share":250000},{"memberId":"m4","share":200000} ] }
   // 422 SPLIT_TOTAL_MISMATCH if Σshare ≠ totalAmount
```

```jsonc
// GET /api/groups/g1/balances
← 200 { "success": true, "data": {
    "netBalances": [                       // + = owed to them, − = they owe
      { "memberId":"m1", "name":"Prity", "net":  600000 },
      { "memberId":"m2", "name":"Rahul", "net": -200000 },
      { "memberId":"m3", "name":"Priya", "net": -200000 },
      { "memberId":"m4", "name":"Aman",  "net": -200000 } ],
    "pairwise": [                          // raw truth, from the ledger
      { "from":"m2","fromName":"Rahul","to":"m1","toName":"Prity","amount":200000 },
      { "from":"m3","fromName":"Priya","to":"m1","toName":"Prity","amount":200000 },
      { "from":"m4","fromName":"Aman", "to":"m1","toName":"Prity","amount":200000 } ],
    "simplified": null,                    // populated only when ?simplify=true
    "myBalance": { "memberId":"m1", "net":600000, "owedToMe":600000, "iOwe":0 }
} }
```

### 3.7 Settlements — `/api/settlements`

| Method | Path | MVP | Notes |
|---|---|:--:|---|
| POST | `/` | ✅ | Record a payment (§14 "mark as paid") |
| GET | `/` | ✅ | Filter `groupId`, `status`, `memberId` |
| GET | `/:id` | ✅ | |
| PATCH | `/:id` | ✅ | Confirm or cancel |
| DELETE | `/:id` | — | Prefer cancel; hard delete admin-only |

```jsonc
// POST /api/settlements   — Rahul pays Prity ₹2,000
→ { "groupId":"g1", "fromMember":"m2", "toMember":"m1",
    "amount":200000, "method":"upi", "settledAt":"2026-09-10" }
← 201 { …, "status":"confirmed" }
   // 422 if amount exceeds what fromMember actually owes toMember
```

Balances recompute automatically on the next `GET /balances` — no cache to invalidate (D4).

### 3.8 Dashboard, analytics & reminders

| Method | Path | MVP | Notes |
|---|---|:--:|---|
| GET | `/api/dashboard/summary` | ✅ | §8 five headline figures |
| GET | `/api/dashboard/spending?period=month` | ✅ | Category breakdown for the chart |
| GET | `/api/dashboard/analytics?from=&to=` | — | §19 trends, month-over-month |
| GET | `/api/dashboard/timeline` | — | §22 |
| POST | `/api/reminders/generate` | ✅ | Returns message text (§16) |
| GET | `/api/reminders` | — | History (Phase 8) |
| GET/POST/PATCH/DELETE | `/api/budgets` | — | §20 (Phase 9) |

```jsonc
// GET /api/dashboard/summary?period=month     ← the D5 arithmetic, made concrete
← 200 { "success": true, "data": {
    "totalIncome":   5000000,   // ₹50,000
    "totalExpenses": 1450000,   // ₹14,500  = personal + MY SHARE of group expenses
    "balance":       3550000,   // ₹35,500
    "othersOweMe":    250000,   // ₹2,500
    "iOweOthers":     100000,   // ₹1,000
    "period": { "from":"2026-09-01", "to":"2026-09-30" } } }

// POST /api/reminders/generate
→ { "groupId":"g1", "toMember":"m2", "amount":50000, "context":"dinner" }
← 200 { "data": { "message":
    "Hey Rahul 👋 Your share for dinner was ₹500. Please send it whenever you get a chance. Thanks!" } }
```

Reminder text is generated **server-side** even though the MVP only copies it to the clipboard. §17 wants email/SMS/WhatsApp later; with generation already behind `reminderService` + the `services/notification/` seam, adding a channel is a new adapter and a `channel` parameter — the message logic, the endpoint and the entire client stay untouched.

---

## 4. Deliverable 4 — Frontend pages & component structure

### 4.1 Route map

| # | Route | Page | Access | Layout | MVP |
|---|---|---|---|---|:--:|
| 1 | `/` | Landing | public | none | ✅ |
| 2 | `/register` | Register | public-only | Auth | ✅ |
| 3 | `/login` | Login | public-only | Auth | ✅ |
| 4 | `/dashboard` | Dashboard | protected | App | ✅ |
| 5 | `/transactions` | Transactions | protected | App | ✅ |
| 6 | `/transactions/new?type=income` | AddIncome | protected | App | ✅ |
| 7 | `/transactions/new?type=expense` | AddExpense | protected | App | ✅ |
| 8 | `/analytics` | Analytics | protected | App | — |
| 9 | `/groups` | Groups | protected | App | ✅ |
| 10 | `/groups/:groupId` | GroupDetails | protected+member | App | ✅ |
| 11 | `/groups/:groupId/expenses/new` | AddGroupExpense | protected+member | App | ✅ |
| 12 | `/groups/:groupId/settlements` | Settlements | protected+member | App | ✅ |
| 13 | `/budgets` | Budgets | protected | App | — |
| 14 | `/reports` | Reports | protected | App | — |
| 15 | `/profile` | Profile | protected | App | — |
| 16 | `/settings` | Settings | protected | App | — |
| — | `*` | NotFound | public | — | ✅ |

`public-only` redirects an already-authenticated user to `/dashboard` — so a logged-in user hitting `/login` doesn't see a pointless form.

`AddIncome` and `AddExpense` are separate route entries but render the same `TransactionForm` with a different `type` — §32.13 asks for reusable components, and the two forms differ only in category list and accent colour.

### 4.2 Navigation

**Desktop (≥1024px)** — persistent sidebar: Dashboard · Transactions · Groups · Analytics · Budgets · Reports, with Profile/Settings/Logout in the topbar menu.

**Mobile (<768px)** — bottom tab bar with five items (Dashboard · Transactions · **+** · Groups · More). The centre **+** opens an action sheet: Add Income / Add Expense / Add Group Expense.

§27 singles out the group-splitting flow as needing to work well on mobile — that is exactly when you're splitting a bill, standing in a restaurant. So `AddGroupExpense` is a **full-screen mobile stepper**, not a cramped desktop form:

```
Step 1  Amount + description        big numeric keypad-friendly input
Step 2  Who paid                    single-select member list
Step 3  Split between whom          multi-select, defaults to all
Step 4  How to split                4 tabs; live per-person amounts + running
                                    remainder banner; Save disabled until valid
```

### 4.3 Component hierarchy for the two hardest screens

```
AddGroupExpense  (page)
└── GroupExpenseForm
    ├── AmountInput                 paise-aware; displays ₹, stores integer
    ├── Input (description) · DatePicker
    ├── MemberList  variant="single"    → paidBy
    ├── MemberList  variant="multi"     → participants
    ├── SplitTypeSelector               → equal | exact | percentage | shares
    ├── ─ SplitEqual        read-only per-person preview
    │   ─ SplitExact        amount input per participant
    │   ─ SplitPercentage   % input per participant
    │   └ SplitShares       stepper per participant
    ├── SplitSummary        "₹8,000 of ₹8,000 allocated ✓" | "₹500 remaining ✗"
    └── Button (disabled until valid)

GroupDetails  (page)
├── PageHeader (name, member avatars, Settle Up, Add Expense)
├── Tabs
│   ├── Expenses    → GroupExpenseList → GroupExpenseRow
│   ├── Balances    → SimplifyToggle
│   │                 BalanceList → BalanceRow → [Remind] [Settle Up]
│   └── Members     → MemberList + MemberInput
├── SettleUpModal   (prefilled from the BalanceRow you clicked)
└── ReminderModal   (generated text + Copy button)
```

### 4.4 State management

**React Context + local state. No Redux.**

Genuinely global state is exactly two things: the authenticated user (+ access token) and toasts. Everything else — transactions, groups, balances — is *server* state scoped to one screen, fetched on mount, and refetched after mutation. Redux would add a store, actions, reducers and boilerplate to solve a problem this app does not have. (§32.11.)

| State | Where | Why |
|---|---|---|
| user, accessToken | `AuthContext` | needed by guards, topbar, every request |
| toasts | `ToastContext` | fired from anywhere |
| server data | page-level `useFetch` | scoped to one screen; refetch on mutate |
| form fields | `useForm` in the form | never leaves the form |
| split draft | `useSplitCalculator` | recomputes locally as you type; server validates on submit |

**If refetch-after-mutate starts to feel repetitive around Phase 5**, that is the signal to add TanStack Query — not before. Adding it now would be optimising a problem you have not met.

### 4.5 UI states — non-negotiable (§26, §32.15)

Every data-driven component ships four states before it is considered done:

| State | Treatment |
|---|---|
| **Loading** | `Skeleton` matching final layout — not a centred spinner. Prevents layout shift. |
| **Empty** | `EmptyState`: icon, one line of explanation, and the primary action. "No expenses yet — add your first one to start tracking." Never a blank panel. |
| **Error** | `ErrorState`: friendly message from `error.message` + a Retry button. Never a raw stack trace. |
| **Success** | Toast + optimistic list update where safe. |

Per §26, cards are used for genuine visual grouping (summary tiles, charts) — the transaction list is a plain divided list, not 40 nested cards.

### 4.6 Design tokens (defined once in `index.css`)

```
Semantic colour:  income  emerald-600   ·  expense  rose-600
                  owed-to-me  emerald   ·  i-owe   amber-600
                  primary  indigo-600   ·  surface  white / slate-950
Type scale:       12 · 14 · 16 · 20 · 24 · 32   (amounts use tabular-nums)
Spacing:          4 · 8 · 12 · 16 · 24 · 32 · 48
Radius:           sm 6 · md 10 · lg 16
Breakpoints:      sm 640 · md 768 · lg 1024 · xl 1280
```

Money always renders with `tabular-nums` so digits align vertically in lists — a small detail that is the difference between "looks like a spreadsheet" and "looks like a fintech product" (§26).

---

## 5. Deliverable 5 — Authentication flow

### 5.1 Token strategy (D7)

| | Access token | Refresh token |
|---|---|---|
| Lifetime | 15 minutes | 7 days |
| Stored | React memory (`AuthContext`) | `httpOnly` cookie |
| Sent as | `Authorization: Bearer …` | automatic cookie on `/api/auth/*` |
| Payload | `{ sub: userId, iat, exp }` | `{ sub: userId, jti: <random uuid>, iat, exp }` |
| Secret | `JWT_ACCESS_SECRET` | `JWT_REFRESH_SECRET` (different!) |
| Revocable | no (short life limits damage) | yes (hash in DB) |

Two different secrets, so a leaked access secret cannot be used to forge refresh tokens. The JWT payload carries **no name, email or financial data** — a JWT is signed, not encrypted, and anyone holding it can read the payload.

### 5.2 Registration

```
Client                          Server
  │  POST /auth/register {name,email,password}
  │─────────────────────────────►│
  │                              │ 1. zod: email valid, password ≥ 8
  │                              │ 2. existing email? → 409 EMAIL_EXISTS
  │                              │ 3. bcrypt.hash(password, 10)   [pre-save hook]
  │                              │ 4. create User
  │                              │ 5. sign access + refresh
  │                              │ 6. store sha256(refresh) on user
  │◄─────────────────────────────│ 201 {user, accessToken}
  │                                 Set-Cookie: refreshToken (httpOnly)
  │ 7. AuthContext.setUser/setToken → navigate /dashboard
```

**Registration seeds no categories.** An earlier draft of this flow copied 11
default categories onto every new user, which contradicts §2.2: system defaults
are shared rows with `userId: null`, read by every user via
`{ userId: { $in: [null, me] } }`. That is 11 rows in total rather than 11 per
user, and renaming a default later fixes it everywhere at once. The global
defaults are inserted by a one-time seed script in Phase 3.

### 5.3 Login

```
POST /auth/login {email,password}
  → User.findOne({email}).select('+password')
  → not found?          → 401 INVALID_CREDENTIALS
  → bcrypt.compare fail → 401 INVALID_CREDENTIALS   ← identical message & timing
  → issue tokens, store refresh hash, 200 + Set-Cookie
```

The same error for "no such email" and "wrong password" is deliberate: differentiating them turns the login form into an account-enumeration oracle.

### 5.4 Silent refresh — the flow that makes 15-minute tokens usable

```
Client                                    Server
  │ GET /api/transactions  (Bearer expired)
  │─────────────────────────────────────────►│ 401 TOKEN_EXPIRED
  │◄─────────────────────────────────────────│
  │ axios response interceptor catches 401:
  │   POST /api/auth/refresh  (cookie auto-sent)
  │─────────────────────────────────────────►│ verify refresh JWT
  │                                          │ compare sha256 to stored hash
  │                                          │ rotate: new refresh, new hash
  │◄─────────────────────────────────────────│ 200 {accessToken} + new cookie
  │ update AuthContext, RETRY original request transparently
  │ (refresh itself fails → clear auth, redirect /login)
```

The user never sees this. Implementation notes that matter:
- **Queue concurrent 401s.** If the dashboard fires four requests and all four 401, you must refresh **once** and replay all four — otherwise four parallel refreshes race, each rotating the token, and three get invalidated. Use a module-level `isRefreshing` flag plus a pending-request queue in `services/api.js`.
- **Never retry a failed `/auth/refresh`** — that is an infinite loop. Flag the request and bail to logout.
- **Rotate on every refresh.** A used refresh token is immediately dead, so a stolen one is usable at most once and its use invalidates the legitimate session — the theft becomes visible.
- **Every refresh token needs a random `jti`.** Without one, two tokens signed for the same user within the same second are identical (`iat` is only second-resolution), so the stored hash still matches after rotation and a replayed token is accepted. Rotation is only as strict as the tokens are unique.

### 5.5 Logout & route protection

`POST /auth/logout` clears `refreshTokenHash` server-side and sends `Set-Cookie: refreshToken=; Max-Age=0`. Clearing the hash is what makes logout *real* — otherwise a copied cookie keeps working for seven days.

```jsx
// ProtectedRoute — loading state is essential, not optional
const { user, isLoading } = useAuth();
if (isLoading) return <FullPageSpinner />;      // ← without this, a page refresh
if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
return <Outlet />;                              //   bounces you to /login before
                                                //   the refresh call resolves
```

On mount, `AuthContext` calls `/auth/refresh` once to restore the session after a page reload, holding `isLoading` true until it settles.

### 5.6 Authorization — two layers, always both

Authentication ≠ authorization. §32.19: *never assume a user may access another user's data.*

**Layer 1 — `protect` middleware:** verify the access JWT, load the user, attach `req.user`. Rejects anonymous requests.

**Layer 2 — ownership, enforced in the query itself:**

```js
// ✅ ownership is part of the filter — a wrong id simply returns nothing
const txn = await Transaction.findOne({ _id: id, userId: req.user._id });
if (!txn) throw new ApiError(404, 'NOT_FOUND', 'Transaction not found');

// ❌ never: fetch, then check. One forgotten `if` leaks another user's finances.
```

Making ownership part of the *filter* rather than a follow-up check means forgetting it produces an obvious bug during development, not a silent data leak in production.

**Group access — `authorizeGroupMember`:** loads the group, confirms `req.user._id` appears in `members[].userId`, attaches `req.group` and `req.member` for downstream handlers. Applied to every `/groups/:groupId/*` route.

| Action | Permitted |
|---|---|
| View group, expenses, balances | any member with a linked account |
| Add / edit / delete an expense | any linked member |
| Add / remove members | `admin` only |
| Rename / archive group | `admin` only |
| Record a settlement | either party, or an admin |

### 5.7 Security checklist (§28)

- [x] bcrypt cost 10; `password` is `select: false`
- [x] Two JWT secrets, ≥ 32 random bytes each, from env, never in client code
- [x] Refresh token `httpOnly` + `Secure` + `SameSite` + scoped `Path`
- [x] Refresh rotation + server-side hash → real revocation
- [x] `helmet` security headers
- [x] CORS: **explicit origin** (never `*` with credentials), `credentials: true`
- [x] Rate limits: `/auth/login` + `/auth/register` 5/15min per IP; global 100/15min
- [x] zod validation on every write, shared with the client
- [x] Mongoose `runValidators: true` on updates
- [x] Ownership in every query filter
- [x] `errorHandler` returns generic text on 500 — never stack traces to the client
- [x] `.env` gitignored; `.env.example` committed
- [x] §7: never store PINs, CVVs, card numbers or banking credentials

**Deployment note (the D7 tradeoff, so it doesn't surprise you in Phase 10):** on separate origins (Vercel client + Render API), the refresh cookie needs `SameSite=None; Secure` in production and `SameSite=Lax` in local dev, and CORS must name the exact client origin with `credentials: true`. Drive it off `NODE_ENV` in `config/env.js` from Phase 2 and it will already be right when you deploy.

---

## 6. Deliverable 6 — Split & settlement logic

This is the heart of the product and the highest-risk code in it. All of it lives in three pure services — `splitService`, `balanceService`, `simplifyService` — with no database or HTTP access, so every rule below is directly unit-testable (§1.2).

### 6.1 The two invariants

Everything in this section exists to protect these:

```
I1.  For every expense:  Σ participants[].share === totalAmount      (exact, paise)
I2.  For every group:    Σ members[].netBalance === 0                (exact, paise)
```

If I1 holds for every expense, I2 follows automatically — every rupee owed by someone is owed to someone. **I2 is your canary:** assert it in tests and after every mutation. If a group's balances ever fail to sum to zero, money has been invented or destroyed, and you know the bug is in split resolution rather than anywhere else.

### 6.2 The rounding rule (largest remainder, payer absorbs the dust)

₹100 split three ways cannot be divided evenly. Naive rounding gives ₹33.33 × 3 = ₹99.99 — a paisa vanishes, and I2 breaks.

```
distribute(total, weights[]) → shares[]        // all integers, in paise
  1. totalWeight = Σ weights
  2. for each i:  exact_i = total × weight_i / totalWeight
                  base_i  = floor(exact_i)
                  rem_i   = exact_i − base_i          (fractional part)
  3. leftover = total − Σ base_i                       (an integer, 0 ≤ leftover < n)
  4. distribute the `leftover` paise, one each, in this order:
        a. the payer first          ← whoever fronted the cash absorbs the dust
        b. then by descending rem_i  ← largest fractional remainder next
        c. ties broken by memberId ascending   ← deterministic, always
  5. assert Σ shares === total
```

**Worked example — ₹100 (10000 paise) between 3 people, Prity paid:**

| | exact | base | remainder | +leftover | final |
|---|---|---|---|---|---|
| Prity (payer) | 3333.33 | 3333 | .33 | +1 | **3334** = ₹33.34 |
| Rahul | 3333.33 | 3333 | .33 | | **3333** = ₹33.33 |
| Priya | 3333.33 | 3333 | .33 | | **3333** = ₹33.33 |
| | | 9999 | | leftover 1 | **10000** ✓ |

Rule 4a ("payer first") is a product decision, not just a tiebreak: the person who fronted the money absorbs the extra paisa. It is trivially explainable to users, it is deterministic, and it never leaves anyone feeling short-changed by a rounding rule they can't see.

### 6.3 The four split types

All four reduce to `distribute()` with different weights — one code path, four thin wrappers. That is why adding a fifth split type later is ~10 lines.

| Type | Client sends | Weights | Validation (before any write) |
|---|---|---|---|
| **equal** | participant ids only | all `1` | ≥ 1 participant |
| **exact** | `share` per participant (paise) | — used directly | `Σ share === totalAmount` → else `422 SPLIT_TOTAL_MISMATCH` |
| **percentage** | `value` = percent | `value` | `Σ value === 100` → else `422 PERCENTAGE_NOT_100` |
| **shares** | `value` = share count | `value` | every `value ≥ 1`, integer; `Σ value > 0` |

```js
// splitService.calculateSplits({ totalAmount, splitType, participants, paidBy })
switch (splitType) {
  case 'equal':      return distribute(total, participants.map(() => 1), paidBy);
  case 'shares':     return distribute(total, participants.map(p => p.value), paidBy);
  case 'percentage': return distribute(total, participants.map(p => p.value), paidBy);
  case 'exact':      return participants.map(p => ({ memberId: p.memberId, share: p.value }));
}
// then, unconditionally, for every type:
assertSum(result, totalAmount);   // I1 — the last line of defence
```

Note `percentage` routes through `distribute` with the percentages as weights rather than computing `total × pct / 100` per person and rounding each independently. Independent rounding is exactly how you get ₹7,999.98 from a valid 100% split; weighted distribution cannot.

**Universal validation, applied before any of the above** (covers the §29 checklist):

1. `totalAmount` is an integer ≥ 1 → `INVALID_AMOUNT`
2. `participants` is non-empty, memberIds unique → `INVALID_PARTICIPANTS`
3. every `memberId` is in `group.members` → `INVALID_PARTICIPANTS`
4. `paidBy` is in `group.members` → `PAYER_NOT_MEMBER`
5. no `share` or `value` is negative → `INVALID_AMOUNT`

**Both sides validate** (§32.16). The client mirrors this in `utils/splitCalculator.js` so the Save button disables and `SplitSummary` shows "₹500 remaining" live — a UX affordance. The server revalidates identically because the client is not a trust boundary. `POST /expenses/preview` (§3.6) lets the form show server-computed amounts, so the two can never visibly disagree.

### 6.4 Who owes whom — balance computation

```
computeBalances(group, expenses, settlements) →
  1. paid  = {}   // memberId → total paise this member laid out
     owed  = {}   // memberId → total paise this member's shares came to
  2. for each expense:
        paid[expense.paidBy] += expense.totalAmount
        for each p in expense.participants:  owed[p.memberId] += p.share
  3. for each settlement WHERE status === 'confirmed':
        paid[settlement.fromMember] += settlement.amount   // paying reduces debt
        paid[settlement.toMember]   −= settlement.amount   // receiving reduces credit
  4. net[m] = paid[m] − owed[m]
        net > 0  → the group owes them        (creditor)
        net < 0  → they owe the group         (debtor)
        net = 0  → settled
  5. assert Σ net === 0                                    // I2
```

A confirmed settlement is treated as the payer having "paid in" that amount — one uniform mechanism, no special-casing, and it composes correctly with any number of settlements.

**Pairwise balances** (the raw truth shown by default) are accumulated in the same pass: for each expense, every non-payer participant owes the payer their share; those pair debts are netted per unordered pair so `A owes B ₹600` and `B owes A ₹200` collapse to `A owes B ₹400`. Confirmed settlements subtract from the relevant pair.

Complexity: `O(E × P + S)` — a single linear pass. This is why D4 (compute, never store) costs nothing at realistic scale.

### 6.5 Debt simplification (§15)

**The problem.** After a real trip, everyone owes everyone a little. The Goa Trip below needs **6 separate payments** to settle, and nobody wants to make six UPI transfers.

**The algorithm — greedy creditor/debtor matching:**

```
simplify(netBalances) → transactions[]
  1. debtors   = members with net < 0, as (id, |net|), sorted DESC
     creditors = members with net > 0, as (id,  net),  sorted DESC
  2. while both lists are non-empty:
        d = largest debtor
        c = largest creditor
        amount = min(d.owes, c.isOwed)
        emit { from: d.id, to: c.id, amount }
        d.owes   −= amount
        c.isOwed −= amount
        drop whichever hit zero (at least one always does)
  3. return transactions
```

Each iteration zeroes out at least one member, so with `n` members the loop runs at most `n − 1` times: **the result is never more than n − 1 transactions**, regardless of how tangled the original debts were. Sorting dominates: `O(n log n)`.

**Worked example — Goa Trip 2026, 4 members, 4 expenses:**

| Expense | Amount | Paid by | Split |
|---|---|---|---|
| Hotel | ₹8,000 | Prity | equal ×4 → ₹2,000 each |
| Dinner | ₹2,400 | Rahul | equal ×4 → ₹600 each |
| Cab | ₹1,200 | Priya | equal ×4 → ₹300 each |
| Drinks | ₹800 | Aman | equal ×4 → ₹200 each |

| Member | Paid | Owed (share) | **Net** |
|---|---:|---:|---:|
| Prity | ₹8,000 | ₹3,100 | **+₹4,900** |
| Rahul | ₹2,400 | ₹3,100 | **−₹700** |
| Priya | ₹1,200 | ₹3,100 | **−₹1,900** |
| Aman | ₹800 | ₹3,100 | **−₹2,300** |
| | ₹12,400 | ₹12,400 | **₹0** ✓ (I2) |

*Pairwise view — 6 payments:*
```
Rahul → Prity ₹1,400     Priya → Rahul ₹300
Priya → Prity ₹1,700     Aman  → Rahul ₹400
Aman  → Prity ₹1,800     Aman  → Priya ₹100
```

*Simplified view — 3 payments:*
```
debtors [Aman 2300, Priya 1900, Rahul 700] · creditors [Prity 4900]
  Aman  ↔ Prity → min(2300, 4900) = ₹2,300   Prity now owed 2600
  Priya ↔ Prity → min(1900, 2600) = ₹1,900   Prity now owed  700
  Rahul ↔ Prity → min( 700,  700) = ₹  700   both zero → done

  Aman → Prity ₹2,300 · Priya → Prity ₹1,900 · Rahul → Prity ₹700
```

**6 payments → 3.** Every member's net position is identical in both views; only the routing changed. And the `IDEA.md` §15 case falls out of the same code: Rahul −500, Priya 0, Me +500 → a single `Rahul → Me ₹500`.

**Two honest caveats, worth knowing before you build it:**

1. **Greedy is not provably minimal.** Finding the true minimum number of settling transactions is NP-hard (it reduces from subset-sum: any subset of members whose balances cancel exactly could settle among themselves and save a transaction, and finding such subsets is the hard part). Greedy guarantees `≤ n − 1`, which is optimal in the common case and near-optimal otherwise. Chasing exact minimality would mean exponential search for a saving of typically one transaction. **Use greedy.** §32.20 asks for the simplest production-appropriate solution — this is it.

2. **Simplification can create a debt between two people who never shared an expense.** Above, Aman pays Prity ₹2,300 — but Aman only ever owed Prity ₹1,800 directly; the rest is routed through Rahul and Priya. This is mathematically correct and is what Splitwise does, but it surprises users. Hence D6: **pairwise is the default view, simplification is an explicit toggle**, and the UI labels it *"Simplified — fewest payments"* with the raw view one tap away.

### 6.6 Settlement lifecycle (§14)

```
   Balance shows "Rahul owes you ₹2,000"
        │
        ├─► [Remind]  → POST /reminders/generate → copy text (§6.7)
        │
        └─► [Settle Up] → SettleUpModal (amount prefilled, editable for partial)
                 │
                 ▼
        POST /settlements { groupId, fromMember, toMember, amount, method }
                 │
                 │  validate: amount ≥ 1
                 │            amount ≤ what fromMember actually owes toMember (net)
                 │            → else 422 (over-settling would flip the balance)
                 ▼
           status: 'confirmed'   (recorded by the receiver, or by an admin)
              or   'pending'     (claimed by the payer, awaiting the other side)
                 │
                 ▼
        Next GET /balances recomputes from scratch — Rahul's net moves to ₹0.
        Nothing is cached, so nothing can go stale. (D4)
```

**Partial settlements work for free.** Rahul pays ₹1,200 of ₹2,000 → the settlement records ₹1,200, the recomputed net shows ₹800 still owed. No special "partial" state, no extra fields — a direct consequence of deriving balances from the settlement records rather than flipping a boolean on the debt.

`cancelled` settlements are excluded from step 3 of `computeBalances`, so cancelling one cleanly reverses its effect while preserving the audit trail.

### 6.7 Reminder generation (§16)

```js
// reminderService.generate({ toName, amount, context, fromName })
`Hey ${toName} 👋 Your share for ${context} was ${formatMoney(amount)}. ` +
`Please send it whenever you get a chance. Thanks!`
```

Templates live in one module keyed by tone (`friendly` | `neutral` | `firm`) so more can be added without touching the endpoint. MVP surfaces the text with a **Copy** button; §17's email/SMS/WhatsApp channels arrive later as adapters behind `services/notification/index.js` — `sendReminder(channel, payload)` — with the message logic, the API contract and the entire client unchanged. That seam is the whole reason generation is server-side today (§3.8).

---

## 7. Deliverable 7 — Confirmed MVP

Locked to `IDEA.md` §33. Everything here ships in Phases 1–8; nothing else does.

### 7.1 In scope

| # | Area | Feature | Phase |
|---|---|---|:--:|
| 1 | **Auth** | Register (name, email, password) | 2 |
| 2 | | Login / Logout | 2 |
| 3 | | Protected routes + ownership checks | 2 |
| 4 | | Session survives page refresh (silent refresh) | 2 |
| 5 | **Personal** | Add / edit / delete income | 3 |
| 6 | | Add / edit / delete expense | 3 |
| 7 | | 11 default categories, seeded at registration | 3 |
| 8 | | Custom categories | 3 |
| 9 | | Payment method on every transaction | 3 |
| 10 | | Transaction history: search, filter, sort, paginate | 3 |
| 11 | **Dashboard** | Total income · expenses · balance | 3 |
| 12 | | Others owe me · I owe others | 7 |
| 13 | | Recent transactions | 3 |
| 14 | | Category spending chart (one chart) | 3 |
| 15 | **Groups** | Create group | 5 |
| 16 | | Add members incl. ghost members (D3) | 5 |
| 17 | | Group details: expenses, members | 5 |
| 18 | | Add group expense | 5 |
| 19 | **Splitting** | Equal split | 6 |
| 20 | | Exact-amount split | 6 |
| 21 | | Percentage split | 6 |
| 22 | | Shares split | 6 |
| 23 | | Full split validation, both sides | 6 |
| 24 | **Settlements** | Who-owes-whom balances (pairwise) | 7 |
| 25 | | Debt simplification toggle | 7 |
| 26 | | Record settlement / mark as paid | 7 |
| 27 | | Partial settlements | 7 |
| 28 | **Reminders** | Generate reminder message | 8 |
| 29 | | Copy to clipboard | 8 |
| 30 | **Quality** | Loading / empty / error states everywhere | all |
| 31 | | Responsive: mobile, tablet, desktop | all |

`IDEA.md` §33 lists "custom splitting" as one item; it is expanded to rows 20–22 because exact, percentage and shares are three distinct validation paths (§6.3) — all three are named in §12, and all three fall out of the same `distribute()` primitive, so the marginal cost after the first is small.

Row 4 is not in §33 but is included: without it, every page refresh logs you out, and no reviewer would call that a working MVP.

Row 25 is in §33's "calculate who owes whom" and is included because §15 calls it out specifically and it is the strongest algorithmic talking point in the project (§35).

### 7.2 Explicitly deferred

| Feature | Source | Phase |
|---|---|:--:|
| Analytics page, monthly reports, trends | §19 | 4 |
| Money timeline view | §22 | 4 |
| Budgets + over-budget warnings | §20 | 9 |
| Multiple named accounts (HDFC, GPay…) | §7 | 9 |
| Receipt upload (Cloudinary) | §18 | 9 |
| OCR receipt → expense | §18 | 9 |
| Email / SMS / WhatsApp sending | §17 | 9 |
| Reminder history | §16 | 9 |
| AI insights | §21 | 9 |
| Profile edit, change/reset password | §4 | 9 |
| Deployment | §10 | 10 |

Every deferred item has a designed seam already in place — `Account` and `Budget` models sketched (§2.7), `receiptUrl` on `GroupExpense`, `services/notification/` stubbed, `phone` on members. None requires restructuring.

### 7.3 Definition of done for the MVP

- [ ] Register → add income → add expense → dashboard shows correct totals
- [ ] Create a group with 3 ghost members → add a ₹8,000 equal-split expense
- [ ] Balances show Rahul/Priya/Aman each owing ₹2,000, and **sum to zero**
- [ ] All four split types validate and resolve exactly (I1 holds)
- [ ] Simplify toggle reduces the 6-payment Goa case to 3
- [ ] Settle Rahul → his net becomes ₹0, others unchanged
- [ ] Partial settlement leaves the correct remainder
- [ ] Reminder text generates and copies
- [ ] Page refresh keeps you logged in; logout truly ends the session
- [ ] User A cannot read User B's transactions or groups (verified by hand)
- [ ] Whole flow usable one-handed on a 375px screen
- [ ] Every list has real loading, empty and error states
- [ ] No secrets in client code; `.env` gitignored

---

## Appendix — Technical challenges to expect (§36.13)

| # | Challenge | Where it bites | Mitigation |
|---|---|---|---|
| 1 | Float rounding in splits | everywhere money exists | D1 integer paise + largest remainder (§6.2); assert I1/I2 |
| 2 | Group members without accounts | blocks the headline use case | D3 ghost members; splits reference `member._id` |
| 3 | Double-counting group expenses in the dashboard | silently wrong totals | D5 — group expenses are never `Transaction`s |
| 4 | Concurrent 401s triggering parallel refreshes | random logouts under load | queue + single-flight refresh in `services/api.js` (§5.4) |
| 5 | Cross-origin cookies in production | works locally, breaks on deploy | `SameSite`/`Secure` driven by `NODE_ENV` from Phase 2 (§5.7) |
| 6 | Simplification inventing unfamiliar debts | user confusion / mistrust | D6 — pairwise default, simplify is an explicit labelled toggle |
| 7 | Editing an expense after partial settlement | balances shift under a paid debt | warn on edit; settlements are independent records, so nothing corrupts |
| 8 | Split form UX on a small screen | §27's stated priority | 4-step mobile stepper, live remainder banner (§4.2) |
| 9 | Timezone drift on `date` | expenses landing on the wrong day | store UTC, normalise to local midnight on input, format on display |
| 10 | Deleting categories / members with history | orphaned references | `409` when referenced; archive instead of delete |
| 11 | Daily averages in an in-progress month | dividing this month's spend by 30 on the 9th understates the rate 3× | `daysElapsedIn()` — divide by days elapsed for the current month, full length for past months |
| 12 | Percent change when the previous month is zero | `(x − 0) / 0` is Infinity; showing "100%" fabricates a statistic | `percentChange()` returns `null`; the UI says "no data to compare" |
| 13 | Charts drawn from sparse aggregation results | a month with no data is skipped, so the line implies steady spending across it | every series is padded with explicit zeros before it reaches a chart |
| 14 | Percentage totals compared as floats | `0.01 + 64.04 + 35.95 !== 100`, so a valid split is **rejected** | compare in integer basis points: `Σ round(pct × 100) === 10000` |
| 15 | Rounding each person's percentage share independently | ₹9.98 split 0.01/14.27/85.72% yields 997 paise — a paisa vanishes | percentages become weights for `distribute()`; leftover paise are assigned explicitly |
| 16 | Settling via the simplified route creates *reverse* pairwise debts | Aman pays Prity his full ₹2,300 net, but owed her only ₹1,800 directly — pairwise then shows Prity → Aman ₹500 | this is arithmetically correct (Prity is holding ₹500 belonging to Aman's other creditors) and resolves as those debts settle; the settlement cap accounts for it |

---

## Build notes — deviations found during implementation

Recorded as they are discovered, so the spec stays true to the code.

| # | Spec said | Reality | Reason |
|---|---|---|---|
| 1 | `utils/asyncHandler.js` wraps async controllers | **Removed** | Express 5 forwards rejected promises to the error handler automatically (`Layer.handleRequest` detects a returned promise and calls `next(error)`). The wrapper was an Express 4 requirement. Handlers now just `throw`. |
| 2 | `tailwind.config.js` + `postcss.config.js` | **Neither exists** | Tailwind v4 is a Vite plugin configured in CSS. Theme tokens live in `src/index.css` under `@theme`. |
| 3 | API on port 5000 | **Port 5001** | On macOS, AirPlay Receiver (ControlCenter) listens on 5000 with `SO_REUSEPORT`, so Node reports a successful bind but receives no requests — a silent failure. Documented in `server/.env.example`. |
| 4 | — | **No Vite dev proxy** | A `/api` proxy would make dev requests same-origin, leaving CORS and cookie config untested until deployment (the §5.7 trap). The client calls the API on its real origin so misconfiguration fails on day one. |
| 5 | `nodemon` for dev reload | **`node --watch`** | Built into Node 20+. One less dependency (§32.11). |
| 6 | Client imports the server's validator file | **`shared/` npm workspace** | §1.4 justified zod on the grounds that one schema validates both sides, but two sibling packages cannot import each other's files. `shared/` is now a real workspace package (`@spendwise/shared`) that both depend on, so the rule really is written once. Setup is now a single `npm install` at the repo root. |
| 7 | Refresh token payload `{ sub, tv }` | **`{ sub, jti }`** | A JWT's `iat` has one-second resolution, so two refresh tokens signed for the same user in the same second are byte-identical — which silently turns rotation into a no-op and leaves a one-second replay window for a stolen token. A random `jti` per token makes every rotation strict. Found by a rotation test that failed only when requests were fired back-to-back. |
| 8 | `utils/money.js` holds largest-remainder | **Paise helpers only so far** | `distribute()` arrives in Phase 6 with the split logic it belongs to. |
| 9 | — | **`useForm` gained a `transform`** | The amount input holds rupees but the shared schema validates paise. `transform` maps form values to the API payload *before* validation, so the shared schema checks what is actually sent rather than a display format. |
| 10 | — | **Chart is lazy-loaded** | recharts is ~317 KB (94 KB gzipped) and only the dashboard renders a chart. `React.lazy` keeps it out of the initial bundle. |
| 11 | — | **Explicit icon map, never `import * as`** | `import * as icons from 'lucide-react'` with a dynamic `icons[name]` lookup defeats tree-shaking and pulled all ~1,500 icons in, tripling the bundle. An explicit map cut the initial bundle from 314 KB to 130 KB gzipped. |
| 12 | `/api/dashboard/analytics` + `/api/dashboard/timeline` | **`/api/analytics/*`** | The dashboard namespace was heading for seven endpoints covering two distinct pages. Analytics has its own page, its own service and its own query shape, so it gets its own namespace: `/trends`, `/daily`, `/report`. |
| 13 | §22 money timeline as its own page | **Daily in/out/net inside Analytics** | The chronological list form of §22 is already what the Transactions page renders (`groupByDate` + relative day headers); a second page would have duplicated it. What was genuinely missing is the *net* per day — whether a day left you up or down — so that is what was built. |
| 14 | `AddGroupExpense` is a 4-step mobile stepper (§4.2) | **Single-page mobile-first form, for now** | With only an equal split there are five fields; a four-step wizard around five fields is friction rather than guidance. Revisit in Phase 6, where exact/percentage/shares add genuine per-person input and the stepper earns its place. |
| 15 | — | **`distribute()` built in Phase 5, not 6** | Equal split needs the largest-remainder primitive, so it lands here. Phase 6 adds three thin wrappers over the same function, which is how the code actually factors. |
| 16 | — | **Split preview is server-side** | `POST /groups/:id/expenses/preview` resolves a split without saving. Recomputing on the client would mean two implementations of the rounding rule that can disagree, so the preview would show amounts differing from what is stored. |
| 17 | §3.6 sends `share` for exact, `value` for percentage | **Always `value`** | Two field names for the same slot complicates the schema and the form for no gain. `splitType` already says how to read it: paise for exact, percent for percentage, a count for shares. |
| 18 | Percentages validated as `Σ === 100` | **Integer basis points** | `0.01 + 64.04 + 35.95 === 100.00000000000001` in float, so a direct comparison *rejects a valid split*. Even converting is unsafe (`33.33 * 100 = 3332.9999999999995`). Summing `Math.round(pct * 100)` and comparing to 10000 is exact. |
| 19 | `SplitExact` / `SplitPercentage` / `SplitShares` as three components | **One `SplitValueInputs`** | They differ only in unit, step and control shape. Three files would be the same list copied three times and would drift; one component keeps layout, keyboard behaviour and accessibility identical. |
| 20 | Revisit the 4-step wizard in Phase 6 (deviation 14) | **Still a single page** | Re-evaluated as promised. The per-person inputs appear only when a non-equal type is chosen, so the common case stays short and the form expands only when it must. A wizard would add four navigation steps while making the running allocation total — the thing users actually need to watch — harder to keep in view. |
| 21 | §6.6 caps a settlement at the net amount owed | **`max(net, pairwise)`** | The two views legitimately disagree for the same pair: Rahul owes Prity ₹1,400 pairwise while his net is only −₹700, and simplification asks Aman for ₹2,300 where pairwise says ₹1,800. Capping at either alone would reject a settlement the user was just shown by the other view. The guard exists to catch typos, not to enforce a routing. |
| 22 | — | **`checksum` returned with every balance response** | I2 (`Σ net === 0`) is surfaced to the client, which refuses to render figures that do not balance. Silently displaying wrong money is worse than admitting the problem. |
| 23 | Reminder history deferred to Phase 9 (§7.2) | **Built in Phase 8** | §31 lists it under Phase 8, it is one model and two endpoints, and "have I already asked?" is genuinely the question that stops you nudging someone twice. It is also the row that §17's channels write their `sent`/`failed` status into. |
| 24 | — | **Reminder context derived from the ledger** | §16's example says "your share for dinner", but a balance aggregates several expenses. The context names the shared expense when there is one and summarises when there are several ("Hotel and 2 other expenses"), because a message that says what it is about gets paid. |
| 25 | — | **Reminder tones: friendly / neutral / firm** | One template table, so new wording is a data change. The same debt reads very differently to a flatmate and to someone three weeks late. |
| 26 | §21 "AI-powered insights" | **Deterministic rules engine** | All four of §21's own examples are arithmetic over the user's transactions — a percentage change, a ranked category, a daily average, a saving estimate. A rules engine gets them always right, costs nothing, works offline, and cannot hallucinate a figure about someone's money. §21 also forbids unrealistic claims and posing as an adviser, which this satisfies by construction. An LLM could rephrase the output later, but the numbers must keep coming from here. |
| 27 | §2.7 sketched `Budget` with a stored `balance`-style progress | **Progress is derived** | Same reasoning as D4: a stored "spent so far" is a cache needing correct invalidation on every transaction create, edit, delete and category change, and a stale budget saying you have room when you don't is worse than no budget. |
| 28 | §2.7 sketched `Account` with a stored `balance` | **Not built; would be derived** | Deferred with the other credential-blocked work. When built, the balance must be derived from transactions for the same reason as above. |
| 29 | — | **Budgets warn on *pace*, not just totals** | 60% spent is fine on the 25th and alarming on the 3rd. `ahead_of_pace` compares spend against how much of the month has actually elapsed. |

---

## MVP status — complete

All 31 rows of §7.1 are built and verified. The remaining phases are the
explicitly deferred work in §7.2:

| Phase | Scope | Status |
|---|---|---|
| 9 | Budgets (§20), insights (§21), profile + password (§4) | ✅ Complete |
| 9 | Receipts + OCR, email/SMS/WhatsApp, named accounts | ⛔ Blocked — see below |
| 10 | Deployment — Atlas, production env, hosting | Not started |

### Blocked on credentials

These cannot be built as working features without accounts and keys that must
be provided. Writing them anyway would mean shipping code that cannot run —
the "fake code that makes the application appear complete" IDEA.md §32.7
forbids. Each one already has its seam in place.

| Feature | Needs | Seam already built |
|---|---|---|
| Receipt upload (§18) | Cloudinary cloud name, API key, API secret | `GroupExpense.receiptUrl` field |
| Receipt OCR (§18) | An OCR service, or a decision to run Tesseract locally | — |
| Email (§17) | SMTP host, user, password (or a provider key) | `services/notification/` adapter table |
| SMS (§17) | Twilio account SID, auth token, sending number | same |
| WhatsApp (§17) | WhatsApp Business API access + business verification | same |
| Named accounts (§7) | Nothing — deferred for scope, not blocked | `Transaction.accountId` field |

Password reset by email (§4) is part of the email item: the change-password
flow is built and tested, but "forgot password" needs somewhere to send a link.

*Phases 1–9 complete except the credential-blocked items. Awaiting "Start Phase 10".*
