# Full-Stack TODO App

A TODO app with a React frontend, an Express backend and a MongoDB database. You can create, view, edit and delete TODOs, mark them done or not done, and filter by status.

```
hiring-fullstack-todo/
├── client/   # React + Vite frontend  → see client/README.md
└── server/   # Express + Mongoose API → see server/README.md
```

It's an npm workspaces monorepo, so one `npm install` at the root sets up both apps.

## Quick start

Requires Node.js 20+ and MongoDB, either local or Atlas.

```bash
npm install                       # installs client + server
cp server/.env.example server/.env   # then set MONGODB_URI
npm run dev                       # starts API (:5000) and UI (:5173) together
```

Open http://localhost:5173.

| Command | What it does |
|---------|--------------|
| `npm run dev` | Starts the client and server together |
| `npm run dev:server` / `npm run dev:client` | Starts only one of them |
| `npm test` | Runs the API tests |
| `npm run build` | Creates a production build of the client |

## Tech stack

- **Frontend:** React 19 and Vite, with plain CSS (CSS variables for light/dark themes) and lucide-react icons
- **Backend:** Node.js, Express 5, Mongoose
- **Database:** MongoDB
- **Tests:** node:test, supertest, mongodb-memory-server

See `client/README.md` and `server/README.md` for setup details, the API reference, assumptions and limitations.
