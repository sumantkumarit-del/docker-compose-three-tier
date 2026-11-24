# Docker Compose Three-Tier Employee Management

A local-development employee directory built from three Docker Compose services: a React/Vite frontend served by Nginx, a Spring Boot REST API, and a MySQL 8 database. Employee records are stored in a named Docker volume.

## Architecture

```text
Browser ── http://localhost:3000 ──> Nginx (frontend)
                                          │ /api/*
                                          ▼
                                     backend:8080
                                          │ JDBC
                                          ▼
                                     mysql:3306
```

The browser sends relative requests such as `/api/employees` to the frontend origin. Nginx forwards those paths to the `backend` Compose service; the backend connects to the `mysql` Compose service. Docker's default Compose network provides service-name DNS, so no container IP addresses or browser-side Docker hostnames are used.

## Folder structure

```text
docker-compose-three-tier/
├── backend/
│   ├── src/main/java/com/example/employeemanagement/
│   │   ├── EmployeeManagementApplication.java
│   │   └── employee/
│   │       ├── Employee.java
│   │       ├── EmployeeController.java
│   │       ├── EmployeeRepository.java
│   │       └── HealthController.java
│   ├── src/main/resources/application.properties
│   ├── .dockerignore
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── public/favicon.svg
│   ├── src/App.jsx
│   ├── src/main.jsx
│   ├── src/styles.css
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf
│   ├── package-lock.json
│   ├── package.json
│   └── vite.config.js
├── .env.example
├── .gitignore
└── docker-compose.yml
```

## Prerequisites

- Docker Desktop (or Docker Engine with the Compose plugin) running.
- VS Code terminal opened in this project folder.
- Internet access on the first build to download the base images and dependencies.

Local Java, Maven, Node.js, and MySQL installations are not required; they run in containers.

## Configure and start

Run these commands from `docker-compose-three-tier`:

```powershell
Copy-Item .env.example .env
docker compose config
docker compose up --build -d
```

The example `.env` values (`appuser`, `apppassword`, and `rootpassword`) are for local development only. Replace them before using this setup outside a local machine. The backend datasource settings are passed as `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD`; the database service receives the corresponding MySQL environment variables.

Compose builds the React production bundle and Spring Boot JAR, starts MySQL, waits for its health check to pass before starting the backend, and starts the frontend after the backend container starts.

## Check containers and logs

```powershell
docker compose ps
docker compose logs -f
docker compose logs -f frontend
docker compose logs -f backend
docker compose logs -f mysql
```

Press `Ctrl+C` to stop following logs; this does not stop the containers.

## Use the application

Open the UI at [http://localhost:3000](http://localhost:3000). Add an employee with a name, valid email address, and department. The directory refreshes on page load and shows the database-generated ID.

The backend is also published on port 8080:

- Health: [http://localhost:8080/api/health](http://localhost:8080/api/health)
- List employees: [http://localhost:8080/api/employees](http://localhost:8080/api/employees)

Example PowerShell API requests:

```powershell
Invoke-RestMethod http://localhost:8080/api/health
Invoke-RestMethod http://localhost:8080/api/employees

$employee = @{
  name = 'Alex Morgan'
  email = 'alex.morgan@example.com'
  department = 'Engineering'
} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8080/api/employees -Method Post -ContentType 'application/json' -Body $employee
```

Verify a record in MySQL (substitute another email if you used a different one):

```powershell
docker compose exec mysql mysql -uappuser -papppassword employeedb -e "SELECT id, name, email, department FROM employees;"
```

The Compose file does not publish MySQL to the host. Connect from another Compose service using `mysql:3306`; use `docker compose exec mysql ...` for local inspection.

## Stop and preserve data

Stop and remove the application containers and network while keeping the named `mysql_data` volume:

```powershell
docker compose down
```

Start again with `docker compose up -d`; the same MySQL data will be reused. To intentionally delete the database volume and all employee data as well:

```powershell
docker compose down --volumes
```

## Troubleshooting

Run commands from this project directory:

```powershell
# Confirm the rendered Compose configuration and environment substitutions
docker compose config

# Check service state and MySQL health
docker compose ps
docker compose logs --tail 100 mysql

# Inspect application startup and API errors
docker compose logs --tail 100 backend
docker compose logs --tail 100 frontend

# Rebuild images after changing source or Dockerfiles
docker compose up --build -d

# Check the named volume
docker volume ls
docker volume inspect docker-compose-three-tier_mysql_data
```

If the backend reports a database connection error, wait for MySQL to become healthy and inspect its logs; then check that the `.env` database name, user, and password are consistent. If the browser cannot reach the API, verify all three containers with `docker compose ps` and check `docker compose logs -f frontend backend`. A duplicate email is rejected by the database's unique constraint. A full reset that deletes persisted records is `docker compose down --volumes`.
