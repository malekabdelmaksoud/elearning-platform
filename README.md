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

## 🚀 Deploy to Render.com (FREE)

### Step 1: Create Free MySQL Database
1. Go to [aiven.io](https://aiven.io) → Sign up free
2. Create a **MySQL** service (free tier)
3. Copy these details:
   - Host (e.g. `mysql-xxx.aiven.io`)
   - Port (e.g. `12345`)
   - Database name
   - Username
   - Password

### Step 2: Push code to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/elearning-platform.git
git push -u origin main
```

### Step 3: Deploy on Render
1. Go to [render.com](https://render.com) → Sign up free
2. Click **New** → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Name**: elearning-platform
   - **Runtime**: Docker
   - **Instance Type**: Free
5. Add **Environment Variables**:
   | Variable | Value |
   |----------|-------|
   | `DB_HOST` | your Aiven MySQL host |
   | `DB_PORT` | your Aiven MySQL port |
   | `DB_NAME` | your database name |
   | `DB_USERNAME` | your Aiven username |
   | `DB_PASSWORD` | your Aiven password |
   | `SPRING_PROFILES_ACTIVE` | prod |
6. Click **Create Web Service**

### Step 4: Initialize Database
Run the `database/schema.sql` on your Aiven MySQL using any MySQL client.

---

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
