# E-Learning Platform

## 🏃 Run Locally (without Docker)
```bash
mvn spring-boot:run
```

## 🐳 Run with Docker
```bash
docker-compose up --build
```
Open: http://localhost:8080
lien 
https://elearning-platform-1oux.onrender.com/
## 📁 Project Structure
```
├── Dockerfile                 ← Docker build instructions
├── docker-compose.yml         ← Local dev with Docker
├── .dockerignore              ← Files excluded from Docker
├── pom.xml                    ← Maven dependencies
├── database/
│   └── schema.sql             ← Database schema
├── src/main/
│   ├── java/com/elearning/    ← Java source code
│   └── resources/
│       ├── application.properties       ← Local config
│       ├── application-prod.properties  ← Production config
│       └── static/                      ← Frontend files
└── uploads/                   ← Uploaded files
```
