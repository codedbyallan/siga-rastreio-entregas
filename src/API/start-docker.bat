@echo off
REM Script para iniciar SIGA Microservices com Docker Compose
REM Execute este arquivo (start-docker.bat) para subir todos os serviços

setlocal enabledelayedexpansion

echo ====================================
echo SIGA Microservices - Docker Setup
echo ====================================
echo.

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não encontrado. Instale Docker Desktop em https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker encontrado
docker --version
echo.

REM Verificar se estamos no diretório correto
if not exist "docker-compose.yml" (
    echo ❌ Erro: docker-compose.yml não encontrado
    echo Execute este script na pasta src/API
    pause
    exit /b 1
)

echo ✅ Arquivo docker-compose.yml encontrado
echo.

REM Verificar se .env existe
if not exist ".env" (
    echo ⚠️  Arquivo .env não encontrado
    echo Criando .env a partir do .env.example...

    if not exist "../../.env.example" (
        echo ❌ Arquivo ../../.env.example não encontrado
        pause
        exit /b 1
    )

    copy "../../.env.example" ".env" >nul
    echo ✅ Arquivo .env criado com sucesso!
    echo.
    echo ⚠️  IMPORTANTE: Edite o arquivo .env e adicione suas credenciais MongoDB
    echo.
    pause
)

echo 📦 Construindo imagens Docker...
docker-compose build

if errorlevel 1 (
    echo ❌ Erro ao construir imagens
    pause
    exit /b 1
)

echo.
echo ✅ Imagens construídas com sucesso!
echo.

echo 🚀 Iniciando serviços...
docker-compose up -d

if errorlevel 1 (
    echo ❌ Erro ao iniciar serviços
    pause
    exit /b 1
)

echo.
echo ✅ Serviços iniciados!
echo.

REM Esperar um pouco para os serviços iniciarem
timeout /t 5 /nobreak

echo.
echo 📊 Status dos serviços:
docker-compose ps
echo.

echo ====================================
echo 🎉 Tudo pronto!
echo ====================================
echo.
echo 📍 Acessar as APIs:
echo.
echo SIGA.User:         http://localhost:5001
echo SIGA.Order:        http://localhost:5002
echo SIGA.Delivery:     http://localhost:5003
echo SIGA.Gateway:      http://localhost:5000
echo.
echo 📖 Documentação das APIs (Swagger/Scalar):
echo http://localhost:5001/swagger
echo http://localhost:5001/scalar
echo.
echo 🛑 Para parar os serviços, execute: docker-compose stop
echo 🔄 Para reiniciar, execute: docker-compose start
echo 🗑️  Para remover tudo, execute: docker-compose down
echo.
pause
