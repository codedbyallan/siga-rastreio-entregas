# SIGA Frontend Web

Esta pasta contém o frontend web do projeto **SIGA — Sistema de Gestão e Rastreio de Entregas**.

A aplicação foi desenvolvida com **React + Vite** e consome as APIs do backend por meio do **SIGA.Gateway**.

---

## Tecnologias utilizadas

- React
- Vite
- JavaScript
- CSS
- Fetch API
- JWT Authentication
- Integração com API Gateway

---

## Principais funcionalidades

O frontend web implementa os principais fluxos internos do sistema:

- tela pública inicial;
- login de usuários;
- cadastro de empresa e operador;
- dashboard interno;
- cadastro de nova encomenda;
- listagem de encomendas da empresa;
- detalhes da encomenda;
- rastreamento interno por código;
- painel administrativo;
- gestão de empresas;
- gestão de entregadores;
- atribuição de entregador a uma entrega;
- atualização de status conforme perfil do usuário;
- logout.

---

## Perfis utilizados

A aplicação trabalha com diferentes perfis de usuário:

```txt
admin
company_operator
courier
```

Cada perfil possui permissões e telas específicas.

---

## Integração com backend

O frontend consome o backend por meio da variável de ambiente:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Em ambiente local, o valor padrão aponta para o Gateway:

```txt
http://localhost:5000
```

No deploy próprio, esta variável deve apontar para a URL pública do Gateway.

---

## Configuração de ambiente

Crie um arquivo `.env` nesta pasta com base no arquivo:

```txt
.env.example
```

Exemplo:

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## Como rodar localmente

Acesse a pasta do frontend:

```bash
cd src/WEB/SIGA.Frontend
```

Instale as dependências:

```bash
npm install
```

Execute o projeto em modo desenvolvimento:

```bash
npm run dev
```

A aplicação normalmente ficará disponível em:

```txt
http://localhost:5173
```

---

## Build de produção

Para gerar o build:

```bash
npm run build
```

Durante a preparação da versão pública, o frontend foi validado com sucesso usando este comando.

---

## Estrutura geral

```txt
SIGA.Frontend
│
├── public
├── src
│   ├── assets
│   ├── components
│   ├── layouts
│   ├── pages
│   ├── services
│   └── App.jsx
│
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```

---

## Páginas principais

Entre as páginas principais da aplicação estão:

- Home pública;
- Login;
- Cadastro de empresa;
- Dashboard;
- Nova Encomenda;
- Minhas Encomendas;
- Detalhes da Encomenda;
- Rastreamento Interno;
- Painel Admin;
- Gestão de Empresas;
- Gestão de Entregadores;
- Perfil do Usuário.

---

## Observações sobre esta versão

Esta versão pública foi preparada para portfólio.

Foram removidos arquivos temporários, páginas antigas e variáveis de ambiente que não eram mais utilizadas.

A aplicação está preparada para ser conectada a um Gateway próprio e a um banco de dados próprio, sem dependência do ambiente acadêmico original.

---

## Próximas melhorias planejadas

- adicionar prints reais das telas;
- configurar deploy próprio do frontend;
- atualizar o README com a URL pública final;
- revisar avisos de dependências;
- melhorar documentação dos fluxos por perfil;
- adicionar testes automatizados no frontend.
