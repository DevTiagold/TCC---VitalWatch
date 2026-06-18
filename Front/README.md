# VitalWatch — Front-end

Interface web PWA para monitoramento de sinais vitais em tempo real, voltada para enfermeiras e pacientes.

## Tecnologias

- **React 19** + **TypeScript**
- **Vite 6** — bundler e dev server
- **React Router 7** — navegação client-side
- **Tailwind CSS 4** — estilização
- **Recharts** — gráficos de sinais vitais
- **Socket.IO Client** — dados em tempo real via WebSocket
- **Lucide React** — ícones
- **Docker + nginx** — containerização e servir o build estático

## Estrutura

```
client/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PatientsPage.tsx
│   │   ├── PatientDetailsPage.tsx
│   │   ├── RegisterPatientPage.tsx
│   │   └── AdminProfilePage.tsx
│   ├── components/
│   │   ├── PatientCard.tsx
│   │   ├── PatientChart.tsx
│   │   ├── VitalMetricCard.tsx
│   │   ├── StatusSummaryCard.tsx
│   │   ├── EventHistory.tsx
│   │   ├── Sidebar.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── BackToDashboard.tsx
│   ├── context/
│   │   ├── AuthContext.tsx    # Estado de autenticação global
│   │   └── ThemeContext.tsx   # Tema claro/escuro
│   ├── routes/
│   │   ├── AppRoutes.tsx      # Definição de rotas
│   │   └── ProtectedRoute.tsx # Guarda de rotas autenticadas
│   ├── services/
│   │   ├── api.ts             # Cliente HTTP com Bearer token
│   │   ├── authService.ts
│   │   └── realtimeService.ts # Conexão Socket.IO
│   └── types/
│       └── vital.ts           # Tipos TypeScript compartilhados
├── index.html
├── vite.config.ts
└── tailwind.config.ts
```

## Rotas da aplicação

| Rota | Componente | Acesso |
|------|-----------|--------|
| `/login` | `Login` | Público |
| `/dashboard` | `DashboardPage` | Autenticado |
| `/pacientes` | `PatientsPage` | Autenticado |
| `/cadastrar-paciente` | `RegisterPatientPage` | Autenticado |
| `/paciente/:id` | `PatientDetailsPage` | Autenticado |
| `/perfil` | `AdminProfilePage` | Autenticado |

Todas as rotas exceto `/login` são protegidas por `ProtectedRoute` — redireciona para `/login` se não houver token válido.

## Comunicação com o back-end

- **REST**: via `apiRequest()` em `services/api.ts`, que anexa automaticamente o Bearer token ao header `Authorization`
- **WebSocket**: via Socket.IO em `services/realtimeService.ts`, escutando o evento `novaMedida` para atualizar gráficos em tempo real

O endereço do back-end é configurado pela variável de ambiente:

```env
VITE_API_URL=http://localhost:3001
```

Se não definida, usa `http://localhost:3001` como padrão.

> **Atenção:** variáveis `VITE_*` são injetadas em tempo de build. Para produção com Docker, o valor precisa ser definido antes do `docker compose up --build`.

## Rodando localmente (sem Docker)

```bash
cd client
npm install
npm run dev
```

Acesse em `http://localhost:5173`.

## Rodando com Docker

Ver o [README geral](../README.md) para subir toda a stack com `docker compose`.
O front-end fica disponível em `http://localhost:80`.
