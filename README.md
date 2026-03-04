# FaultTrack — Engineering Fault Management System

A full-stack web application built with Plain HTML/CSS/JS + Node.js + Express + SQLite.

---

## 📁 Project Structure

```
faulttrack/
├── server/
│   ├── index.js        ← Express server & all API routes
│   ├── db.js           ← SQLite database setup & seeding
│   └── package.json    ← Node.js dependencies
└── public/
    ├── index.html      ← Login page
    ├── css/
    │   └── style.css   ← All styles for the entire app
    ├── js/
    │   └── app.js      ← Shared utilities (API calls, auth, navigation)
    └── pages/
        ├── dashboard.html
        ├── faults.html
        ├── solutions.html
        ├── helpdesk.html
        ├── accounts.html
        └── security.html
```

---

## 🚀 How to Run

### Step 1 — Install Node.js
Download from https://nodejs.org (LTS version)

### Step 2 — Install dependencies
Open a terminal in VS Code and run:
```bash
cd server
npm install
```

### Step 3 — Start the server
```bash
node index.js
```

### Step 4 — Open the app
Go to http://localhost:3000 in your browser.

---

## 🔑 Demo Login Accounts

| Username     | Password   | Role        |
|-------------|------------|-------------|
| engineer1   | password   | Engineer    |
| headoffice1 | password   | Head Office |
| admin1      | password   | Admin       |

---

## 🛠️ Tech Stack

- **Frontend**: Plain HTML, CSS, JavaScript (no frameworks)
- **Backend**: Node.js + Express
- **Database**: SQLite (via better-sqlite3)
- **Auth**: JWT tokens + bcrypt password hashing

---

## 📋 Features by Role

| Feature              | Engineer | Head Office | Admin |
|----------------------|----------|-------------|-------|
| View Dashboard       | ✅       | ✅          | ✅    |
| View Fault Logs      | ✅       | ✅          | ✅    |
| Log New Fault        | ✅       | —           | ✅    |
| Update Fault Status  | ✅       | ✅          | ✅    |
| Search Solutions     | ✅       | ✅          | ✅    |
| Add Solutions        | —        | ✅          | ✅    |
| Help Desk Chat       | ✅       | ✅          | ✅    |
| Manage Accounts      | —        | ✅          | ✅    |
| Security Settings    | —        | —           | ✅    |
