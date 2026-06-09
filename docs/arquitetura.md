# Arquitetura da Solução

O **SIGA — Sistema de Gestão e Rastreio de Entregas** foi estruturado com uma arquitetura distribuída, separando responsabilidades entre backend, frontend web, aplicativo mobile e gateway de comunicação.

Esta versão pública mantém apenas os módulos efetivamente utilizados no MVP:

```txt
SIGA.User
SIGA.Order
SIGA.Delivery
SIGA.Gateway
SIGA.Frontend
SIGA.Mobile
```

Módulos planejados, temporários ou não evoluídos foram removidos para manter o repositório mais limpo, consistente e adequado para portfólio.

---

## Visão geral da arquitetura

A solução é composta por três frentes principais:

```txt
Frontend Web
Mobile App
Backend APIs
```

A comunicação entre frontend/mobile e backend ocorre por meio do **SIGA.Gateway**, que centraliza as requisições e encaminha para as APIs internas.

Fluxo simplificado:

```txt
React Web / Expo Mobile
          ↓
     SIGA.Gateway
          ↓
 ┌────────┼────────┐
 │        │        │
User    Order   Delivery
API     API     API
 │        │        │
 └──── MongoDB Atlas ────
```

---

## Backend

O backend foi desenvolvido em **ASP.NET Core Web API**, com separação em múltiplos serviços.

Cada serviço possui responsabilidade própria e estrutura em camadas.

### Serviços principais

```txt
SIGA.User      → usuários, empresas e autenticação
SIGA.Order     → pedidos/encomendas
SIGA.Delivery  → entregas, eventos e rastreamento
SIGA.Gateway   → entrada única para comunicação externa
```

---

## Organização em camadas

Os serviços seguem uma estrutura aproximada em camadas:

```txt
API
Application
Domain
Infra.Data
Infra.IoC
```

### API

Camada responsável pelos controllers, rotas HTTP, autenticação e entrada das requisições.

### Application

Camada responsável pelas regras de aplicação, serviços e orquestração dos fluxos.

### Domain

Camada responsável por modelos, DTOs, interfaces, configurações e regras centrais do domínio.

### Infra.Data

Camada responsável por persistência, repositórios e comunicação com o MongoDB.

### Infra.IoC

Camada responsável por registrar dependências e organizar a injeção de dependência.

---

## SIGA.User

O módulo `SIGA.User` centraliza usuários, empresas e autenticação.

Principais responsabilidades:

- cadastrar empresas;
- cadastrar usuários;
- autenticar usuários;
- gerar token JWT;
- vincular usuários a empresas;
- controlar papéis de acesso.

Papéis principais:

```txt
admin
company_operator
courier
```

---

## SIGA.Order

O módulo `SIGA.Order` centraliza os pedidos/encomendas.

Principais responsabilidades:

- criar pedidos;
- consultar pedidos;
- listar pedidos por empresa;
- atualizar status do pedido;
- manter vínculo com usuário e empresa;
- permitir comunicação interna com o módulo de entregas.

---

## SIGA.Delivery

O módulo `SIGA.Delivery` centraliza entregas, eventos e rastreamento.

Principais responsabilidades:

- criar entrega vinculada a um pedido;
- salvar origem e destino;
- salvar transportadora;
- salvar data de postagem;
- gerar e validar código de rastreamento;
- atribuir entregador;
- registrar eventos de entrega;
- atualizar status;
- validar transições de status;
- disponibilizar rastreamento público por código.

---

## SIGA.Gateway

O módulo `SIGA.Gateway` funciona como ponto único de entrada para o frontend web e o aplicativo mobile.

Principais responsabilidades:

- receber requisições externas;
- encaminhar chamadas para as APIs internas;
- centralizar URLs de serviços;
- simplificar o consumo pelo frontend e mobile;
- preservar respostas originais das APIs internas.

---

## Comunicação entre serviços

O fluxo principal de criação de encomenda envolve mais de uma API:

```txt
Frontend Web / Mobile
        ↓
SIGA.Gateway
        ↓
SIGA.Order
        ↓
SIGA.Delivery
        ↓
DeliveryEvent
```

Resumo:

1. O operador cadastra uma nova encomenda.
2. O Gateway encaminha a requisição.
3. O `SIGA.Order` cria o pedido.
4. O `SIGA.Delivery` cria a entrega vinculada ao pedido.
5. Um evento inicial é registrado.
6. O código de rastreamento passa a permitir consulta pública.

---

## Autenticação e autorização

A autenticação é feita com **JWT**.

Após o login, o usuário recebe um token que é enviado nas requisições autenticadas.

O backend utiliza o token para identificar:

- usuário logado;
- perfil do usuário;
- empresa vinculada;
- permissões de acesso.

Regras gerais:

- operadores acessam dados da própria empresa;
- entregadores acessam entregas atribuídas a eles;
- administradores possuem visão mais ampla;
- rotas públicas, como rastreamento por código, não exigem login.

---

## Regras de status

O fluxo principal de status da entrega é:

```txt
CREATED → POSTED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
```

Também existe o status:

```txt
CANCELED
```

Regras aplicadas:

- não é permitido pular etapas;
- não é permitido retroceder status;
- entregas finalizadas não podem voltar para estados anteriores;
- entregadores só atualizam entregas atribuídas a eles;
- cada perfil possui permissões específicas.

---

## Frontend Web

O frontend web foi desenvolvido com **React + Vite**.

Ele consome o backend por meio do Gateway.

Principais áreas da aplicação:

- Home pública;
- Login;
- Cadastro de empresa;
- Dashboard;
- Nova Encomenda;
- Minhas Encomendas;
- Detalhes da Encomenda;
- Rastreamento Interno;
- Painel Administrativo;
- Gestão de Entregadores;
- Perfil do Usuário.

---

## Mobile

O aplicativo mobile foi desenvolvido com **Expo + React Native**.

O app é voltado para uso operacional, principalmente por operadores e entregadores.

Principais áreas:

- Login;
- Cadastro de empresa;
- Fluxo do operador;
- Fluxo do entregador;
- Detalhes da entrega;
- Atualização de status;
- Perfil do usuário.

---

## Banco de dados

A persistência utiliza **MongoDB**.

A versão pública está preparada para uso com banco próprio.

Bases esperadas:

```txt
siga_user
siga_order
siga_delivery
```

Cada módulo acessa sua base conforme sua responsabilidade.

---

## Docker e ambiente local

O backend pode ser executado com Docker Compose.

Serviços locais:

```txt
SIGA.Gateway   http://localhost:5000
SIGA.User      http://localhost:5001
SIGA.Order     http://localhost:5002
SIGA.Delivery  http://localhost:5003
```

O arquivo principal para execução local das APIs está em:

```txt
src/API/docker-compose.yml
```

---

## Deploy

Esta versão pública está preparada para deploy próprio.

O objetivo é não depender de:

- banco antigo da faculdade;
- URLs antigas de deploy;
- variáveis antigas;
- credenciais antigas;
- infraestrutura usada no desenvolvimento acadêmico original.

A estratégia planejada é:

```txt
MongoDB Atlas próprio
Deploy próprio das APIs
Deploy próprio do frontend
Build próprio do app mobile
```

---

## Estrutura principal

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

## Observações sobre a versão pública

A versão pública foi preparada para portfólio.

Foram removidos:

- módulos não evoluídos;
- imagens antigas de arquitetura;
- documentação acadêmica de template;
- arquivos temporários;
- credenciais antigas;
- URLs antigas de deploy;
- app mobile legado.

A arquitetura atual documenta apenas o que permanece como parte funcional do MVP.