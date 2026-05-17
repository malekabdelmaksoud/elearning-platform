# ============================================
# Stage 1: Build with Maven
# ============================================
FROM maven:3.9-eclipse-temurin-17-alpine AS build

WORKDIR /app

COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw

# Download dependencies first (cached layer)
RUN mvn dependency:resolve -B -q

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B -q

# ============================================
# Stage 2: Run with lightweight JRE
# ============================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app
RUN mkdir -p /app/uploads

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-jar", "app.jar", "--spring.profiles.active=prod"]
