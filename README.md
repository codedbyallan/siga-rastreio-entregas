# SIGA — Sistema de Gestão e Rastreio de Entregas

O **SIGA** é uma aplicação fullstack para gestão e rastreamento de entregas, desenvolvida como projeto acadêmico no curso de Análise e Desenvolvimento de Sistemas.

A solução permite que empresas cadastrem encomendas, operadores acompanhem entregas, entregadores atualizem o status das entregas atribuídas e clientes consultem o andamento de uma encomenda por meio de um código de rastreamento.

Esta versão pública foi organizada para portfólio, com remoção de módulos legados, arquivos temporários e configurações vinculadas ao ambiente acadêmico original. O objetivo desta versão é apresentar uma base limpa, funcional e preparada para banco de dados e deploy próprios.

---

## Visão geral

O sistema foi construído com arquitetura distribuída, separando responsabilidades entre APIs, frontend web e aplicativo mobile.

Principais fluxos implementados:

- cadastro e login de usuários;
- cadastro de empresas;
- cadastro de encomendas;
- geração de código de rastreamento;
- rastreamento público por código;
- painel interno para empresas;
- listagem de encomendas por empresa;
- detalhes da encomenda;
- histórico de eventos da entrega;
- atribuição de entregador;
- atualização de status por perfil;
- fluxo mobile para operador e entregador;
- autenticação com JWT;
- comunicação entre APIs via Gateway.

---

## Tecnologias utilizadas

### Backend

- C#
- ASP.NET Core Web API
- .NET
- MongoDB Atlas
- JWT Authentication
- Docker
- Docker Compose

### Frontend Web

- React
- Vite
- JavaScript
- CSS
- Consumo de API via Gateway

### Mobile

- Expo
- React Native
- JavaScript
- EAS Build
- Consumo de API via Gateway

### Outros recursos

- Git e GitHub
- Docker Compose para ambiente local
- Arquitetura em múltiplos serviços
- Separação por camadas no backend
- Testes automatizados em parte do módulo de usuários

---

## Estrutura do repositório

```txt
siga-rastreio-entregas
│
├── docs
│   ├── contexto.md
│   └── arquitetura.md
│
├── src
│   ├── API
│   │   ├── SIGA.User
│   │   ├── SIGA.Order
│   │   ├── SIGA.Delivery
│   │   ├── SIGA.Gateway
│   │   └── docker-compose.yml
│   │
│   ├── WEB
│   │   └── SIGA.Frontend
│   │
│   └── MOBILE
│       └── SIGA.Mobile
│
├── .env.example
├── docker-compose.frontend.yml
└── README.md
```

---

## Módulos principais

### SIGA.User

Responsável por usuários, empresas, autenticação e vínculo entre operador, entregador e empresa.

Principais responsabilidades:

- cadastro de usuários;
- cadastro de empresas;
- autenticação;
- geração de token JWT;
- controle de papéis como administrador, operador e entregador.

### SIGA.Order

Responsável pelos pedidos/encomendas.

Principais responsabilidades:

- criação de pedidos;
- vínculo com empresa e usuário;
- atualização de status;
- consulta de encomendas por empresa;
- controle de dados principais da encomenda.

### SIGA.Delivery

Responsável pelas entregas e histórico operacional.

Principais responsabilidades:

- criação da entrega vinculada ao pedido;
- dados de origem e destino;
- transportadora;
- código de rastreamento;
- eventos de rastreio;
- atribuição de entregador;
- regras de transição de status.

### SIGA.Gateway

Responsável por centralizar o acesso às APIs.

Principais responsabilidades:

- expor uma entrada única para o frontend web e mobile;
- redirecionar chamadas para os serviços internos;
- preservar respostas das APIs;
- simplificar a comunicação dos clientes com o backend.

### SIGA.Frontend

Aplicação web usada por operadores, administradores e usuários internos.

Principais funcionalidades:

- login;
- cadastro de empresa;
- dashboard;
- cadastro de nova encomenda;
- minhas encomendas;
- detalhes da encomenda;
- rastreamento interno;
- gestão de entregadores;
- atualização de status.

### SIGA.Mobile

Aplicativo mobile desenvolvido com Expo/React Native.

Principais funcionalidades:

- login;
- visualização de encomendas;
- detalhes da entrega;
- fluxo do operador;
- fluxo do entregador;
- atualização de status permitida por perfil.

---

## Regras de status da entrega

O fluxo principal de uma entrega segue a sequência:

```txt
CREATED → POSTED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
```

Também existe suporte para cancelamento antes de status final:

```txt
CANCELED
```

Regras aplicadas:

- não é permitido pular etapas;
- não é permitido retroceder status;
- entregas finalizadas não podem ser alteradas;
- entregadores só atualizam entregas atribuídas a eles;
- operadores e administradores possuem permissões diferentes das do entregador.

---

## Como rodar localmente

### Pré-requisitos

Antes de executar o projeto, é necessário ter instalado:

- .NET SDK;
- Node.js;
- npm;
- Docker Desktop;
- Git;
- Expo CLI/EAS CLI, para o mobile.

---

## Configuração de ambiente

Crie um arquivo `.env` na raiz do projeto com base no arquivo:

```txt
.env.example
```

Exemplo de variáveis esperadas:

```env
MONGODB_HOST=mongodb+srv://seu-cluster.mongodb.net/
MONGODB_USERNAME=seu_usuario
MONGODB_PASSWORD=sua_senha

MONGODB_DATABASE_USER=siga_user
MONGODB_DATABASE_ORDER=siga_order
MONGODB_DATABASE_DELIVERY=siga_delivery

JWT_SECRET=sua_chave_jwt_segura_com_pelo_menos_32_caracteres
INTERNAL_API_KEY=sua_chave_interna_segura

ASPNETCORE_ENVIRONMENT=Development

ORDER_API_BASE_URL=http://siga-order:5002
USER_API_BASE_URL=http://siga-user:5001
```

Este repositório não inclui credenciais reais. Para executar o sistema, é necessário configurar banco de dados próprio e variáveis de ambiente próprias.

---

## Rodando o backend com Docker Compose

Acesse a pasta da API:

```bash
cd src/API
```

Execute:

```bash
docker compose up --build
```

Serviços esperados em ambiente local:

```txt
Gateway:  http://localhost:5000
User:     http://localhost:5001
Order:    http://localhost:5002
Delivery: http://localhost:5003
```

---

## Rodando o frontend web

Acesse a pasta do frontend:

```bash
cd src/WEB/SIGA.Frontend
```

Instale as dependências:

```bash
npm install
```

Execute em modo desenvolvimento:

```bash
npm run dev
```

Para build de produção:

```bash
npm run build
```

---

## Rodando o mobile

Acesse a pasta do mobile:

```bash
cd src/MOBILE/SIGA.Mobile
```

Instale as dependências:

```bash
npm install
```

Execute o projeto:

```bash
npx expo start
```

Para validar o ambiente Expo:

```bash
npx expo-doctor
```

---

## Testes e validação

Durante a preparação desta versão pública, foram validados:

- build do backend com `dotnet build`;
- build do frontend web com `npm run build`;
- validação do mobile com `npx expo-doctor`;
- remoção de módulos legados;
- remoção de credenciais antigas;
- remoção de arquivos temporários;
- limpeza de referências a ambientes externos antigos.

---

## Status do projeto

Status atual:

```txt
Versão pública limpa para portfólio
Backend compilando
Frontend web compilando
Mobile validado pelo Expo Doctor
Preparado para banco próprio
Preparado para deploy próprio
```

Próximas etapas planejadas:

- criar banco MongoDB Atlas próprio;
- configurar deploy próprio das APIs;
- configurar deploy próprio do frontend;
- gerar APK atualizado do mobile;
- adicionar prints reais do sistema;
- criar documentação técnica mais completa;
- atualizar README com links públicos.

---


## Observação sobre esta versão

Este repositório representa uma versão pública e independente do projeto SIGA para fins de portfólio.

O repositório acadêmico original permanece separado. Esta versão foi limpa para remover arquivos temporários, módulos não evoluídos, referências antigas de ambiente e dependências de infraestrutura externa usada durante o desenvolvimento acadêmico.

---

## Créditos

Projeto acadêmico desenvolvido em grupo no curso de Análise e Desenvolvimento de Sistemas.

Integrantes:

- Allan da Silva Barbosa
- Barbara Farias da Silva
- João Rezende Vieira
- Lucas Gabriel Oliveira Dias
- Nathan Felipe Zannetti Ferreira
- Pedro Andrade Rodrigues

Orientador:

- Leonardo Vilela Cardoso
