# SIGA Mobile

Esta pasta contém o aplicativo mobile do projeto **SIGA — Sistema de Gestão e Rastreio de Entregas**.

O app foi desenvolvido com **Expo + React Native** e consome as APIs do backend por meio do **SIGA.Gateway**.

Esta versão pública foi preparada para portfólio e está configurada para funcionar com ambiente próprio, API Gateway próprio e banco de dados próprio.

---

## Tecnologias utilizadas

- Expo
- React Native
- JavaScript
- React Navigation
- Async Storage
- Fetch API
- JWT Authentication
- EAS Build
- Integração com API Gateway

---

## Objetivo do app

O aplicativo mobile foi criado para complementar o sistema web, oferecendo uma experiência voltada principalmente para o uso operacional.

O foco do app é permitir que operadores e entregadores acompanhem encomendas, consultem detalhes e atualizem status conforme suas permissões.

---

## Principais funcionalidades

O app mobile implementa os seguintes fluxos:

- login de usuário;
- cadastro de empresa;
- navegação por perfil;
- visualização de encomendas;
- detalhes da entrega;
- acompanhamento do histórico de eventos;
- fluxo do operador;
- fluxo do entregador;
- atualização de status permitida por perfil;
- edição de perfil;
- logout.

---

## Perfis utilizados

O app trabalha com os principais perfis do sistema:

```txt
company_operator
courier
```

O perfil `company_operator` representa o operador da empresa.

O perfil `courier` representa o entregador responsável por entregas atribuídas.

---

## Integração com backend

O aplicativo consome o backend por meio da variável de ambiente:

```env
EXPO_PUBLIC_API_BASE_URL=https://sua-api-gateway.onrender.com
```

Em ambiente local, essa URL pode ser alterada para o endereço local do Gateway.

Exemplo:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000
```

Em testes com celular físico, normalmente é necessário usar o IP local da máquina em vez de `localhost`.

Exemplo:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.100:5000
```

No deploy próprio, essa variável deve apontar para a URL pública do Gateway.

---

## Configuração de ambiente

Crie um arquivo `.env` nesta pasta com base no arquivo:

```txt
.env.example
```

Exemplo:

```env
EXPO_PUBLIC_API_BASE_URL=https://sua-api-gateway.onrender.com
```

Este repositório não contém URLs ou credenciais reais de produção.

---

## Como rodar localmente

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

O Expo abrirá opções para executar o app em:

- Android Emulator;
- iOS Simulator;
- Expo Go;
- dispositivo físico;
- navegador, se aplicável.

---

## Validação do ambiente Expo

Para verificar se o ambiente está configurado corretamente:

```bash
npx expo-doctor
```

Durante a preparação da versão pública, o app foi validado com sucesso usando este comando.

Resultado obtido:

```txt
18/18 checks passed. No issues detected.
```

---

## Versão do Expo

Durante a preparação da versão pública, foi utilizada a versão:

```txt
Expo 54.0.25
```

---

## Estrutura geral

```txt
SIGA.Mobile
│
├── src
│   ├── api
│   ├── components
│   ├── config
│   ├── constants
│   ├── contexts
│   ├── navigation
│   ├── screens
│   ├── services
│   └── utils
│
├── .env.example
├── app.json
├── eas.json
├── package.json
└── README.md
```

---

## Organização das telas

A estrutura do app é organizada por contexto de uso:

```txt
screens
│
├── public
├── operator
├── courier
└── shared
```

### public

Telas públicas ou de acesso inicial.

Exemplos:

- Login;
- Cadastro de empresa.

### operator

Telas voltadas ao operador da empresa.

Exemplos:

- visualização de encomendas;
- cadastro/acompanhamento operacional;
- gestão relacionada à empresa.

### courier

Telas voltadas ao entregador.

Exemplos:

- entregas atribuídas;
- detalhes da entrega;
- atualização de status permitida.

### shared

Telas ou componentes reutilizados por mais de um perfil.

---

## Regras de status

O app respeita as regras de transição de status definidas no backend.

Fluxo principal:

```txt
CREATED → POSTED → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
```

Também existe suporte para cancelamento antes de status final:

```txt
CANCELED
```

Regras principais:

- o app exibe apenas ações permitidas para o perfil logado;
- entregadores só podem atualizar entregas atribuídas a eles;
- entregas finalizadas não podem ser alteradas;
- o backend continua sendo a fonte final de validação das regras.

---

## Build com EAS

O projeto está preparado para geração de build com EAS.

Para verificar a configuração:

```bash
eas build:configure
```

Para gerar APK de preview:

```bash
eas build -p android --profile preview
```

O arquivo `eas.json` possui um perfil de preview configurado para gerar APK Android.

Antes de gerar uma build pública, atualize a variável:

```env
EXPO_PUBLIC_API_BASE_URL
```

para apontar para o seu Gateway próprio.

---

## Observações sobre esta versão

Esta versão pública foi limpa para portfólio.

Foram removidos:

- app mobile legado;
- telas temporárias;
- placeholders antigos;
- URLs antigas de deploy;
- referências ao ambiente acadêmico original.

O app atual está preparado para ser conectado a um backend próprio e a um deploy próprio.

---

## Próximas melhorias planejadas

- gerar APK atualizado;
- publicar release no GitHub;
- atualizar README com link do APK;
- adicionar prints reais das telas mobile;
- melhorar documentação dos fluxos por perfil;
- revisar vulnerabilidades moderadas de dependências;
- expandir validações de UX;
- melhorar tratamento de erro e feedback visual.
