# Deploy a Cloudflare Pages (gratis)

## 1. Crear API token en Cloudflare
1. Ir a https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Usar template "Cloudflare Pages" → Create
4. Copiar el token generado

## 2. Configurar token en Windows
Ejecutar en terminal (reemplazar YOUR_TOKEN):
```powershell
[Environment]::SetEnvironmentVariable("CLOUDFLARE_API_TOKEN", "YOUR_TOKEN", "User")
```

## 3. Deploy
```bash
npx wrangler pages deploy dist --project-name rugby-orcos
```

La primera vez te preguntará si querés crear el proyecto. Decí "yes".

## 4. Dominio
Cloudflare te da un dominio gratis: `rugby-orcos.pages.dev`

---

## Alternativa: GitHub + Cloudflare Pages (recomendado)
1. Subir el código a GitHub
2. Ir a https://dash.cloudflare.com → Workers & Pages → Create
3. Conectar repositorio de GitHub
4. Build command: `npm run build`
5. Build output: `dist`
6. Click "Save and Deploy"

Cada push a main hace deploy automático. Grtauito.
