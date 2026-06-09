# KFC Listen 🍗
## Guía de despliegue paso a paso — Netlify + Supabase (100% gratis)

---

## ¿Qué vas a necesitar?
- Una cuenta en **GitHub** (gratis) → github.com
- Una cuenta en **Supabase** (gratis) → supabase.com
- Una cuenta en **Netlify** (gratis) → netlify.com
- Una clave de la **API de Claude** → console.anthropic.com

Todo esto es gratuito. Solo la API de Claude tiene un costo muy bajo (~8 USD/mes con uso normal).

---

## PASO 1 — Crear el proyecto en Supabase (base de datos)

1. Ir a **supabase.com** → Create account → Sign up with Google

2. Hacer clic en **"New project"**
   - Organization: tu nombre o KFC Colombia
   - Name: `kfc-listen`
   - Database Password: inventar una contraseña segura y guardarla
   - Region: **South America (São Paulo)**
   - Hacer clic en **"Create new project"** (tarda ~2 minutos)

3. Cuando esté listo, ir al menú izquierdo → **SQL Editor**

4. Hacer clic en **"New query"**

5. **Copiar todo el contenido del archivo `supabase_setup.sql`** y pegarlo en el editor

6. Hacer clic en **"Run"** (botón verde)
   - Debe decir "Success. No rows returned"
   - Esto crea las tablas donde se guardarán las respuestas

7. Ahora ir a **Settings** (ícono de engranaje) → **API**

8. Copiar y guardar estos dos valores (los necesitas después):
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** key → una cadena larga que empieza con `eyJ...`

---

## PASO 2 — Subir el código a GitHub

1. Ir a **github.com** → Sign in o crear cuenta

2. Hacer clic en **"New repository"** (botón verde)
   - Repository name: `kfc-listen`
   - Visibility: **Private** (importante, para que el código sea privado)
   - Hacer clic en **"Create repository"**

3. En tu computador, descomprimir el ZIP que descargaste

4. Abrir la carpeta `kfc-listen-netlify` en la terminal o símbolo del sistema

5. Ejecutar estos comandos uno por uno:
```
git init
git add .
git commit -m "KFC Listen - versión inicial"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/kfc-listen.git
git push -u origin main
```
   (Cambiar TU-USUARIO por tu nombre de usuario de GitHub)

---

## PASO 3 — Desplegar en Netlify

1. Ir a **netlify.com** → Sign up with GitHub

2. Hacer clic en **"Add new site"** → **"Import an existing project"**

3. Seleccionar **"Deploy with GitHub"**

4. Autorizar a Netlify a acceder a tu GitHub

5. Buscar y seleccionar el repositorio **kfc-listen**

6. Configuración del despliegue:
   - Branch to deploy: `main`
   - Build command: `npm run build`
   - Publish directory: `dist`

7. Antes de hacer clic en Deploy, ir a **"Environment variables"** y agregar:

   | Variable | Valor |
   |----------|-------|
   | `VITE_SUPABASE_URL` | La URL que copiaste de Supabase (paso 1.8) |
   | `VITE_SUPABASE_ANON_KEY` | La anon key que copiaste de Supabase (paso 1.8) |
   | `VITE_ANTHROPIC_KEY` | Tu clave de Claude (console.anthropic.com) |

8. Hacer clic en **"Deploy site"**
   - Netlify construirá y publicará la app (tarda ~2 minutos)

9. Cuando termine verás una URL como: `https://kfc-listen-abc123.netlify.app`
   - Puedes cambiarla en Site settings → Domain management → Custom domain

---

## PASO 4 — Crear usuarios del dashboard en Supabase

Los usuarios que acceden al dashboard (RRHH) se crean desde Supabase:

1. En Supabase, ir a **Authentication** → **Users**

2. Hacer clic en **"Add user"** → **"Create new user"**

3. Ingresar el email y contraseña del miembro de RRHH

4. Repetir para cada persona del equipo que necesite acceso

Los colaboradores **NO necesitan cuenta** — simplemente abren el link de la encuesta.

---

## PASO 5 — Compartir con los colaboradores

- **Encuesta:** `https://tu-sitio.netlify.app/`
  → Compartir este link por WhatsApp o email a todos los colaboradores

- **Dashboard:** `https://tu-sitio.netlify.app/dashboard`
  → Solo para el equipo de RRHH (requiere login)

---

## ¿Cómo actualizar el código en el futuro?

Cualquier cambio que hagas en los archivos y subas a GitHub se despliega
automáticamente en Netlify en ~2 minutos. No necesitas hacer nada más.

```
git add .
git commit -m "descripción del cambio"
git push
```

---

## ¿Dónde se guardan las respuestas?

En **Supabase → Table Editor → responses**

Puedes ver todas las respuestas en tiempo real desde Supabase.
También puedes exportarlas como CSV: Table Editor → responses → botón Export.

---

## Plan gratuito — ¿cuánto aguanta?

| Servicio | Límite gratis | ¿Suficiente? |
|----------|--------------|--------------|
| Supabase | 500 MB, 50.000 filas | Sí para ~2.000 encuestas |
| Netlify | 100 GB bandwidth/mes | Sí para miles de usuarios |
| Claude API | Pago por uso | ~8-15 USD/mes con uso normal |

---

## ¿Necesitas ayuda?

- Errores de Supabase: revisar **Supabase → Logs → API**
- Errores de Netlify: revisar **Netlify → Deploys → log del deploy**
- Errores de la app: abrir el navegador → F12 → Console
