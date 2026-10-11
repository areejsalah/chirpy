# Chirpy 🐦

A RESTful API for a simple social platform where users can create, read, and manage short messages called **chirps**.

Chirpy is a backend project built with TypeScript, Express.js, PostgreSQL, and Drizzle ORM. It was developed as part of the Boot.dev backend development curriculum to practice building APIs, managing databases, implementing authentication, and handling webhooks.

## 🚀 Features

- **User Management** — Create user accounts and manage user information.
- **Authentication** — Secure password hashing with Argon2 and token-based authentication using JWT.
- **Chirps API** — Create, retrieve, and manage short messages.
- **Content Filtering** — Automatically replace configured profane words in chirps.
- **Author Filtering** — Retrieve chirps written by a specific user using the `authorId` query parameter.
- **Sorting** — Sort chirps by creation time in ascending or descending order.
- **Database Integration** — Store users and chirps in PostgreSQL using Drizzle ORM.
- **Database Migrations** — Manage database schema changes with Drizzle Kit.
- **Polka Webhooks** — Handle user upgrade events and support Chirpy Red account upgrades.
- **API Key Authentication** — Protect the Polka webhook endpoint with API key verification.
- **Error Handling** — Return appropriate HTTP status codes for common API errors.
- **Development Tools** — Use TypeScript and Vitest for development and testing.

## 🛠️ Tech Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **Web Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** JSON Web Tokens (JWT)
- **Password Hashing:** Argon2
- **Testing:** Vitest
- **Package Manager:** npm

## 📋 Prerequisites

Before running the project, make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- [PostgreSQL](https://www.postgresql.org/)
- Git

## ⚙️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/areejsalah/chirpy.git
cd chirpy
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=8080
PLATFORM=dev
DB_URL=your_postgresql_connection_string
POLKA_KEY=your_polka_api_key
```

Replace the placeholder values with your local PostgreSQL connection details and your Polka API key.

**Important:** Never commit your `.env` file or expose database credentials, API keys, or other secrets publicly.

### 4. Set up the database

Make sure PostgreSQL is running and that your database exists.

Apply the project's database migrations using the migration setup configured in the application.

If you need to generate a migration after changing the database schema, use:

```bash
npx drizzle-kit generate
```

### 5. Run the development server

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:8080
```

## 📡 API Overview

The following endpoints describe the main functionality implemented in the project.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/healthz` | Check API health |
| GET | `/api/chirps` | Retrieve chirps |
| GET | `/api/chirps?authorId=USER_ID` | Retrieve chirps by author |
| GET | `/api/chirps?sort=asc` | Sort chirps oldest first |
| GET | `/api/chirps?sort=desc` | Sort chirps newest first |
| GET | `/api/chirps/:chirpId` | Retrieve a specific chirp |
| POST | `/api/chirps` | Create a chirp |
| POST | `/api/polka/webhooks` | Process Polka webhook events |
| GET | `/admin/metrics` | View server metrics |

Some endpoints require authentication. Refer to the request handlers for the exact request body, authorization requirements, and response formats.

## 🧪 Testing

Run the automated test suite with:

```bash
npm test
```

Run the Boot.dev CLI checks, if you have the CLI installed and configured:

```bash
bootdev run
```

## 📁 Project Structure

```text
chirpy/
├── src/
│   ├── db/
│   │   ├── migrations/
│   │   ├── queries/
│   │   └── schema.ts
│   ├── app/
│   ├── auth.ts
│   ├── config.ts
│   └── index.ts
├── .env                 # Local secrets; not committed
├── .gitignore
├── drizzle.config.ts
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

## 🎯 Learning Objectives

This project provided hands-on practice with:

- Designing RESTful APIs with Express.js.
- Working with TypeScript in a backend application.
- Using PostgreSQL and Drizzle ORM for database operations.
- Implementing authentication and password hashing.
- Validating requests and handling errors.
- Filtering and sorting API results.
- Managing database schema changes with migrations.
- Integrating webhook events and API key authentication.
- Testing application functionality.

## 👩‍💻 Author

**Areej Salah**

- GitHub: [@areejsalah](https://github.com/areejsalah)
- Project Repository: [Chirpy](https://github.com/areejsalah/chirpy)

---

Built with TypeScript and Express.js as part of my backend development learning journey.
