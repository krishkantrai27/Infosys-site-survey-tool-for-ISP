# Site Survey Tool

A comprehensive application for managing and executing site surveys, built with Spring Boot (Java 21) and React (Vite & Tailwind). Designed for administrators to manage properties, buildings, floors, and spaces, and for engineers to execute surveys via interactive floor plan canvases and checklists.

## Prerequisites
- Java 21+
- Node.js 18+
- MySQL 8.0+
- Docker & Docker Compose

## Local Setup

### Database Configuration
Ensure MySQL is running on port 3306. Create a database called `site`:
```sql
CREATE DATABASE site;
```

### Environment Variables (.env)
Create an `.env` file in the root based on `.env.example`:
```
MYSQL_ROOT_PASSWORD=your_db_password
JWT_SECRET=your_jwt_secret_key
SPRING_PROFILES_ACTIVE=dev
```

### Running Backend
```bash
cd backend
./mvnw spring-boot:run
```

### Running Frontend
```bash
cd frontend
npm install
npm run dev
```

## Running via Docker Compose (Staging / Production)
You can bring up the entire stack (MySQL, MinIO Object Storage, Backend API, Frontend React App behind Nginx) via Docker:
```bash
docker-compose up -d --build
```
* Note: MinIO will run on port `9000` (API) and `9001` (Console). The frontend is exposed on port `3000`, and the backend on `8080`.

## Swagger API Documentation
When the backend is running, access the Swagger UI at:
- Local: http://localhost:8080/swagger-ui.html
