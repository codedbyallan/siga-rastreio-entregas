# SIGA API

Esta pasta contém o backend do projeto **SIGA — Sistema de Gestão e Rastreio de Entregas**.

A arquitetura foi organizada em múltiplas APIs, separando responsabilidades entre usuários, pedidos, entregas e gateway de comunicação.

Esta versão pública foi limpa para portfólio, mantendo apenas os serviços efetivamente utilizados no MVP.

---

## Serviços mantidos

```txt
SIGA.User
SIGA.Order
SIGA.Delivery
SIGA.Gateway
```

---

## Visão geral dos módulos

### SIGA.User

API responsável por usuários, empresas e autenticação.

Principais responsabilidades:

- cadastro de empresas;
- cadastro de usuários;
- login;
- geração de token JWT;
- vínculo de usuários com empresas;
- controle de papéis como administrador, operador e entregador.

---

### SIGA.Order

API responsável pelos pedidos/encomendas.

Principais responsabilidades:

- criação de pedidos;
- vínculo do pedido com empresa e usuário;
- listagem de pedidos por empresa;
- consulta de pedido por ID;
- atualização de status;
- validações principais da encomenda.

---

### SIGA.Delivery

API responsável pelas entregas e rastreamento operacional.

Principais responsabilidades:

- criação da entrega vinculada ao pedido;
- registro de endereço de origem e destino;
- geração e validação de código de rastreamento;
- criação de eventos de entrega;
- atribuição de entregador;
- atualização de status;
- validação de transições de status;
- consulta pública por código de rastreamento.

---

### SIGA.Gateway

API responsável por centralizar a comunicação entre clientes e serviços internos.

Principais responsabilidades:

- expor uma URL única para frontend web e mobile;
- redirecionar chamadas para as APIs internas;
- preservar status code, body e content-type das APIs;
- simplificar o consumo dos serviços pelo frontend.

---

## Portas locais

```txt
SIGA.Gateway   http://localhost:5000
SIGA.User      http://localhost:5001
SIGA.Order     http://localhost:5002
SIGA.Delivery  http://localhost:5003
```

---

## Tecnologias utilizadas

- C#
- ASP.NET Core Web API
- .NET
- MongoDB Atlas
- JWT Authentication
- Docker
- Docker Compose
- Scalar/OpenAPI
- Arquitetura em camadas

---

## Estrutura geral

```txt
src/API
│
├── SIGA.User
├── SIGA.Order
├── SIGA.Delivery
├── SIGA.Gateway
├── docker-compose.yml
├── SIGA.slnx
├── start-docker.bat
└── start-docker.sh
```

---

## Configuração de ambiente

Na raiz do repositório existe um arquivo:

```txt
.env.example
```

Crie um arquivo `.env` baseado nele:

```bash
cp ../../.env.example .env
```

No Windows, também é possível copiar manualmente o arquivo `.env.example` da raiz e renomear para `.env`.

Variáveis esperadas:

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

Este repositório não contém credenciais reais.

Para rodar o projeto, é necessário configurar um banco MongoDB próprio e variáveis de ambiente próprias.

---

## Executando com Docker Compose

Acesse a pasta da API:

```bash
cd src/API
```

Execute:

```bash
docker compose up --build
```

Serviços esperados:

```txt
Gateway:  http://localhost:5000
User:     http://localhost:5001
Order:    http://localhost:5002
Delivery: http://localhost:5003
```

---

## Build local

Acesse a pasta da API:

```bash
cd src/API
```

Execute:

```bash
dotnet build SIGA.slnx
```

Durante a preparação da versão pública, o backend foi validado com sucesso usando este comando.

---

## Testes

O projeto possui testes automatizados em parte do módulo de usuários.

Para executar os testes:

```bash
dotnet test SIGA.slnx
```

---

## Fluxo principal entre APIs

O cadastro de uma nova encomenda segue o fluxo:

```txt
Frontend/Web ou Mobile
        ↓
SIGA.Gateway
        ↓
SIGA.Order
        ↓
SIGA.Delivery
        ↓
SIGA.DeliveryEvents
```

Resumo do processo:

1. O operador cadastra uma nova encomenda.
2. A API `SIGA.Order` cria o pedido.
3. A API `SIGA.Delivery` cria a entrega vinculada ao pedido.
4. O sistema registra o evento inicial da entrega.
5. O código de rastreamento pode ser usado para consulta pública.
6. O operador ou entregador atualiza o status conforme as regras de permissão.

---

## Regras de status

Fluxo normal de entrega:

```txt
CREATED → POSTED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
```

Status de cancelamento:

```txt
CANCELED
```

Regras aplicadas:

- não é permitido pular etapas;
- não é permitido retroceder status;
- entregas finalizadas não podem ser alteradas;
- entregadores só podem atualizar entregas atribuídas a eles;
- operadores e administradores possuem permissões diferentes das do entregador.

---

## Observações sobre esta versão

Esta versão pública foi preparada para portfólio.

Foram removidos:

- módulos não evoluídos;
- arquivos temporários;
- referências a ambientes antigos;
- credenciais antigas;
- documentação acadêmica de template;
- configurações ligadas ao deploy original do grupo.

Os serviços mantidos representam a parte funcional principal do projeto:

```txt
User
Order
Delivery
Gateway
```

---

## Próximas melhorias planejadas

- configurar banco MongoDB Atlas próprio;
- configurar deploy próprio das APIs;
- atualizar documentação com URLs públicas;
- adicionar exemplos de requisições;
- adicionar prints do Scalar/OpenAPI;
- revisar avisos de dependências;
- expandir testes automatizados.
