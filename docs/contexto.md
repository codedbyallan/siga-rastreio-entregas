# Contexto do Projeto

O **SIGA — Sistema de Gestão e Rastreio de Entregas** é uma aplicação desenvolvida para facilitar o acompanhamento de encomendas, centralizando informações de pedidos, entregas, status e histórico de movimentações.

O projeto nasceu como uma solução acadêmica para o curso de Análise e Desenvolvimento de Sistemas, com o objetivo de aplicar conceitos de desenvolvimento fullstack, APIs, autenticação, arquitetura distribuída, persistência em banco NoSQL, frontend web e aplicativo mobile.

Esta versão pública foi reorganizada para portfólio, mantendo apenas os módulos efetivamente utilizados no MVP e removendo arquivos temporários, módulos não evoluídos, credenciais antigas e referências ao ambiente acadêmico original.

---

## Problema abordado

Em processos de entrega, é comum que clientes, empresas e entregadores tenham dificuldade para acompanhar o andamento real de uma encomenda.

Entre os principais problemas estão:

- falta de rastreabilidade clara;
- comunicação descentralizada;
- dificuldade para consultar o histórico da entrega;
- pouca visibilidade sobre mudanças de status;
- controle manual de entregadores e encomendas;
- ausência de uma visão integrada entre empresa, operador e entregador.

O SIGA busca resolver esse problema oferecendo uma plataforma simples para registrar, acompanhar e atualizar entregas de forma estruturada.

---

## Objetivo da solução

O objetivo do SIGA é permitir que:

- empresas cadastrem encomendas;
- operadores acompanhem entregas da empresa;
- entregadores visualizem entregas atribuídas;
- entregadores atualizem status conforme permissão;
- clientes consultem o rastreamento por código;
- administradores tenham visão operacional do sistema.

---

## Público-alvo

A solução foi pensada para três grupos principais de usuários:

### Empresas e operadores

Usuários responsáveis por cadastrar encomendas, acompanhar entregas e gerenciar entregadores vinculados à empresa.

### Entregadores

Usuários responsáveis por visualizar entregas atribuídas e registrar atualizações de status durante o processo de entrega.

### Clientes finais

Usuários que desejam consultar o andamento de uma encomenda utilizando um código de rastreamento.

---

## Escopo funcional

A versão atual contempla:

- cadastro de empresa;
- cadastro e login de usuários;
- autenticação com JWT;
- papéis de usuário;
- cadastro de encomenda;
- criação de pedido;
- criação de entrega;
- geração de código de rastreamento;
- rastreamento público;
- histórico de eventos;
- atualização de status;
- atribuição de entregador;
- painel interno web;
- aplicativo mobile com fluxo operacional;
- comunicação centralizada via Gateway.

---

## Escopo técnico

O projeto utiliza:

- backend em ASP.NET Core Web API;
- frontend web em React + Vite;
- mobile em Expo + React Native;
- banco de dados MongoDB;
- Docker e Docker Compose;
- autenticação JWT;
- arquitetura em múltiplos serviços;
- API Gateway;
- separação por camadas no backend.

---

## Versão pública para portfólio

Esta versão pública não depende do repositório acadêmico original nem de infraestrutura externa antiga.

Foram removidos:

- módulos não evoluídos;
- documentação de template acadêmico;
- imagens antigas;
- arquivos temporários;
- credenciais antigas;
- URLs antigas de deploy;
- app mobile legado;
- referências a serviços que não fazem parte do MVP.

A proposta desta versão é servir como base limpa para:

- documentação técnica;
- deploy próprio;
- banco de dados próprio;
- geração de APK;
- apresentação em portfólio;
- evolução futura do projeto.