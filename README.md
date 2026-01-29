# Sponti Backend

Backend API for **Sponti** – a platform for short, spontaneous challenges designed to help users diversify their free time through light activities based on preferences such as duration, budget, and location.

The backend is responsible for:

- User authentication and authorization
- Challenge management
- Participations and progress tracking
- Administrative moderation
- Data persistence and API exposure for the mobile client

## Tech Stack

- **Node.js**
- **NestJS**
- **TypeScript**
- **PostgreSQL**
- **TypeORM**
- **JWT** authentication
- **Swagger** (OpenAPI)
- **Docker** (database)
- **ngrok** (development exposure)

## Architecture Overview

The backend follows a modular NestJS architecture, separating concerns by domain:

```
src/
├── admin/              # Admin-only endpoints
├── auth/               # Authentication & JWT
├── challenges/         # Challenges domain
├── participations/     # User participations & completions
├── users/              # User profiles & settings
├── utils/              # Guards, decorators, helpers
└── main.ts             # Application bootstrap
```

Each domain module typically contains:

- **controller** – REST endpoints
- **service** – business logic
- **entity** – database models
- **dto** – request/response validation objects

## Authentication & Authorization

### Authentication

- JWT-based authentication
- Access token required for protected endpoints
- Token is sent via `Authorization: Bearer <token>`

### Authorization

**User roles:**

- `user`
- `admin`

**Role-based access enforced via guards:**

- `JwtAuthGuard`
- `AdminGuard`

## User Features

### User Profile

- Retrieve own profile
- Update username and visibility preferences
- Delete own account

### Memories

- Completed challenges are stored as memories
- Each memory includes an uploaded image
- Paginated retrieval supported

### Participations

- Track active challenges
- Track completion count
- Progress persists across sessions

## Challenges

### Challenge Properties

- `title`
- `description`
- `duration`
- `price`
- `location`
- `vehicle` type
- `place` type
- Optional `thumbnail`
- `approval` status

### Challenge Lifecycle

- Challenges may be predefined or user-submitted
- User-submitted challenges require admin approval
- Approved challenges become visible to users

## Admin Features

All admin endpoints are protected with:

- JWT authentication
- Admin role guard

### Admin Capabilities

- List all users (paginated)
- Change user roles
- Delete users
- Review pending challenges
- Approve or reject challenges
- Delete challenges

Admin logic is exposed via a dedicated `AdminController`, while domain logic remains inside the respective services (`UsersService`, `ChallengesService`).

## API Documentation

Swagger is available at:

```
http://localhost:5000/api
```

It includes:

- Authentication endpoints
- User endpoints
- Challenge endpoints
- Participation endpoints
- Admin endpoints

## Database

### Database Engine

**PostgreSQL**

### ORM

**TypeORM**

### Entities

Key entities include:

- `User`
- `Challenge`
- `Participation`
- `CompletionImage`

Relationships are managed via foreign keys and query builders.

- In **development**, schema synchronization may be used.
- In **production**, migrations are recommended.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=sponti

JWT_SECRET=your_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 3. Start PostgreSQL (Docker example)

```bash
docker compose up -d
```

### 4. Run the application

```bash
npm run start:dev
```

The server will start on:

```
http://localhost:5000
```

## Client Integration

This backend is designed to be consumed by:

- **Android mobile client**
  - Built with Kotlin + Compose Multiplatform
  - Communicates via REST API
  - Uses DTOs matching backend entities

## Development Notes

- Pagination is implemented using `page` / `perPage` query parameters
- Raw SQL queries use explicit aliases to preserve camelCase fields
- Guards and decorators are centralized in `utils/`
- Services contain all business logic; controllers remain thin

## Future Improvements

Planned or possible extensions:

- Automatic challenge generation
- Social features (likes, sharing)
- Admin audit logs
- Soft-delete and moderation history

## License

This project was developed as part of a diploma project and is intended for educational purposes.
