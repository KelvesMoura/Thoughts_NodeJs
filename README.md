# 💭 Thoughts CRUD

A full-stack **Node.js** application built to demonstrate a complete backend authentication and session-management flow, wrapped around a simple CRUD (Create, Read, Update, Delete) feature for user "thoughts". Built with **Express**, **Sequelize (MySQL)**, **Redis-backed sessions**, and **Handlebars** as the server-side templating engine — fully containerized with **Docker**.

---

## 🔗 Deploy

### 🔗 Access the live demo here:
👉 https://thoughts.kelvesmoura.com/

> The demo above is deployed via **EasyPanel**, hosted on a **self-managed VPS** (own infrastructure, not a managed PaaS). The application runs inside Docker containers (Node.js + MySQL + Redis) orchestrated behind EasyPanel's reverse proxy, which handles HTTPS/TLS termination for the domain.

### 📦 Repository
👉 https://github.com/KelvesMoura/Thoughts_NodeJs.git

---

## Table of Contents

- [🔗 Deploy](#-deploy)
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Architecture — MVC Pattern](#architecture--mvc-pattern)
- [Authentication & Security](#authentication--security)
- [Session Management (Redis)](#session-management-redis)
- [Data Models & Relationships](#data-models--relationships)
- [Routes](#routes)
- [Docker & Environment Setup](#docker--environment-setup)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [📱 Known Limitation & Planned Improvement](#-known-limitation--planned-improvement)
- [Acknowledgments](#acknowledgments)
- [License](#license)

---

## Project Overview

Thoughts CRUD is a server-rendered application where authenticated users can register, log in, and manage a personal list of short text entries ("thoughts"). The project's primary objective is **not** to be a polished product, but to demonstrate — end to end — how a Node.js backend handles:

- User registration and login with hashed passwords
- Persistent, server-side session storage (Redis) instead of relying purely on client-side cookies
- Authentication middleware protecting private routes
- A relational data model (one user has many thoughts) via Sequelize/MySQL
- A public home feed with search and ordering, alongside a private per-user dashboard

Core features:

- User registration with duplicate-email and password-confirmation checks
- Secure login/logout with hashed password verification
- Route-level authentication guard (`checkAuth` middleware) protecting all `/thoughts/*` routes
- Full CRUD on thoughts: create, list (per-user dashboard), edit, delete
- Public home page listing all thoughts across users, with search (`?search=`) and sort order (`?order=old|new`)
- Flash messages for user feedback (success/error) across auth and CRUD actions
- Fully Dockerized environment (Node.js + MySQL + Redis + phpMyAdmin for local development)

---

## Tech Stack

| Layer            | Technology                                  |
|------------------|----------------------------------------------|
| Runtime          | Node.js (Alpine, containerized)               |
| Web Framework    | Express 5                                     |
| Templating       | Express Handlebars                            |
| ORM              | Sequelize                                     |
| Database         | MySQL                                         |
| Session Store    | Redis (via `connect-redis`)                   |
| Password Hashing | bcryptjs                                      |
| Session Handling | express-session                               |
| Flash Messages   | express-flash                                 |
| Environment Config | dotenv                                      |
| Containerization | Docker + Docker Compose                       |
| Local DB Admin   | phpMyAdmin (dev-only, via Compose override)    |

---

## Project Structure

```
Thoughts_CRUD/
├── server.js
├── package.json
├── env.example
├── dockerfile
├── docker-compose.yml
├── docker-compose.override.yml
├── docker-compose-prod.yml
├── .dockerignore
├── .gitignore
├── controllers/
│   ├── AuthController.js
│   ├── HomeController.js
│   └── ThoughtController.js
├── database/
│   ├── conn.js          ← Sequelize/MySQL connection
│   └── redis.js         ← Redis client connection
├── helpers/
│   └── auth.js           ← checkAuth middleware
├── models/
│   ├── User.js
│   └── Thought.js
├── routes/
│   ├── authRoutes.js
│   ├── homeRoutes.js
│   └── thoughtRoutes.js
├── public/
│   ├── css/
│   │   ├── global.css
│   │   ├── header.css
│   │   ├── footer.css
│   │   ├── home.css
│   │   ├── auth.css
│   │   └── style.css
│   ├── assets/images/logo.webp
│   └── favicon.ico.png
└── views/
    ├── layouts/
    │   └── main.handlebars
    ├── partials/
    │   ├── header.handlebars
    │   ├── footer.handlebars
    │   └── message.handlebars
    ├── auth/
    │   ├── login.handlebars
    │   └── register.handlebars
    ├── thoughts/
    │   ├── dashboard.handlebars
    │   ├── create.handlebars
    │   └── edit.handlebars
    └── home.handlebars
```

---

## Architecture — MVC Pattern

The application follows a classic **Model–View–Controller** structure:

| Layer          | Responsibility                                                        |
|----------------|-------------------------------------------------------------------------|
| **Models**     | Sequelize schema definitions and associations (`User`, `Thought`)        |
| **Controllers**| Business logic for each domain — auth flow, home feed, thought CRUD     |
| **Views**      | Handlebars templates rendered server-side, organized by feature         |
| **Routes**     | Express routers mapping URLs to controller methods, with middleware applied per-router (e.g. `checkAuth` on all thought routes) |

`server.js` is the composition root: it configures the Handlebars engine, body parsers, static file serving, the Redis-backed session middleware, flash messages, and mounts each router before syncing the Sequelize models and starting the HTTP server.

---

## Authentication & Security

Security was the central focus of this project. The implementation includes:

### Password Storage
- Passwords are **never stored in plain text**. `bcryptjs` generates a salt (`bcrypt.genSalt(10)`) and hashes the password before persisting it via `User.create()`.
- On login, the submitted password is compared against the stored hash with `bcrypt.compare()` — the plain password is never re-derived or logged.

### Route Protection
- All routes under `/thoughts/*` are protected by a `checkAuth` middleware (`helpers/auth.js`), applied once at the router level (`router.use(checkAuth)`), rather than per individual route.
- `checkAuth` validates that a `userid` exists in the session **and** that the corresponding user still exists in the database. If either check fails, the session is destroyed and the user is redirected to `/login` — preventing stale or tampered sessions from granting access.

### Session Security
- Sessions are **not** stored in memory (Express's default, which is unsuitable for production) — they are persisted in **Redis** via `connect-redis`, making the app horizontally scalable and resilient to server restarts.
- Session cookie configuration follows security best practices:
  - `httpOnly: true` — the cookie is inaccessible to client-side JavaScript, mitigating XSS-based session theft.
  - `secure: true` — the cookie is only sent over HTTPS.
  - `sameSite: "lax"` — reduces CSRF exposure.
  - `rolling: false` — the cookie does not silently renew its expiration on every request, keeping session lifetime predictable.
  - `maxAge: 3600000` — sessions expire after 1 hour of the original login.
- `app.set("trust proxy", 1)` is enabled so Express correctly recognizes HTTPS when running behind EasyPanel's reverse proxy, which is required for secure cookies to work correctly in that deployment.

### Secrets & Configuration
- All sensitive values — database credentials, the session secret, and Redis connection details — are read exclusively from environment variables (`process.env`) via `dotenv`, and are **never hardcoded** in the source code.
- The repository ships only an `env.example` file with placeholder values; the real `.env` file is excluded from version control (`.gitignore`) and from the Docker build context (`.dockerignore`).
- Database and Redis credentials are isolated per environment (local development vs. production), configured through Docker Compose's environment variable interpolation.

### Server-Side Validation
- Registration checks for duplicate emails and password/confirmation mismatch before creating a user.
- All controller actions are wrapped in `try/catch` blocks, returning generic `500` responses on failure rather than leaking internal error details to the client.

---

## Session Management (Redis)

`database/redis.js` establishes the Redis client connection using `REDIS_HOST`, `REDIS_PORT`, and an optional `REDIS_PASSWORD`, building the connection URL dynamically. `connect-redis`'s `RedisStore` is then wired into `express-session` in `server.js` with a `"session:"` key prefix, so every logged-in user's session state lives in Redis rather than the Node.js process memory.

---

## Data Models & Relationships

| Model      | Fields                          | Relationship                          |
|------------|----------------------------------|----------------------------------------|
| `User`     | `name`, `email`, `password` (hash) | Has many `Thought`                    |
| `Thought`  | `title`                          | Belongs to one `User` (via `UserId`)  |

The association (`Thought.belongsTo(User)` / `User.hasMany(Thought)`) is defined directly in `models/Thought.js`, and Sequelize's `.sync()` call in `server.js` creates/updates the corresponding MySQL tables on startup.

---

## Routes

| Method | Route                | Auth required | Controller                          | Description                            |
|--------|-----------------------|:--------------:|--------------------------------------|-----------------------------------------|
| GET    | `/`                    | No             | `HomeController.show`                | Public feed of all thoughts, with `search` and `order` query params |
| GET    | `/login`               | No             | `AuthController.login`               | Renders login form                     |
| POST   | `/login`               | No             | `AuthController.loginPost`           | Authenticates user, creates session    |
| GET    | `/register`            | No             | `AuthController.register`            | Renders registration form               |
| POST   | `/register`            | No             | `AuthController.registerPost`        | Creates user, hashes password           |
| GET    | `/logout`              | No             | `AuthController.logout`              | Destroys the session                    |
| GET    | `/thoughts/dashboard`  | **Yes**        | `ThoughtController.show`             | Lists the logged-in user's thoughts     |
| GET    | `/thoughts/add`        | **Yes**        | `ThoughtController.createThought`    | Renders "create thought" form           |
| POST   | `/thoughts/add`        | **Yes**        | `ThoughtController.createThoughtPost`| Creates a new thought for the user      |
| GET    | `/thoughts/edit/:id`   | **Yes**        | `ThoughtController.editThought`      | Renders "edit thought" form              |
| POST   | `/thoughts/edit`       | **Yes**        | `ThoughtController.editThoughtPost`  | Updates an existing thought              |
| POST   | `/thoughts/delete`     | **Yes**        | `ThoughtController.deleteThought`    | Deletes a thought owned by the user     |

---

## Docker & Environment Setup

The project ships with three Compose files for different contexts:

| File                          | Purpose                                                                 |
|--------------------------------|--------------------------------------------------------------------------|
| `docker-compose.yml`           | Base services: Node.js app, MySQL, Redis                                 |
| `docker-compose.override.yml`  | Local development overrides — live volume mount for hot-reload, exposed MySQL/Node ports, and a `phpMyAdmin` service for visual DB management |
| `docker-compose-prod.yml`      | Production overrides — `restart: always` policies, no exposed dev ports or live-reload mount |

The `dockerfile` builds a lightweight `node:24-alpine` image, installs only production dependencies (`npm install --omit=dev`), and starts the app with `node server.js`.

---

## Environment Variables

All configuration is driven by environment variables (see `env.example`):

```
COMPOSE_PROJECT_NAME=   # Project name for Docker Compose
DB_PORT_HOST=           # Local host port for the Node.js app
DB_PORT=                # MySQL port
DB_ROOT_PASS=           # MySQL root password (admin/maintenance only)
DB_HOST=                # MySQL host (service name in Docker network)
DB_NAME=                # Database name
DB_USER=                # Application-level MySQL user
DB_USER_PASS=           # Application-level MySQL user password
PHPMYADMIN_PORT=        # Local phpMyAdmin port (dev only)
SESSION_SECRET=         # Secret used to sign the session cookie
REDIS_HOST=             # Redis host
REDIS_PORT=             # Redis port
```

> ⚠️ Never commit a real `.env` file. Only `env.example` (with placeholder values) is tracked in version control.

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/KelvesMoura/Thoughts_NodeJs.git
cd Thoughts_NodeJs

# 2. Copy the example environment file and fill in real values
cp env.example .env

# 3. Start the full stack (Node.js + MySQL + Redis + phpMyAdmin) in dev mode
docker compose up --build

# The app will be available at http://localhost:<DB_PORT_HOST>
# phpMyAdmin will be available at http://localhost:<PHPMYADMIN_PORT>
```

For a production-like run:

```bash
docker compose -f docker-compose.yml -f docker-compose-prod.yml up --build -d
```

---

## 📱 Known Limitation & Planned Improvement

**Responsiveness has not been implemented yet.** The project's primary goal was to demonstrate backend mechanics — authentication, hashed passwords, Redis-backed sessions, and protected routes — rather than front-end polish. As a planned next step, the UI (currently styled for desktop viewports) should be adapted with responsive layouts (media queries / fluid units) to properly support mobile and tablet screens.

---

## Acknowledgments

This project was originally proposed as a guided exercise in the course **["Node.js do Zero a Maestria com diversos Projetos"](https://www.udemy.com/course/nodejs-do-zero-a-maestria-com-diversos-projetos/)**, by **Matheus Battisti**. The base concept, feature scope, and educational purpose of this CRUD application are credited to that course.

The following were **added independently, beyond the course's original scope**:
- Redis-backed session storage (`connect-redis`), replacing in-memory sessions
- The full Docker / Docker Compose setup (dev, override, and production configurations)
- Cookie/session hardening (`httpOnly`, `secure`, `sameSite`, `rolling`)
- The deployment setup (EasyPanel on a self-managed VPS)

---

## License

This project is developed and maintained by [M2K Soluções](https://kelvesmoura.com). The original project concept and course materials referenced above remain the intellectual property of their author, Matheus Battisti.