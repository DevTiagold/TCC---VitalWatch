# VitalWatch — Back-end

API REST + WebSocket em tempo real para o sistema de monitoramento de sinais vitais VitalWatch.

## Tecnologias

- **Node.js 22** + **TypeScript**
- **Express 5** — servidor HTTP e rotas REST
- **Socket.IO 4** — comunicação em tempo real (batimentos e oxigenação)
- **Prisma 6** — ORM com suporte a views
- **PostgreSQL / TimescaleDB** — banco de dados de séries temporais
- **JWT** — autenticação stateless
- **bcrypt** — hash de senhas
- **Docker** — containerização

## Estrutura

```
src/
├── server.ts               # Entry point, setup do Express e Socket.IO
├── routes/
│   ├── auth.ts             # /auth/*
│   ├── medidas.ts          # /medidas/*
│   └── infoPaciente.ts     # /infoPaciente/*
├── controllers/
│   ├── AuthController.ts
│   ├── MedidasController.ts
│   └── InfoPacienteController.ts
├── middlewares/
│   └── authMiddleware.ts   # Validação JWT + controle de roles
└── lib/                    # Instância do Prisma client
prisma/
├── schema.prisma           # Modelos e view EstatisticasHorarias
└── ...
```

## Modelos de dados

| Modelo | Descrição |
|--------|-----------|
| `User` | Usuários do sistema (enfermeira ou paciente) |
| `Paciente` | Dados clínicos do paciente, vinculado a um `User` e a uma enfermeira |
| `Medida` | Série temporal de batimentos e oxigenação (tabela TimescaleDB) |
| `EstatisticasHorarias` | View com médias, mínimos e máximos por hora |

## Rotas da API

### Autenticação — `/auth`

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/auth/login` | Público | Login unificado (enfermeira e paciente) |
| POST | `/auth/enfermeiraRegistro` | Público | Cadastro de enfermeira |
| POST | `/auth/pacienteRegistro` | Enfermeira | Cadastro de paciente |
| PUT | `/auth/change-password` | Autenticado | Troca de senha |

### Medidas — `/medidas`

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/medidas/enviarMedidas` | Público | Recebe dados do ESP32 (batimentos + SpO₂) |
| GET | `/medidas/mediaBatimentoHora` | Autenticado | Últimas 7 médias horárias de batimentos |
| GET | `/medidas/mediaOxigenacaoHora` | Autenticado | Últimas 7 médias horárias de oxigenação |

### Paciente — `/infoPaciente`

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/infoPaciente/card/:id` | Autenticado | Dados resumidos do paciente para card |

## WebSocket (Socket.IO)

A conexão exige token JWT no handshake (`socket.handshake.auth.token`).

- Enfermeiras entram automaticamente na sala `enfermeira_<id>`
- Pacientes entram na sala `paciente_<id>`
- Evento emitido pelo servidor: **`novaMedida`** — disparado quando o ESP32 envia novas leituras

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=postgresql://admin:vitalpass@localhost:5432/vitalwatch?schema=public
JWT_SECRET=sua_chave_secreta
PORT=3001
```

> Em Docker, `DATABASE_URL` usa o nome do serviço (`database`) no lugar de `localhost` — já configurado no `docker-compose.yml`.

## Primeiro acesso — criando o cadastro inicial

O banco inicia vazio. A primeira conta (enfermeira) deve ser criada via API antes de logar no front-end.

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

> Atenção: o campo é `senha`, não `password`.

Após criar a conta, acesse `http://localhost` e faça login. Pacientes são cadastrados pela enfermeira dentro da própria aplicação.

## Rodando localmente (sem Docker)

```bash
npm install
npx prisma generate
npm run build
npm start
```

Para desenvolvimento com hot-reload:

```bash
npx ts-node-dev src/server.ts
```

## Rodando com Docker

Ver o [README geral](../README.md) para subir toda a stack com `docker compose`.
