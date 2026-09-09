I want to build a full-stack personal finance and expense-splitting application called **SpendWise**.

I want you to act as a **senior full-stack developer, software architect, UI/UX designer, database designer, and product engineer** while helping me build this application.

Do not treat this as a simple CRUD expense tracker. I want to build a polished, real-world, portfolio-level application that solves an actual problem.

---

# 1. PRODUCT IDEA

The main problem I want to solve is:

I personally have difficulty tracking where my money comes from, where I spend it, how much I have left, and money that I have paid on behalf of friends or groups.

For example:

* I receive salary or other income.
* I spend money on food, shopping, transportation, bills, subscriptions, etc.
* Sometimes I pay the complete bill for a group.
* I then need to remember how much each person owes me.
* Sometimes I owe money to other people.
* I forget who has paid and who hasn't.
* I want the application to automatically calculate everyone's share.
* I want the application to generate payment reminder messages.
* Eventually I want to integrate WhatsApp/SMS/email notifications.

Therefore, SpendWise should combine:

**Personal Finance Tracking + Expense Management + Group Expense Splitting + Debt/Settlement Tracking + Payment Reminders + Analytics**

The core philosophy is:

**Track → Analyze → Split → Settle → Remind**

---

# 2. TARGET USERS

The application should be useful for:

* College students
* Working professionals
* Friends
* Roommates
* Couples
* Travel groups
* People managing monthly budgets
* Anyone who wants to understand their spending

---

# 3. TECH STACK

I want to use the MERN stack because I am learning and working with it.

## Frontend

* React.js
* React Router
* Tailwind CSS
* Axios
* Recharts or another suitable chart library

## Backend

* Node.js
* Express.js
* JWT authentication
* bcrypt/bcryptjs
* REST APIs

## Database

* MongoDB
* Mongoose

## Future integrations

* Nodemailer for email
* Twilio for SMS if appropriate
* WhatsApp Business API for WhatsApp messaging
* Cloudinary for receipt images
* OCR for receipt scanning
* AI API for smart financial insights

Do not introduce unnecessary technologies unless there is a strong reason.

---

# 4. AUTHENTICATION

Users should be able to:

* Register
* Login
* Logout
* View profile
* Update profile
* Change password
* Reset password

Use secure authentication.

Passwords must never be stored as plain text.

Use:

* bcrypt/bcryptjs for password hashing
* JWT for authentication
* Protected API routes
* Authorization checks
* Input validation
* Environment variables for secrets

---

# 5. PERSONAL FINANCE MANAGEMENT

The application must allow users to track both:

## Income

Users can add:

* Salary
* Freelancing
* Family
* Refund
* Gift
* Other income

Income fields:

* Amount
* Source
* Date
* Description
* Account/payment method
* Notes

Example:

Salary → ₹40,000
Freelancing → ₹5,000
Family → ₹3,000

---

# 6. EXPENSE MANAGEMENT

Users can add expenses.

Expense fields:

* Amount
* Category
* Description
* Date
* Payment method
* Account
* Notes

Default categories should include:

* Food
* Transport
* Shopping
* Rent
* Bills
* Education
* Entertainment
* Health
* Travel
* Subscriptions
* Other

Users should also be able to create custom categories.

---

# 7. PAYMENT METHODS / ACCOUNTS

The user should be able to track how they paid.

Examples:

* UPI
* Cash
* Credit Card
* Debit Card
* Bank Transfer
* Wallet
* Other

Eventually, users can create multiple accounts such as:

* HDFC Bank
* SBI
* Cash
* Google Pay
* PhonePe
* Paytm
* Credit Card

Important:

The application should NOT store banking passwords, UPI PINs, card CVVs, or other sensitive banking credentials.

This application tracks financial records; it does not directly control bank accounts.

---

# 8. DASHBOARD

The dashboard should be the main screen.

It should show:

### Financial Summary

* Total income
* Total expenses
* Current balance
* Amount others owe me
* Amount I owe others

Example:

Income: ₹50,000
Expenses: ₹14,500
Balance: ₹35,500
Others owe me: ₹2,500
I owe others: ₹1,000

### Spending Overview

Show category-wise spending.

Example:

Food → ₹4,500
Shopping → ₹3,000
Bills → ₹2,500
Transport → ₹2,000

### Charts

Include:

* Income vs expenses
* Category-wise expenses
* Monthly spending trend
* Daily spending
* Savings trend

The dashboard should be clean and modern, not overcrowded.

---

# 9. TRANSACTION HISTORY

Create a dedicated transaction page.

Display:

* Income
* Expenses
* Group expenses
* Settlements

Each transaction should show:

* Description
* Amount
* Category
* Date
* Payment method
* Type

Example:

September 8:

* ₹40,000 Salary

- ₹450 Dinner
- ₹220 Uber
- ₹1,500 Shopping

* ₹500 Rahul paid

Users should be able to:

* Search
* Filter by date
* Filter by category
* Filter by income/expense
* Filter by payment method
* Sort transactions

---

# 10. GROUP EXPENSES

This is one of the most important features.

Users can create groups.

Example:

**Goa Trip 2026**

Members:

* Me
* Rahul
* Priya
* Aman

Each group should have:

* Group name
* Group creator
* Members
* Group expenses
* Balances
* Settlements

---

# 11. ADD GROUP EXPENSE

When adding a group expense:

Example:

Hotel = ₹8,000

Fields:

* Description
* Total amount
* Date
* Paid by
* Split type
* Participants

Example:

Paid by:

Me

Participants:

✓ Me
✓ Rahul
✓ Priya
✓ Aman

---

# 12. SPLIT TYPES

Support multiple splitting methods.

## Equal Split

₹8,000 / 4 people

Each person = ₹2,000

## Exact Amount Split

Example:

Me → ₹2,000
Rahul → ₹1,500
Priya → ₹2,500
Aman → ₹2,000

Total must equal ₹8,000.

## Percentage Split

Example:

Me → 40%
Rahul → 20%
Priya → 20%
Aman → 20%

The application should validate that the total percentage equals 100%.

## Shares

Example:

Me → 2 shares
Rahul → 1 share
Priya → 1 share
Aman → 1 share

The application calculates the amount automatically.

---

# 13. WHO OWES WHOM

The application must automatically calculate balances.

Example:

I paid ₹8,000 for four people.

Each person's share = ₹2,000.

Therefore:

Rahul owes me ₹2,000
Priya owes me ₹2,000
Aman owes me ₹2,000

Total owed to me = ₹6,000.

Create a clear settlement/balance screen.

---

# 14. SETTLEMENT SYSTEM

Users should be able to mark debts as paid.

Example:

Rahul owes me ₹2,000.

Actions:

* Remind
* Mark as paid
* View expense

When Rahul pays:

Status changes:

**Pending → Settled**

Store:

* Who paid
* Who received
* Amount
* Date
* Status

---

# 15. SETTLEMENT OPTIMIZATION

I want the application to intelligently reduce unnecessary transactions.

Example:

Rahul owes Priya ₹500.

Priya owes me ₹500.

Instead of:

Rahul → Priya → Me

The application should be able to simplify the debt relationship to:

Rahul → Me = ₹500

Implement a suitable debt simplification algorithm.

Explain the algorithm clearly and keep the implementation maintainable.

---

# 16. PAYMENT REMINDERS

If someone owes money, the user should be able to generate a reminder.

Example:

Rahul owes me ₹500.

Generate:

"Hey Rahul 👋 Your share for dinner was ₹500. Please send it whenever you get a chance. Thanks!"

Actions:

* Copy message
* Send reminder
* Mark as paid

For the MVP, I only need message generation/copying.

Do NOT make WhatsApp integration a requirement for the first version.

---

# 17. FUTURE MESSAGING INTEGRATION

Later I want to support:

* WhatsApp
* SMS
* Email
* Telegram

Potential integrations:

Nodemailer → Email
Twilio → SMS
WhatsApp Business API → WhatsApp

Design the architecture so this can be added later without rewriting the entire application.

---

# 18. RECEIPT MANAGEMENT

Eventually users should be able to upload receipts.

Example:

Restaurant Bill

₹1,850

September 8, 2026

Later, OCR should be able to extract:

* Restaurant name
* Total amount
* Date
* Items if possible

Then the application can automatically create an expense from the receipt.

This should be a future feature, not necessarily part of the first MVP.

---

# 19. MONTHLY FINANCIAL REPORTS

Create a monthly analytics/report page.

Example:

September 2026

Total Income: ₹50,000
Total Expenses: ₹14,500
Savings: ₹35,500

Highest spending category:

Food → ₹4,500

Average daily spending:

₹483

Comparison with previous month:

Expenses ↓ 12%
Savings ↑ 8%

---

# 20. BUDGETS

Eventually allow users to create budgets.

Example:

Food budget:

₹5,000/month

Current spending:

₹4,500

Progress:

90%

If the user crosses the budget:

Show a warning such as:

"⚠️ You have exceeded your Food budget."

---

# 21. SMART FINANCIAL INSIGHTS

Eventually I want an AI-powered insights feature.

Examples:

"You spent 32% more on food this month than last month."

"Shopping is currently your highest discretionary expense."

"Your average daily spending increased compared with last month."

"You may save approximately ₹2,000 by reducing entertainment expenses."

The AI should work from the user's financial data and provide useful summaries.

Do not make unrealistic financial claims or present the AI as a professional financial advisor.

---

# 22. MONEY TIMELINE

I want a visual timeline showing exactly where money came from and where it went.

Example:

September 8

* ₹40,000 — Salary

- ₹350 — Lunch
- ₹120 — Uber
- ₹800 — Shopping

* ₹500 — Rahul paid

- ₹1,200 — Dinner

This should make the user's financial activity easy to understand.

---

# 23. DATABASE DESIGN

Design a proper MongoDB schema.

At minimum, I expect something similar to:

### User

* _id
* name
* email
* password
* profileImage
* createdAt
* updatedAt

### Transaction

* _id
* userId
* type
* amount
* category
* description
* paymentMethod
* account
* date
* notes
* createdAt

### Group

* _id
* name
* createdBy
* members
* createdAt

### GroupExpense

* _id
* groupId
* description
* totalAmount
* paidBy
* splitType
* participants
* date
* createdAt

### Settlement

* _id
* groupId
* from
* to
* amount
* status
* settledAt
* createdAt

You can modify the schema if you believe a better architecture exists.

Explain your reasoning before making major architectural decisions.

---

# 24. API DESIGN

Create clean REST APIs.

For example:

Authentication:

POST /api/auth/register
POST /api/auth/login
GET /api/auth/me

Transactions:

POST /api/transactions
GET /api/transactions
GET /api/transactions/:id
PUT /api/transactions/:id
DELETE /api/transactions/:id

Groups:

POST /api/groups
GET /api/groups
GET /api/groups/:id
PUT /api/groups/:id
DELETE /api/groups/:id

Group expenses:

POST /api/groups/:groupId/expenses
GET /api/groups/:groupId/expenses
GET /api/groups/:groupId/balances

Settlements:

POST /api/settlements
GET /api/settlements
PUT /api/settlements/:id

Dashboard:

GET /api/dashboard/summary
GET /api/dashboard/analytics

You can improve the API structure if necessary.

---

# 25. FRONTEND PAGES

I want the application to have these main pages:

1. Landing Page
2. Register
3. Login
4. Dashboard
5. Transactions
6. Add Income
7. Add Expense
8. Analytics
9. Groups
10. Group Details
11. Add Group Expense
12. Settlements
13. Budgets
14. Reports
15. Profile
16. Settings

The navigation should be simple and intuitive.

---

# 26. UI/UX DESIGN

I want a modern fintech-style interface.

It should feel like a real SaaS product.

Design principles:

* Clean
* Minimal
* Professional
* Responsive
* Mobile-friendly
* Easy to understand
* Good spacing
* Strong visual hierarchy
* Accessible forms
* Useful empty states
* Loading states
* Error states
* Success messages

Do not make every section a giant card.

Use cards only where they improve hierarchy.

The dashboard should prioritize:

1. Balance
2. Income/expense summary
3. Spending
4. Outstanding debts
5. Recent transactions

---

# 27. RESPONSIVE DESIGN

The application must work properly on:

* Desktop
* Tablet
* Mobile

Do not design only for desktop.

The group expense splitting flow should be especially easy to use on mobile.

---

# 28. SECURITY

Implement:

* Password hashing
* JWT authentication
* Protected routes
* Authorization
* Input validation
* Proper error handling
* Secure environment variables
* CORS configuration
* Rate limiting where appropriate

Users must only be able to access their own private financial data and groups they are authorized to access.

---

# 29. ERROR HANDLING

The application should properly handle:

* Invalid login
* Duplicate email
* Invalid amount
* Negative expense
* Missing fields
* Invalid group
* Unauthorized access
* Invalid split
* Percentage not equal to 100%
* Split amount not equal to total
* Non-existing transaction
* Non-existing user

Return useful API error responses.

The frontend should display friendly messages.

---

# 30. PROJECT STRUCTURE

I want a professional project structure.

For example:

frontend:

src/
components/
pages/
layouts/
hooks/
services/
context/
utils/
charts/
assets/

backend:

src/
controllers/
models/
routes/
middleware/
services/
utils/
config/

You can modify this structure if you have a better approach.

---

# 31. DEVELOPMENT STRATEGY

Do NOT try to build the entire application in one response.

I want to build it incrementally.

Use this order:

## Phase 1 — Foundation

* Project setup
* React frontend
* Express backend
* MongoDB connection
* Environment configuration
* Basic folder structure

## Phase 2 — Authentication

* Register
* Login
* JWT
* Protected routes
* User profile

## Phase 3 — Personal Finance

* Income
* Expenses
* Categories
* Transactions
* Dashboard

## Phase 4 — Analytics

* Charts
* Monthly reports
* Spending analysis
* Income vs expenses

## Phase 5 — Groups

* Create group
* Add members
* Group details
* Group expenses

## Phase 6 — Expense Splitting

* Equal split
* Exact amount split
* Percentage split
* Shares
* Validation

## Phase 7 — Settlements

* Calculate balances
* Who owes whom
* Settlement tracking
* Debt simplification algorithm

## Phase 8 — Reminders

* Generate reminder messages
* Copy message
* Reminder history

## Phase 9 — Advanced Features

* Budgets
* Receipt upload
* OCR
* Email/SMS/WhatsApp
* AI insights

## Phase 10 — Deployment

* Frontend deployment
* Backend deployment
* MongoDB Atlas
* Environment variables
* Production configuration

---

# 32. IMPORTANT DEVELOPMENT RULES

When helping me code this:

1. Do not dump the entire application at once.

2. Build one feature at a time.

3. Before implementing a major feature, explain:

   * What we are building
   * Why we need it
   * How it works
   * Which files will change

4. Give me complete working code for the current step.

5. Tell me exactly where every file should be created.

6. If modifying an existing file, provide the complete updated file when practical.

7. Do not use fake code or placeholder functions that make the application appear complete when they are not.

8. Keep the code beginner-friendly because I am learning full-stack development.

9. At the same time, follow professional development practices.

10. Explain important code sections so I can understand what I am building.

11. Don't introduce unnecessary libraries.

12. Keep frontend and backend clearly separated.

13. Use reusable components.

14. Use proper API service functions instead of scattering Axios calls everywhere.

15. Handle loading, error, and empty states.

16. Validate data on both frontend and backend.

17. Never expose secrets in frontend code.

18. Never store passwords as plain text.

19. Never assume that a user is authorized to access another user's financial data.

20. When there are multiple possible approaches, recommend the simplest production-appropriate solution and explain the tradeoff briefly.

---

# 33. MVP DEFINITION

The first working version should contain ONLY:

### Authentication

* Register
* Login
* Logout
* Protected routes

### Personal Finance

* Add income
* Add expense
* Categories
* Payment methods
* Transaction history

### Dashboard

* Total income
* Total expenses
* Balance
* Recent transactions
* Basic spending chart

### Groups

* Create group
* Add members
* Add group expense
* Equal splitting
* Custom splitting

### Settlements

* Calculate who owes whom
* Mark payment as settled

### Reminder

* Generate payment reminder
* Copy reminder message

Everything else can come later.

---

# 34. FUTURE VISION

Eventually I want SpendWise to become a complete personal finance platform.

The long-term flow should be:

User records income and expenses

↓

SpendWise understands financial activity

↓

Dashboard shows current financial health

↓

User creates groups

↓

Group expenses are automatically split

↓

Balances are calculated

↓

Debts are simplified

↓

Users receive payment reminders

↓

Monthly reports explain spending

↓

AI provides useful spending insights

↓

Receipt OCR reduces manual data entry

↓

Messaging integrations make settlements easier

---

# 35. PROJECT POSITIONING

When describing this project on my resume or portfolio, I want it to sound like a serious full-stack product.

A possible description is:

"Developed SpendWise, a full-stack personal finance and expense management platform that enables users to track income and expenses, analyze spending patterns, split group expenses using multiple algorithms, manage settlements, and generate payment reminders."

The project should demonstrate:

* React
* Node.js
* Express
* MongoDB
* REST APIs
* Authentication
* JWT
* Database design
* CRUD
* Data visualization
* Algorithms
* Financial calculations
* Responsive UI
* Real-world product development

---

# 36. YOUR FIRST TASK

Do NOT start writing the entire application immediately.

First, analyze this product idea and give me:

1. Final recommended architecture
2. Complete feature roadmap
3. Recommended MongoDB schema
4. API architecture
5. Frontend page structure
6. Component structure
7. Folder structure
8. Authentication flow
9. Group expense splitting logic
10. Settlement/debt simplification logic
11. Development phases
12. MVP vs future features
13. Potential technical challenges
14. Recommended UI/UX structure