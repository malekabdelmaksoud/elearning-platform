@echo off
echo =============================================
echo   Starting E-Learning Platform...
echo =============================================

set JAVA_HOME=C:\Program Files\Java\jdk-17.0.2
set PATH=C:\maven\apache-maven-3.9.6\bin;%JAVA_HOME%\bin;%PATH%

cd /d "%~dp0"
mvn spring-boot:run

pause
