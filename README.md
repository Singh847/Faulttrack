# FaultTrack
### Engineering Fault Management System

A full-stack web application for logging, tracking, and managing engineering faults. Built with plain HTML, CSS, and JavaScript on the frontend, and Node.js, Express, and SQLite on the backend.

---

## What It Does

FaultTrack lets engineers and office staff manage faults in one place. Different users see different features depending on their role:

- **Engineers** can log faults, update their status, search for solutions, and chat with head office
- **Head Office Staff** can view and update faults, add solutions to the library, and manage engineer accounts
- **Administrators** have full access including security settings

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Backend | Node.js, Express |
| Database | SQLite (via better-sqlite3) |
| Auth | JWT tokens + bcrypt |

---

## Project Structure

```
faulttrack/
├── server/
│   ├── index.js          ← Express server and all API routes
│   ├── db.js             ← Database setup and default users
│   └── package.json      ← Node.js dependencies
└── public/
    ├── index.html        ← Login page
    ├── css/
    │   └── style.css     ← All styles for the entire app
    ├── js/
    │   └── app.js        ← Shared helpers (API calls, auth, navigation)
    └── pages/
        ├── dashboard.html
        ├── faults.html
        ├── solutions.html
        ├── helpdesk.html
        ├── accounts.html
        └── security.html
```

---

## Getting Started

### Step 1 — Install Node.js

Download and install the **LTS version** from https://nodejs.org

Check it installed correctly by opening a terminal and running:
```bash
node --version
npm --version
```
Both should print a version number.

---

### Step 2 — Open the Project in VS Code

1. Unzip the downloaded file
2. Open VS Code
3. Go to **File → Open Folder** and select the `faulttrack` folder

---

### Step 3 — Install Dependencies

Open the terminal in VS Code (`Ctrl + ` on Windows, `Cmd + ` on Mac) and run:

```bash
cd server
npm install
```

This downloads all the packages the server needs. You only need to do this once.

---

### Step 4 — Start the Server

```bash
node index.js
```

You should see:
```
✅ Default users created
✅ FaultTrack running at http://localhost:3000
```

---

### Step 5 — Open the App

Open your browser and go to:

```
http://localhost:3000
```

---

## Demo Accounts

Use these to log in and test different roles:

| Username | Password | Role |
|----------|----------|------|
| `engineer1` | `password` | Engineer |
| `headoffice1` | `password` | Head Office |
| `admin1` | `password` | Admin |

---

## Features

### All Users
- Secure login and logout
- Role-based dashboard with live fault statistics
- View all fault logs with search and filter
- Search the solutions library
- Help desk chat (refreshes every 5 seconds)

### Engineers + Admins
- Log new faults with description, priority, job type, and location
- Update fault status (Open → In Progress → Resolved)

### Head Office + Admins
- Add new solutions to the knowledge base
- Create and manage engineer accounts
- Activate or deactivate engineer accounts

### Admins Only
- View and configure security settings
- View role permission matrix

---

## How the Code Works

### Login Flow
1. User enters username and password
2. Server checks the password using **bcrypt** (passwords are never stored in plain text)
3. If correct, server returns a **JWT token** — a small encrypted string that proves who you are
4. Token is saved in the browser's `localStorage`
5. Every API request automatically sends the token — the server reads it to know who you are

### API Routes

| Method | URL | Description | Who Can Use |
|--------|-----|-------------|-------------|
| POST | `/api/login` | Log in and get a token | Everyone |
| GET | `/api/faults` | Get all faults | All logged-in users |
| POST | `/api/faults` | Log a new fault | Engineer, Admin |
| PUT | `/api/faults/:id` | Update a fault | All logged-in users |
| GET | `/api/solutions` | Get all solutions | All logged-in users |
| POST | `/api/solutions` | Add a solution | Head Office, Admin |
| GET | `/api/users` | Get all engineers | Head Office, Admin |
| POST | `/api/users` | Create an account | Head Office, Admin |
| PUT | `/api/users/:id/toggle` | Activate/deactivate | Head Office, Admin |
| GET | `/api/messages` | Get chat messages | All logged-in users |
| POST | `/api/messages` | Send a message | All logged-in users |

### Database Tables

| Table | What it stores |
|-------|---------------|
| `users` | Accounts with hashed passwords and roles |
| `faults` | All logged faults with status and priority |
| `solutions` | Knowledge base of fixes for common faults |
| `messages` | Help desk chat messages |

---

## Stopping the Server

Press `Ctrl + C` in the terminal.

---

## Common Problems

**"Cannot find module" error**
→ You forgot to run `npm install`. Go into the `server` folder and run it.

**"Port 3000 already in use"**
→ Another app is using that port. Stop it, or change the port number at the bottom of `server/index.js`.

**Page shows but data doesn't load**
→ Make sure the server is still running in the terminal. If it stopped, run `node index.js` again.

**I deleted the database by accident**
→ Just restart the server with `node index.js` — it will automatically recreate the database and default users.

---

## Possible Improvements

- Deploy online using Railway or Render (free) so others can access it
- Add real-time chat using WebSockets instead of polling every 5 seconds
- Add a password reset feature via email
- Add charts on the dashboard showing fault trends over time
- Add the ability to attach photos to fault reports

---

## Author

Built as a web development project based on the Introduction to Web Development assignment specification.
