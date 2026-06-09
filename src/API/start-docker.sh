#!/bin/bash

# Script para iniciar SIGA Microservices com Docker Compose
# Execute este arquivo (./start-docker.sh) para subir todos os serviços

set -e

echo "===================================="
echo "SIGA Microservices - Docker Setup"
echo "===================================="
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instale em https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "✅ Docker encontrado"
docker --version
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erro: docker-compose.yml não encontrado"
    echo "Execute este script na pasta src/API"
    exit 1
fi

echo "✅ Arquivo docker-compose.yml encontrado"
echo ""

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado"
    echo "Criando .env a partir do .env.example..."

    if [ ! -f "../../.env.example" ]; then
        echo "❌ Arquivo ../../.env.example não encontrado"
        exit 1
    fi

    cp "../../.env.example" ".env"
    echo "✅ Arquivo .env criado com sucesso!"
    echo ""
    echo "⚠️  IMPORTANTE: Edite o arquivo .env e adicione suas credenciais MongoDB"
    echo ""
    read -p "Pressione Enter para continuar..."
fi

echo "📦 Construindo imagens Docker..."
docker-compose build

if [ $? -ne 0 ]; then
    echo "❌ Erro ao construir imagens"
    exit 1
fi

echo ""
echo "✅ Imagens construídas com sucesso!"
echo ""

echo "🚀 Iniciando serviços..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Erro ao iniciar serviços"
    exit 1
fi

echo ""
echo "✅ Serviços iniciados!"
echo ""

# Esperar um pouco para os serviços iniciarem
sleep 5

echo ""
echo "📊 Status dos serviços:"
docker-compose ps
echo ""

echo "===================================="
echo "🎉 Tudo pronto!"
echo "===================================="
echo ""
echo "📍 Acessar as APIs:"
echo ""
echo "SIGA.User:         http://localhost:5001"
echo "SIGA.Order:        http://localhost:5002"
echo "SIGA.Delivery:     http://localhost:5003"
echo "SIGA.Gateway:      http://localhost:5000"
echo ""
echo "📖 Documentação das APIs (Swagger/Scalar):"
echo "http://localhost:5001/swagger"
echo "http://localhost:5001/scalar"
echo ""
echo "🛑 Para parar os serviços, execute: docker-compose stop"
echo "🔄 Para reiniciar, execute: docker-compose start"
echo "🗑️  Para remover tudo, execute: docker-compose down"
echo ""
