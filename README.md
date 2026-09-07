# Check In / Check Out Automation

Automatización de check in y check out en Microsoft Teams vía Frida Assistant. Corre automáticamente de lunes a viernes a las 9am y 6pm sin que tengas que hacer nada.

---

## Prerequisitos

### 1. Obtener el TOTP Secret Key

Este es el paso más importante. Necesitas agregar un método de autenticación TOTP a tu cuenta de Microsoft.

1. Ve a https://mysignins.microsoft.com/security-info
2. Click en **Agregar método de inicio de sesión**
3. Selecciona **Aplicación de autenticación** → click en **Agregar**
4. Click en **Quiero usar otra aplicación de autenticación**
5. Click en **Siguiente**
6. Click en **¿No puede escanear la imagen?**
7. Copia la **Clave secreta** — guárdala, la necesitarás más adelante
8. Abre tu app de autenticación (Google Authenticator, Microsoft Authenticator, etc.), escanea el QR o ingresa el código manualmente
9. Click en **Siguiente**
10. Ingresa el código que generó tu app → **Siguiente**

> ⚠️ La clave secreta solo se muestra una vez. Si la pierdes tendrás que eliminar el método y agregarlo de nuevo.

### 2. Crear cuenta de GitHub

1. Ve a https://github.com
2. Click en **Sign up**
3. Regístrate con tu email de Softtek

---

## Instalación

### 3. Hacer fork del repositorio

1. Ve al repositorio: **https://github.com/raulgalindos/checkin-checkout**
2. Click en **Fork** arriba a la derecha
3. Click en **Create fork**

### 4. Agregar tus credenciales

1. En tu fork ve a **Settings → Secrets and variables → Actions**
2. Click en **New repository secret** y agrega estos 3 secrets uno por uno:

| Nombre              | Valor                                                 |
| ------------------- | ----------------------------------------------------- |
| `M365_USERNAME`     | Tu email de Softtek (ej: nombre.apellido@softtek.com) |
| `M365_PASSWORD`     | Tu password de Softtek                                |
| `M365_OTP_SECRET`   | La clave secreta que copiaste en el paso 1            |

### 5. Configurar cron-job.org

El workflow se dispara automáticamente desde cron-job.org. Necesitas crear una cuenta y dos jobs:

1. Ve a https://cron-job.org y crea una cuenta gratis
2. Crea un **Personal Access Token** en GitHub:
   - GitHub → foto de perfil → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
   - Click en **Generate new token (classic)**
   - Selecciona el permiso **`workflow`**
   - Cópialo — solo se muestra una vez
3. En cron-job.org crea dos jobs con esta configuración:

**Job 1 — Check In (9am):**

- URL: `https://api.github.com/repos/TU_USUARIO/checkin-checkout/actions/workflows/checkin-checkout.yml/dispatches`
- Schedule: **Every day at 9:00** con timezone `America/Monterrey`
- Request method: `POST`
- Headers:
  - `Accept: application/vnd.github+json`
  - `Authorization: Bearer TU_TOKEN`
  - `Content-Type: application/json`
- Request body: `{"ref":"main","inputs":{"accion":"checkin"}}`

**Job 2 — Check Out (6pm):**

- Igual que el anterior pero:
- Schedule: **Every day at 18:00**
- Request body: `{"ref":"main","inputs":{"accion":"checkout"}}`

### 6. Habilitar el workflow

1. En tu fork ve a la pestaña **Actions**
2. Click en **I understand my workflows, go ahead and enable them**

---

## ¡Listo!

A partir de ese momento cron-job.org disparará el workflow automáticamente:

- **Lunes a viernes a las 9am** → manda "check in" a Frida
- **Lunes a viernes a las 6pm** → manda "check out" a Frida

No necesitas hacer nada más.

---

## Renovación de contraseña (cada 3 meses)

Softtek obliga a cambiar la contraseña cada 3 meses. Cuando eso pasa, la automatización deja de funcionar hasta que hagas estos dos pasos. No basta con uno solo.

### 1. Actualizar el secret en GitHub

1. En tu fork ve a **Settings → Secrets and variables → Actions**
2. En `M365_PASSWORD` click en **Update**
3. Escribe la contraseña nueva y guarda

Si no actualizas este secret, el workflow falla en el login.

### 2. Volver a iniciar sesión en Frida

Después de cambiar la contraseña, Microsoft cierra las sesiones activas y Frida Assistant deja de responder hasta que vuelvas a entrar manualmente.

1. Abre Microsoft Teams
2. Inicia sesión con tu contraseña nueva
3. Abre el chat de **Frida Assistant** y manda un mensaje cualquiera para confirmar que responde

Si no haces esto, el workflow puede llegar hasta Teams pero el mensaje no se registra.

### 3. Verificar

Dispara el workflow a mano desde la pestaña **Actions** → **Check In / Check Out** → **Run workflow** y confirma que termina en verde.

> El TOTP secret (`M365_OTP_SECRET`) **no** cambia al renovar la contraseña. Solo tendrás que regenerarlo si eliminas el método de autenticación.

---

## Solución de problemas

**El workflow falla con error de login:**

- Verifica que tus secrets estén correctamente escritos en Settings
- Verifica que tu password de Softtek no haya cambiado — si la renovaste, sigue los pasos de [Renovación de contraseña](#renovación-de-contraseña-cada-3-meses)

**El TOTP secret expiró o fue eliminado:**

- Repite el paso 1 para obtener un nuevo secret
- Actualiza el secret `M365_OTP_SECRET` en GitHub Settings

**El mensaje no se registra aunque el workflow termine en verde:**

- Abre Teams a mano y confirma que Frida Assistant responde
- Si acabas de cambiar tu contraseña, vuelve a iniciar sesión en Teams

**El workflow no corre a la hora:**

- Verifica que los jobs de cron-job.org estén habilitados
- Verifica que el Personal Access Token de GitHub no haya expirado
