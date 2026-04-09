# Release Notes - v1.0.0

## Overview
We are proud to release version 1.0.0 (Milestone 14 Final) of the ISP Site Survey Application. This milestone brings full end-to-end functionality integrating robust database architectures, interactive canvas APIs, and asynchronous background processing mechanisms.

## Core Features 🚀
- **Hierarchical Site Management**: Organizations -> Properties -> Buildings -> Floors -> Spaces.
- **Interactive Floor Planning (Canvas)**: Draw vector polygons directly on an uploaded PNG/JPEG blueprint. Mark spaces with exact (X, Y) coordinates relative to the underlying image.
- **Physical Equipment Logging**: Place and categorize hardware devices visually onto the map. Features contextual popup management.
- **Survey Checklists**: Granular JSON-driven dynamic inspection checklists with attachment uploads.
- **Advanced Authentication**: Stateful JWT access token & secure refresh token mechanisms alongside full RBAC profiles (Admin/Engineer/Customer).
- **RF Mapping Tools**: Extract geospatial and signal data from Kismet/SPLAT files to render responsive network coverage heatmaps.
- **Automated Reporting via Wait/Poll API**: Export fully collated blueprints into a standardized OpenPDF physical document with images dynamically injected alongside aggregated checklists.

## Technical Enhancements 🛠
- Environment configurations standardized to `application-staging.yml` integrating seamlessly with Docker-Compose logic.
- MinIO distributed storage capability configured in the production manifest for easily swappable object storage replacing local `upload-dir`.
- Fully documented backend REST endpoints using `springdoc-openapi` OpenAPI 3 schema available at `/swagger-ui.html`.
- Implemented global error boundary layers propagating generic server failures to intuitive UI Toasts.
- Responsive tailwind design refactored specifically to target Apple iPad and generalized Tablet viewport ratios common for field usage.

## Known Limitations ⚠️
- Deleting an organization removes child properties with a cascaded loop. To bypass timeouts for very large organizations, an asynchronous deletion queue is queued for subsequent releases.
- Large RF heatmap scan files (>25k rows) may introduce canvas latency on slower tablet devices. Decoupling the rendering layer into WebGL or optimized Worker Threads is slated for v1.1.
