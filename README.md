# TIES — Levantamiento de candados del sobrecalentador

Webapp multiusuario para registrar indicaciones en los candados del sobrecalentador (grilla nivel × panel × candado entre tubos, como en BoilerImage). Todos los inspectores ven los cambios en vivo y la app funciona sin señal dentro de la caldera: lo que se marca queda en el teléfono y se sube solo al recuperar conexión.

## Qué hace
- **Ingreso** con nombre + clave del equipo. Cada indicación guarda quién la marcó y quién la cambió por última vez.
- **Levantamientos**: se crean con nombre, paneles, niveles y tubos (por defecto 25 × 7 × 15 = 14 candados por panel). Se editan en Ajustes.
- **Grilla por nivel** (chips N1…N7 con conteo): tocar el candado → Grieta / Rotura / Desgarro / Otro → se abre la cámara. Rosado = sin foto, rojo = con foto.
- **Detalle**: cambiar tipo, nota (escrita o dictada), fotos (cámara o galería), quitar.
- **Aviso en vivo** cuando otro usuario marca un candado. Arriba se ve el estado: en línea / sin señal / cambios por subir.
- **Lista** de indicaciones por nivel con resumen por tipo.
- **Exportar**: planilla CSV para Excel, lámina PNG por nivel, ZIP con fotos + láminas + planilla (`Nivel N/Pxx Tyy-zz/Nn-Pxx-Tyy-zz_tipo_k.jpg`, igual que BoilerImage).
- Fotos reducidas a ~1600 px con sello opcional (código, tipo, levantamiento, usuario y fecha).

## Puesta en marcha (una sola vez, ~15 min)

### 1. Firebase
1. Entra a https://console.firebase.google.com → **Agregar proyecto** → nombre `ties` (Analytics no es necesario).
2. **Compilación → Authentication → Comenzar → Método de acceso → Anónimo → Habilitar**.
3. **Compilación → Firestore Database → Crear base de datos** → ubicación `southamerica-east1 (São Paulo)` → **modo de producción**.
4. Pestaña **Reglas** → borra lo que hay, pega el contenido de `firestore.rules` → **Publicar**.
5. Pestaña **Datos** → **Iniciar colección** → ID `config` → ID del documento `acceso` → campo `clave` (string) = la clave que le darás al equipo → Guardar.
6. **⚙ Configuración del proyecto → Tus apps → ícono Web `</>`** → apodo `TIES` → Registrar. Copia los valores de `firebaseConfig` y pégalos en `firebase-config.js`.

### 2. GitHub Pages
1. En GitHub crea el repositorio **TIES** (público) y sube todos los archivos de esta carpeta.
2. **Settings → Pages → Build and deployment → Deploy from a branch → main / (root) → Save**.
3. En 1–2 minutos queda en `https://moliveras-ops.github.io/TIES/`.
4. En Firebase: **Authentication → Configuración → Dominios autorizados → Agregar dominio** → `moliveras-ops.github.io`.

### 3. En cada teléfono
Abrir el enlace en Chrome con señal → nombre + clave → menú ⋮ → **Instalar TIES** (o menú de Chrome → Agregar a pantalla principal). Desde ahí funciona sin señal.

## Notas
- Para cambiar la clave basta editar `config/acceso` en Firestore; los que ya entraron siguen dentro.
- Plan gratuito de Firebase (Spark): 1 GB de datos (≈ 3.000 fotos), 50.000 lecturas y 20.000 escrituras por día. Para una parada sobra; si se llena, borrar levantamientos antiguos después de exportar el ZIP.
- Las fotos se guardan dentro de Firestore (no usa Storage, que ahora exige plan de pago).
- Si dos personas cambian la misma indicación al mismo tiempo, queda el último cambio.
- Cerrar sesión con cambios sin subir los pierde: la app avisa antes.
- Al publicar una versión nueva, cambia `CACHE = 'ties-v1'` en `sw.js` (v2, v3…) para que los teléfonos la tomen.

## Archivos
`index.html`, `styles.css`, `app.js` (toda la app), `firebase-config.js` (datos de tu proyecto), `firestore.rules` (reglas de seguridad), `sw.js` (funcionamiento sin señal), `manifest.json` e íconos.
