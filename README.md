# VitalWatch — Visão Geral

Sistema de monitoramento de sinais vitais em tempo real composto por três camadas: dispositivo embarcado (ESP32-S2), back-end e front-end web.

## Arquitetura

```
┌─────────────────────┐        HTTP POST        ┌──────────────────────┐
│   ESP32-S2 + MAX30102│ ─────────────────────► │  Back-end (Node.js)  │
│  (firmware PlatformIO)│                        │  Express + Socket.IO │
└─────────────────────┘                         │  Porta 3001          │
                                                 └──────────┬───────────┘
                                                            │  WebSocket
                                                            │  (novaMedida)
┌─────────────────────┐        REST + WS        ┌──────────▼───────────┐
│  Navegador / PWA    │ ◄─────────────────────► │  Front-end (React)   │
│  http://localhost   │                        │  Vite + Nginx         │
└─────────────────────┘                         │  Porta 80            │
                                                 └──────────────────────┘
                                                            │
                                                 ┌──────────▼───────────┐
                                                 │  TimescaleDB         │
                                                 │  PostgreSQL          │
                                                 │  Porta 5432          │
                                                 └──────────────────────┘
```

### Fluxo de dados

1. O **ESP32-S2** lê batimentos cardíacos e SpO₂ via sensor MAX30102
2. Envia os dados via HTTP POST para `/medidas/enviarMedidas`
3. O **back-end** salva no banco e emite o evento `novaMedida` via Socket.IO
4. O **front-end** recebe o evento em tempo real e atualiza os gráficos

## Estrutura de pastas

```
Aplicação/
├── docker-compose.yml             # Orquestração de todos os serviços
├── Back-end_VitalWatch-develop/   # API Node.js + TypeScript
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   ├── .env                       # Variáveis de ambiente (não versionar)
│   └── README.md
└── Front/                         # Interface React
    ├── client/
    ├── Dockerfile
    ├── nginx.conf
    └── README.md
```

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em execução

## Subindo toda a stack com Docker

```bash
cd Aplicação
docker compose up --build -d
```

Serviços disponíveis após o comando:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Front-end | http://localhost | Interface web |
| Back-end | http://localhost:3001 | API REST + WebSocket |
| Banco de dados | localhost:5432 | PostgreSQL/TimescaleDB |

### Parar os serviços

```bash
docker compose down
```

### Parar e remover os dados do banco

```bash
docker compose down -v
```

### Ver logs em tempo real

```bash
# Todos os serviços
docker compose logs -f

# Apenas o back-end
docker compose logs -f app

# Apenas o banco
docker compose logs -f database
```

### Recompilar após alterações no código

```bash
docker compose up --build -d
```

## Variáveis de ambiente

O arquivo `.env` deve existir em `Aplicação/Back-end_VitalWatch-develop/` antes de subir os containers:

```env
JWT_SECRET=sua_chave_secreta
```

As demais variáveis (`DATABASE_URL`, `PORT`) já estão definidas no `docker-compose.yml`.

## Rodando sem Docker (desenvolvimento)

Requer Node.js 20+ e PostgreSQL local ou via Docker.

**Terminal 1 — Banco de dados:**
```bash
cd Aplicação
docker compose up -d database
```

**Terminal 2 — Back-end:**
```bash
cd Aplicação/Back-end_VitalWatch-develop
npm install
npx prisma generate
npx ts-node-dev src/server.ts
```

**Terminal 3 — Front-end:**
```bash
cd Aplicação/Front/client
npm install
npm run dev
```

Acesse em `http://localhost:5173`.

## Primeiro acesso — criando o cadastro inicial

O banco de dados começa vazio. Antes de logar no front-end, é necessário criar a primeira conta de enfermeira via API.

Com os containers rodando, execute no terminal:

**PowerShell (Windows):**
```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/auth/enfermeiraRegistro" `
  -ContentType "application/json" `
  -Body '{"email": "enfermeira@vitalwatch.com", "senha": "senha123", "nome": "Admin"}'
```

**bash / curl:**
```bash
curl -X POST http://localhost:3001/auth/enfermeiraRegistro \
  -H "Content-Type: application/json" \
  -d '{"email": "enfermeira@vitalwatch.com", "senha": "senha123", "nome": "Admin"}'
```

> Use os valores que quiser para `email`, `senha` e `nome`.

Após o cadastro, acesse `http://localhost` e faça login com as credenciais criadas.

Pacientes são cadastrados **dentro da própria aplicação** pela enfermeira logada, na tela "Cadastrar Paciente".

## Documentação por camada

- [Back-end](Back-end_VitalWatch-develop/README.md) — rotas, modelos, WebSocket
- [Front-end](Front/README.md) — páginas, componentes, autenticação
