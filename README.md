# Pultrum — Frontend

Operator console for the **Pultrum** transport-order automation platform: a triage
inbox, an orders datagrid, a detailed order view (with timeline, confidence, XML
preview), and a settings area (mailboxes, AI, automation, integrations).

Talks to the `pultrum-mail-processor` backend through a server-side proxy, so the
browser only ever calls same-origin `/api/*`.

Part of the **Pultrum** platform by **RenovoIA**.

## Stack

- **Next.js 16** (App Router) · **React 19**
- **Tailwind CSS 4** + **Base UI** components
- **next-intl** (EN / PT / NL)
- **TanStack Query** (data fetching) · **Axios**

## Local development

```bash
cp .env.example .env          # set NEXT_PUBLIC_API_URL to your backend
npm install
npm run dev                   # http://localhost:3001
```

> Make sure the backend API is running first. `NEXT_PUBLIC_API_URL` points the
> built-in `/api` proxy at it (read server-side, never exposed to the client).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Lint |

## Configuration

Single environment variable — see [`.env.example`](.env.example):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API the `/api` proxy forwards to |

## Deployment

Container/VPS deployment is documented in **[DEPLOY.md](DEPLOY.md)**. Vercel is also
a one-click option (set `NEXT_PUBLIC_API_URL` in the project env).

## License

[MIT](LICENSE) © RenovoIA.
