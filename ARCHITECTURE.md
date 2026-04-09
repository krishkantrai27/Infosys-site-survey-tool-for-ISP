# Application Architecture & Technical Design

## High Level Overview
The Site Survey Tool is built as a typical 3-tier web application consisting of a React frontend, a Spring Boot backend API, and a MySQL relational database. The application provides offline-first-like capabilities for field engineers to perform surveys using interactive floor plans, capture equipment, and log checklists.

## Frontend Architecture
- **Framework**: React 18 using Vite for tooling.
- **Styling**: TailwindCSS for utility-first responsive web design.
- **Routing**: React Router DOM (v6).
- **State Management**: React Hooks Context (AuthContext) and local component state.
- **Mapping & Canvas**: Mapbox GL JS (optional capabilities) and basic Canvas API/SVG for rich floor plan marker placement and drawing polygons for spaces.
- **Form Handling & Notifications**: Custom toast notifications, error boundary components, and unified API fetching logic via generic utility functions.

## Backend Architecture
- **Framework**: Java 21 & Spring Boot 3.4.2.
- **Data Access**: Spring Data JPA / Hibernate mapped to MySQL.
- **Security**: Spring Security + JWT. Stateless sessions with `AuthTokenFilter`. Role-based access control (`ROLE_ADMIN`, `ROLE_ENGINEER`, `ROLE_CUSTOMER`).
- **Dependency Management**: Maven.
- **File Storage**: Abstracted via `FileStorageService` which interacts with local file systems `/app/uploads` by default, but is structured to support object storage like MinIO (S3 compatible) in advanced deployment scenarios.
- **Documentation**: OpenAPI 3 (springdoc-openapi) providing Swagger UI.
- **Containerization**: Docker & Docker Compose for unified stack deployment containing API, Frontend (served via Nginx), MySQL, and MinIO components.

## Database Schema Model
The data model uses a standard physical tree hierarchy ensuring RBAC scoping down to granular elements:
1. **Organization**: Highest level entity.
2. **Property**: Managed entities under an organization.
3. **Building**: Physical structures belonging to a property.
4. **Floor**: Levels inside a building. Each floor can have one base `FloorPlan` image.
5. **Space**: Polygonal or rect spaces defined within the floor plan coordinates (x_min, y_min, etc.).
6. **Equipment / Splice Points**: Logged assets with specific (x, y) coordinates.
7. **Checklists**: Form templates tailored to spaces/floors and the actual submitted feedback.
8. **Users and Memberships**: Links users to particular organizations or individual properties to limit what data they can see.

## API Design Best Practices
- Consistent `ApiResponse<T>` envelope for all payload responses ensuring uniform data extraction on the frontend.
- Standard HTTP status code usage (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found).
- Global Exception Handler intercepting specific application exceptions (`ResourceNotFoundException`, `UnauthorizedException`) to send standard JSON errors.
