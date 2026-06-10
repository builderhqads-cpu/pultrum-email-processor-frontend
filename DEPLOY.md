# Deploy — Pultrum Frontend

The frontend is a Next.js app with a server-side proxy, so it needs a Node runtime
(not a static export). Two supported options:

---

## Option A — Vercel (simplest)

1. Import the GitHub repo into Vercel.
2. Set the environment variable `NEXT_PUBLIC_API_URL` = `https://api.seudominio.com`.
3. Deploy. Vercel handles build, HTTPS and the domain.

> The backend's `CORS_ORIGINS` isn't needed for normal use because the browser
> only calls the same-origin `/api` proxy — but set it if you add direct calls.

---

## Option B — Same VPS as the backend (Docker)

Runs the app in a container and proxies it through the **same Nginx** that already
serves the backend (so both share ports 80/443 and the TLS certificate).

### 1. Push to GitHub (from your machine)

```bash
cd pultrum-frontend
git add .
git commit -m "Prepare frontend for deployment"
git push
```

### 2. On the VPS

```bash
git clone git@github.com:<org>/pultrum-email-processor-frontend.git
cd pultrum-email-processor-frontend
cp .env.example .env
nano .env            # NEXT_PUBLIC_API_URL=https://api.seudominio.com

docker compose -f docker-compose.prod.yml up -d --build
```

This publishes the app on **host port 3001**.

### 3. Add an Nginx server block (in the backend's nginx config)

Point your app domain (e.g. `app.seudominio.com`) at the container. Add a file
`nginx/conf.d/frontend.conf` in the **backend** project and issue a certificate for
the app domain the same way (`certbot certonly`). `172.17.0.1` is the Docker host
gateway as seen from the Nginx container.

```nginx
server {
    listen 80;
    server_name app.seudominio.com;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl;
    server_name app.seudominio.com;

    ssl_certificate     /etc/letsencrypt/live/app.seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.seudominio.com/privkey.pem;

    location / {
        proxy_pass http://172.17.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
    }
}
```

Reload Nginx: `docker compose -f docker-compose.prod.yml exec nginx nginx -s reload`.

### Updates

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```
