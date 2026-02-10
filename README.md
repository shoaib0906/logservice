## Running the Application Locally

### Prerequisites

Make sure the following tools are installed on your system:

- Docker
- Docker Compose

---

### How to Run Locally

From the project root directory, run:

```bash
docker-compose build
docker-compose up
```

### How to stop

From the project root directory, run:

```bash
docker-compose down
```

### Access the Application

Once the containers are running, the application will be available at:

Django Backend API
👉 http://localhost:8000

React Frontend
👉 http://localhost:5173

The backend and frontend are fully connected using Docker networking.

## Running Tests

To run tests inside the Docker container:

1. Make sure the containers are running:

````bash
docker-compose up -d
```

2. Run  specific test module:
```bash
docker-compose exec backend python manage.py test tests.test_views
```

### Overview

This project was built as a clean and easily runnable full-stack logs dashboard, with a focus on clarity, maintainability, and local development simplicity.

## Backend

- Django REST Framework was used for its strong support for filtering, pagination, and serialization.
- Logs are stored in UTC to ensure consistency, with timezone conversion handled at the frontend.
- django-filter enables flexible filtering by severity, source, and date range.
- Dashboard endpoints (trend, aggregate, histogram) use database-level aggregation for efficient analytics.
- CSV export is implemented server-side for reliability and scalability.

# Library
psycopg2-binary        # PostgreSQL database adapter
django-filter           # Advanced filtering for DRF
django-cors-headers    # Handle CORS for frontend-backend communication
pytz                   # Timezone support

## Frontend

React provides a modular, component-based UI.

- Material UI (MUI) ensures a consistent and accessible design.
- MUI DataGrid supports server-side pagination and filtering.
- Day.js handles date and timezone conversion (UTC → JST).
- Recharts is used for visualizing trends and distributions.

# Library
axios                   # Promise-based HTTP client for making API requests
recharts                # Library for creating charts and data visualizations
@mui/x-date-pickers     # Material UI date picker components
dayjs                   # Lightweight library for date/time manipulation
dev-suuport
@vitejs/plugin-react    # Vite plugin for React support
autoprefixer            # PostCSS plugin to add vendor prefixes automatically
postcss                 # Tool for transforming CSS with JavaScript plugins
tailwindcss             # Utility-first CSS framework for styling
vite                    # Fast frontend build tool / dev server


## Architecture & Tooling

- Clear separation between frontend and backend via REST APIs.
- All services run locally using Docker Compose with minimal setup.
- The project is designed to be easy to run, test, and extend.

## Closing

- This implementation prioritizes clean design, predictable data handling, and a smooth developer experience while keeping the scope appropriate for the assignment.

## Future Enhancements

- Authentication & Authorization
  Implement JWT / OAuth 2.0 for secure API access and user authentication.

- Role-Based Access Control (RBAC)
  Introduce roles (Admin, Viewer, Operator) to control access to logs, dashboards, and exports.

- Multi-Language Support
  Add internationalization (i18n) on both backend and frontend for multi-localization.

- Advanced Analytics
  Support custom time buckets, severity thresholds, and comparative trend analysis.

- Scalability Improvements
  Introduce caching (Redis) and async processing for large log volumes.

- Monitoring & Alerts
  Enable real-time alerts for critical logs via email or webhooks.
````
