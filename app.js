// TIES — levantamiento de candados del sobrecalentador, multiusuario (Firebase)
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, updateDoc, getDocs, onSnapshot,
  query, orderBy, increment, writeBatch
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const VERSION = '1.1';
const TIPOS = ['Grieta', 'Rotura', 'Desgarro', 'Otro'];

// ---------- íconos Material (Apache 2.0) ----------
const IC = {
  atras: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  mas: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
  cerrar: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  agregar: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  lista: 'M3 5v14h18V5H3zm4 2v2H5V7h2zm-2 6v-2h2v2H5zm0 2h2v2H5v-2zm14 2H9v-2h10v2zm0-4H9v-2h10v2zm0-4H9V7h10v2z',
  grilla: 'M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z',
  lamina: 'M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86-3 3.87L9 13.14 6 17h12l-3.86-5.14z',
  compartir: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z',
  ajustes: 'M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z',
  editar: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  camara: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
  galeria: 'M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4 2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z',
  mic: 'M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z',
  borrar: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  bajar: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  planilla: 'M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z',
  zip: 'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5 6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z',
  instalar: 'M17 1.01 7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14zm-1-6h-3V8h-2v5H8l4 4 4-4z',
  salir: 'M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z'
};
const ic = (n, s = 24) => `<svg class="ic" viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><path d="${IC[n]}"/></svg>`;

// ---------- utilidades ----------
const $ = s => document.querySelector(s);
const app = $('#app');
const pad = n => String(n).padStart(2, '0');
const range = n => Array.from({ length: Math.max(0, n) }, (_, i) => i + 1);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const limpio = s => String(s).replace(/[\\/:*?"<>|]/g, '-').trim();
const ls = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } }
};
const fecha = t => { if (!t) return ''; const d = new Date(t); return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}${pad(d.getMinutes())}`; };
// candado c = entre los tubos c y c+1
const key = (n, p, c) => `N${n}-P${pad(p)}-C${pad(c)}`;
const codigo = x => `N${x.n}-P${pad(x.p)}-T${pad(x.c)}-${pad(x.c + 1)}`;
const tipoTxt = x => x.k === 'Otro' && x.o ? x.o : x.k;
const ini = x => (x.k || '?')[0];
const ordenar = (a, b) => a.n - b.n || a.p - b.p || a.c - b.c;
const errEsc = e => toast('No se guardó: ' + (e.code || e.message));

let tToast;
function toast(msg, ms = 2600) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('ver');
  clearTimeout(tToast); tToast = setTimeout(() => t.classList.remove('ver'), ms);
}

// ---------- configuración ----------
if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('PEGA')) {
  app.innerHTML = `<div class="card"><h2>Falta configurar Firebase</h2>
    <p>Pega los datos de tu proyecto en <b>firebase-config.js</b> (pasos en el README).</p></div>`;
  throw new Error('Sin configuración de Firebase');
}
const fb = initializeApp(firebaseConfig);
const auth = getAuth(fb);
const db = initializeFirestore(fb, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });

const levRef = id => doc(db, 'levantamientos', id);
const indCol = () => collection(db, 'levantamientos', S.lev.id, 'indicaciones');
const indRef = k => doc(db, 'levantamientos', S.lev.id, 'indicaciones', k);
const fotosCol = k => collection(db, 'levantamientos', S.lev.id, 'indicaciones', k, 'fotos');

const S = {
  uid: null, nombre: ls.get('ties_nombre', ''), levs: [], lev: null, levId: ls.get('ties_lev', null),
  nivel: 1, inds: new Map(), pend: 0, vista: 'grilla', filtroN: 0, primera: true,
  detalle: null, fotos: [], notaSucia: false, camK: null, ingresando: false, instalar: null, panel: null
};
$('#atras').innerHTML = ic('atras', 28);
$('#menuBtn').innerHTML = ic('mas', 28);

// ---------- navegación con el botón Atrás de Android ----------
function guardia() { if (!history.state?.ties) history.pushState({ ties: 1 }, ''); }
addEventListener('popstate', () => {
  if (!$('#visor').hidden) cerrarVisor();
  else if (!$('#modal').hidden) cerrarModal();
  else if (S.lev) cerrarLev();
  else return;
  guardia();
});

// ---------- estado de conexión ----------
function estado() {
  const e = $('#estado'), on = navigator.onLine;
  e.className = on ? (S.pend ? 'pend' : 'on') : 'off';
  e.textContent = on ? (S.pend ? `⏳ subiendo ${S.pend}` : '● en línea') : `○ sin señal${S.pend ? ' · ' + S.pend + ' por subir' : ''}`;
}
addEventListener('online', () => { estado(); toast('Con señal: sincronizando'); });
addEventListener('offline', () => { estado(); toast('Sin señal: los cambios quedan guardados en el teléfono'); });
addEventListener('beforeinstallprompt', e => { e.preventDefault(); S.instalar = e; });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });

function titulo(t) { $('#titulo').textContent = t; $('#atras').hidden = !S.lev; }
$('#atras').onclick = () => cerrarLev();
$('#menuBtn').onclick = () => menu();

// ---------- hojas (diálogos) ----------
function hoja(html, onClose) {
  const m = $('#modal'); guardia();
  m.innerHTML = `<div class="hoja">${html}</div>`; m.hidden = false;
  m.onclick = e => { if (e.target === m) cerrarModal(); };
  m.querySelectorAll('[data-x]').forEach(b => b.onclick = cerrarModal);
  S.onClose = onClose;
  return m.firstChild;
}
function cerrarModal() {
  const m = $('#modal'); if (m.hidden) return;
  const f = S.onClose; S.onClose = null; f?.();
  m.hidden = true; m.innerHTML = '';
}

// ---------- ingreso ----------
onAuthStateChanged(auth, u => {
  if (S.ingresando) return;
  S.uid = u?.uid || null;
  if (!u || ls.get('ties_miembro', null) !== u.uid) return pantallaIngreso();
  inicio();
});

function pantallaIngreso(err = '') {
  detenerTodo(); S.lev = null; titulo('TIES');
  app.innerHTML = `<div class="card ingreso">
    <img src="icon.svg" class="logo" alt="">
    <h2>Levantamiento de candados</h2>
    <p class="sub">Sobrecalentador · trabajo en equipo</p>
    <label>Tu nombre<input id="iNom" value="${esc(S.nombre)}" autocomplete="name" placeholder="Ej. M. Oliveras"></label>
    <label>Clave del equipo<input id="iClave" type="password" placeholder="La entrega el coordinador"></label>
    <p class="err">${esc(err)}</p>
    <button class="btn pri" id="bIng">Entrar</button>
    <p class="nota">La primera vez se necesita internet. Después funciona sin señal.</p></div>`;
  $('#bIng').onclick = async () => {
    const nombre = $('#iNom').value.trim(), clave = $('#iClave').value.trim();
    S.nombre = nombre;
    if (!nombre || !clave) return pantallaIngreso('Escribe tu nombre y la clave.');
    if (!navigator.onLine) return pantallaIngreso('Para entrar la primera vez se necesita señal.');
    const b = $('#bIng'); b.disabled = true; b.textContent = 'Entrando…';
    S.ingresando = true;
    try {
      const user = auth.currentUser || (await signInAnonymously(auth)).user;
      await setDoc(doc(db, 'miembros', user.uid), { nombre, clave, t: Date.now() });
      ls.set('ties_nombre', nombre); ls.set('ties_miembro', user.uid);
      S.uid = user.uid; S.ingresando = false;
      inicio();
    } catch (e) {
      S.ingresando = false;
      pantallaIngreso(e.code === 'permission-denied' ? 'Clave incorrecta.' : 'No se pudo entrar: ' + (e.code || e.message));
    }
  };
}

function detenerTodo() {
  S.unsubLevs?.(); S.unsubLevs = null;
  S.unsubInds?.(); S.unsubInds = null;
  cerrarModal();
}

// ---------- levantamientos ----------
function inicio() {
  detenerTodo(); estado();
  S.unsubLevs = onSnapshot(query(collection(db, 'levantamientos'), orderBy('c', 'desc')), snap => {
    S.levs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (S.lev) {
      const l = S.levs.find(x => x.id === S.lev.id);
      if (!l) { toast('El levantamiento fue eliminado'); return cerrarLev(); }
      const cambio = l.p !== S.lev.p || l.n !== S.lev.n || l.t !== S.lev.t || l.nombre !== S.lev.nombre;
      S.lev = l; titulo(l.nombre); if (cambio) render();
    } else if (S.levId && S.levs.some(x => x.id === S.levId)) abrirLev(S.levId);
    else home();
  }, e => toast('Error: ' + (e.code || e.message), 6000));
}

function home() {
  S.lev = null; titulo('TIES');
  app.innerHTML = `<div class="hola">Hola, <b>${esc(S.nombre)}</b></div>
    <button class="btn pri" id="bNuevo">${ic('agregar')}Nuevo levantamiento</button>
    <h3>Levantamientos</h3>
    ${S.levs.length ? S.levs.map(l => `<button class="item" data-id="${l.id}"><b>${esc(l.nombre)}</b>
      <span>${l.p} paneles · ${l.n} niveles · ${l.t} tubos</span>
      <small>Creado por ${esc(l.u)} · ${fecha(l.c)}</small></button>`).join('')
      : '<p class="vacio">Aún no hay levantamientos. Crea uno para empezar.</p>'}`;
  $('#bNuevo').onclick = nuevoLev;
  app.querySelectorAll('[data-id]').forEach(b => b.onclick = () => abrirLev(b.dataset.id));
}

const num = (id, min, max) => { const v = parseInt($(id).value, 10); return v >= min && v <= max ? v : null; };

function nuevoLev() {
  const d = ls.get('ties_dim', { p: 25, n: 7, t: 15 });
  hoja(`<h3>Nuevo levantamiento</h3>
    <label>Nombre<input id="fNom" value="Sobrecalentador PGP ${new Date().getFullYear()}"></label>
    <div class="fila3">
      <label>Paneles<input id="fP" type="number" inputmode="numeric" value="${d.p}"></label>
      <label>Niveles<input id="fN" type="number" inputmode="numeric" value="${d.n}"></label>
      <label>Tubos<input id="fT" type="number" inputmode="numeric" value="${d.t}"></label>
    </div>
    <p class="nota">Un candado entre cada par de tubos (15 tubos = 14 candados por panel). Se puede cambiar después en Ajustes.</p>
    <div class="acciones"><button class="btn" data-x>Cancelar</button><button class="btn pri" id="fOk">Crear</button></div>`);
  $('#fOk').onclick = () => {
    const nombre = $('#fNom').value.trim(), p = num('#fP', 1, 200), n = num('#fN', 1, 30), t = num('#fT', 2, 100);
    if (!nombre || !p || !n || !t) return toast('Revisa el nombre y las cantidades');
    ls.set('ties_dim', { p, n, t });
    const ref = doc(collection(db, 'levantamientos'));
    S.levId = ref.id; ls.set('ties_lev', ref.id);
    setDoc(ref, { nombre, p, n, t, c: Date.now(), u: S.nombre, uid: S.uid }).catch(errEsc);
    cerrarModal();
  };
}

function abrirLev(id) {
  const l = S.levs.find(x => x.id === id); if (!l) return;
  guardia();
  S.lev = l; S.levId = id; ls.set('ties_lev', id);
  S.nivel = Math.min(ls.get('ties_nivel_' + id, 1), l.n);
  S.inds = new Map(); S.primera = true; S.vista = 'grilla'; S.filtroN = 0;
  titulo(l.nombre);
  S.unsubInds?.();
  S.unsubInds = onSnapshot(indCol(), { includeMetadataChanges: true }, snap => {
    const m = new Map(); let pend = 0;
    snap.docs.forEach(d => { m.set(d.id, { id: d.id, ...d.data() }); if (d.metadata.hasPendingWrites) pend++; });
    if (!S.primera) snap.docChanges().forEach(ch => {
      const x = ch.doc.data();
      if (ch.type === 'added' && !ch.doc.metadata.hasPendingWrites && x.uid !== S.uid) toast(`${x.u} marcó ${codigo(x)}`);
    });
    if (!snap.metadata.fromCache) S.primera = false;
    S.inds = m; S.pend = pend; estado();
    render();
    if (S.detalle) refrescarDetalle();
    if (S.panel) pintarPanel();
  }, e => toast('Error: ' + (e.code || e.message), 6000));
  render();
}

function cerrarLev() {
  S.unsubInds?.(); S.unsubInds = null; cerrarModal();
  S.lev = null; S.levId = null; ls.set('ties_lev', null); S.pend = 0; estado();
  home();
}

// ---------- pantalla del levantamiento ----------
function render() {
  if (!S.lev) return;
  S.nivel = Math.min(Math.max(1, S.nivel), S.lev.n);
  const w = $('#gwrap'), sx = w?.scrollLeft || 0, wy = window.scrollY;
  app.innerHTML = (S.vista === 'lista' ? vistaLista() : vistaGrilla()) + barraInferior();
  const w2 = $('#gwrap'); if (w2) w2.scrollLeft = sx;
  const ch = $('.niveles .chip.on'), fila = ch?.parentElement;
  if (ch) fila.scrollLeft += ch.getBoundingClientRect().left - fila.getBoundingClientRect().left - (fila.clientWidth - ch.offsetWidth) / 2;
  window.scrollTo(0, wy);
  conectar();
}

function conteoNiveles() {
  const c = {}; for (const x of S.inds.values()) c[x.n] = (c[x.n] || 0) + 1; return c;
}

// ---------- dibujo de tubos y candados (igual que BoilerImage) ----------
// unidades: etiqueta L, un tubo cada u, alto de fila rh; el candado c va entre los tubos c y c+1
const G = { L: 34, u: 20, rh: 34, top: 14 };
const SVG_CSS = '.tb{fill:#dfe6ee;stroke:#93a3b4;stroke-width:1.1}.tbi{fill:#fff}' +
  '.cv{fill:#fff;stroke:#93a3b4;stroke-width:1}.ci{fill:#F48FB1;stroke:#c2185b;stroke-width:1}.cf{fill:#D32F2F;stroke:#8e1b1b;stroke-width:1}' +
  'text{font-family:system-ui,Roboto,Arial,sans-serif;text-anchor:middle;dominant-baseline:central}' +
  '.ti,.tf{font-size:8.5px;font-weight:700}.ti{fill:#5a0d26}.tf{fill:#fff}' +
  '.pl{font-size:10.5px;font-weight:700;fill:#33475b;text-anchor:start}.pl.r{fill:#D32F2F}.tn{font-size:7px;fill:#7b8a99}';

function filaSVG(n, p, y, L) {
  const { u, rh } = G, t = S.lev.t, my = y + rh / 2;
  let s = '';
  for (let i = 1; i <= t; i++) {
    const cx = L + (i - 0.5) * u;
    s += `<rect x="${cx - 5.5}" y="${y + 3}" width="11" height="${rh - 6}" rx="5.5" class="tb"/><rect x="${cx - 1.5}" y="${y + 8}" width="3" height="${rh - 16}" rx="1.5" class="tbi"/>`;
  }
  for (let c = 1; c < t; c++) {
    const cx = L + c * u, x = S.inds.get(key(n, p, c));
    s += x
      ? `<rect x="${cx - 7.5}" y="${my - 6.5}" width="15" height="13" rx="2.5" class="${x.nf > 0 ? 'cf' : 'ci'}"/><text x="${cx}" y="${my + 0.5}" class="${x.nf > 0 ? 'tf' : 'ti'}">${esc(ini(x))}</text>`
      : `<rect x="${cx - 6.5}" y="${my - 4}" width="13" height="8" rx="2" class="cv"/>`;
  }
  return s;
}

const numerosTubo = (L, y, todos) => {
  const t = S.lev.t, paso = todos ? 1 : t > 30 ? 5 : t > 16 ? 2 : 1;
  return range(t).filter(i => i === 1 || i % paso === 0).map(i => `<text x="${L + (i - 0.5) * G.u}" y="${y}" class="tn">${i}</text>`).join('');
};
const panelCon = (n, p) => range(S.lev.t - 1).some(c => S.inds.has(key(n, p, c)));

// nivel completo: se usa en pantalla y en la lámina (w, h = tamaño en px para la lámina)
function svgNivel(n, w, h) {
  const l = S.lev, { L, u, rh, top } = G, W = L + l.t * u, H = top + l.p * rh;
  let s = numerosTubo(L, top / 2);
  for (let p = 1; p <= l.p; p++) {
    const y = top + (p - 1) * rh;
    s += `<text x="2" y="${y + rh / 2}" class="pl${panelCon(n, p) ? ' r' : ''}">P${pad(p)}</text>` + filaSVG(n, p, y, L);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"${w ? ` width="${w}" height="${h}"` : ''}><style>${SVG_CSS}</style>${s}</svg>`;
}

// candado bajo el dedo (null = fuera de la fila)
function puntoSVG(e, el, L, ancho) {
  const r = el.getBoundingClientRect(), k = ancho / r.width;
  const xu = (e.clientX - r.left) * k, yu = (e.clientY - r.top) * k - G.top;
  return { xu, p: Math.floor(yu / G.rh) + 1, c: Math.round((xu - L) / G.u), yu };
}

function cabNivel(sub, chips) {
  return `<div class="cabniv"><div class="ctit">${sub}</div><div class="niveles">${chips}</div></div>`;
}

function vistaGrilla() {
  const l = S.lev, n = S.nivel, cnt = conteoNiveles();
  const chips = range(l.n).map(i => `<button class="chip ${i === n ? 'on' : ''}" data-n="${i}">N${i}${cnt[i] ? `<i>${cnt[i]}</i>` : ''}</button>`).join('');
  return cabNivel(`<b>Candados — Nivel ${n}</b><span>${cnt[n] || 0} indicación(es) · ${S.inds.size} en total</span>`, chips) +
    `<div class="gwrap" id="gwrap">${svgNivel(n)}</div>
    <div class="leyenda"><span class="sw ind"></span>sin foto <span class="sw foto"></span>con foto ·
      ${l.t > 16 ? 'toca un panel para abrirlo en grande' : 'toca el candado entre dos tubos (o el nombre del panel para verlo en grande)'}</div>`;
}

function vistaLista() {
  const l = S.lev, f = S.filtroN, cnt = conteoNiveles();
  const xs = [...S.inds.values()].filter(x => !f || x.n === f).sort(ordenar);
  const porTipo = {}; xs.forEach(x => porTipo[x.k] = (porTipo[x.k] || 0) + 1);
  const chips = `<button class="chip ${!f ? 'on' : ''}" data-f="0">Todos<i>${S.inds.size}</i></button>` +
    range(l.n).map(i => `<button class="chip ${i === f ? 'on' : ''}" data-f="${i}">N${i}${cnt[i] ? `<i>${cnt[i]}</i>` : ''}</button>`).join('');
  return cabNivel(`<b>Indicaciones${f ? ' — Nivel ' + f : ''}</b><span>${xs.length}${Object.keys(porTipo).length ? ' · ' + TIPOS.filter(t => porTipo[t]).map(t => `${t} ${porTipo[t]}`).join(' · ') : ''}</span>`, chips) +
    (xs.map(x => `<button class="item ind" data-k="${x.id}"><span class="badge ${x.nf > 0 ? 'foto' : 'ind'}">${esc(ini(x))}</span>
      <div><b>${codigo(x)}</b> · ${esc(tipoTxt(x))}${x.nota ? `<br><span class="nt">${esc(x.nota)}</span>` : ''}
      <small>${esc(x.u)} · ${fecha(x.t)}${x.uu && x.uu !== x.u ? ` · editó ${esc(x.uu)}` : ''} · ${ic('camara', 14)} ${x.nf || 0}</small></div></button>`).join('')
    || '<p class="vacio">Sin indicaciones registradas.</p>');
}

function barraInferior() {
  const b = (id, i, tx) => `<button id="${id}">${ic(i, 30)}<span>${tx}</span></button>`;
  return `<nav class="abajo">${S.vista === 'lista' ? b('nVis', 'grilla', 'Grilla') : b('nVis', 'lista', 'Lista')}${b('nLam', 'lamina', 'Lámina')}${b('nExp', 'compartir', 'Exportar')}${b('nAju', 'ajustes', 'Ajustes')}</nav>`;
}

function conectar() {
  app.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { S.nivel = +b.dataset.n; ls.set('ties_nivel_' + S.lev.id, S.nivel); render(); });
  app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { S.filtroN = +b.dataset.f; render(); });
  app.querySelectorAll('[data-k]').forEach(b => b.onclick = () => detalle(b.dataset.k));
  const g = $('#gwrap');
  if (g) g.onclick = e => {
    const l = S.lev, { xu, p, c, yu } = puntoSVG(e, g.querySelector('svg'), G.L, G.L + l.t * G.u);
    if (yu < 0 || p < 1 || p > l.p) return;
    if (l.t > 16 || xu < G.L - 4 || c < 1 || c > l.t - 1) return verPanel(p);
    tocarCandado(p, c);
  };
  $('#nVis').onclick = () => {
    if (S.vista === 'lista') S.vista = 'grilla'; else { S.vista = 'lista'; S.filtroN = S.nivel; }
    window.scrollTo(0, 0); render();
  };
  $('#nLam').onclick = () => verLamina(S.vista === 'lista' && S.filtroN ? S.filtroN : S.nivel);
  $('#nExp').onclick = exportar;
  $('#nAju').onclick = ajustes;
}

// ---------- panel en grande ----------
function svgPanel(n, p) {
  const L = 4, W = L * 2 + S.lev.t * G.u, H = G.top + G.rh;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" style="width:${Math.max(S.lev.t * 46, 300)}px"><style>${SVG_CSS}</style>${numerosTubo(L, G.top / 2, true)}${filaSVG(n, p, G.top, L)}</svg>`;
}

function verPanel(p) {
  S.panel = p;
  hoja(`<div class="dcab"><h3>Nivel ${S.nivel} · Panel P${pad(p)}</h3><button class="x" data-x>${ic('cerrar', 28)}</button></div>
    <p class="nota">Toca el candado entre dos tubos. Desliza hacia el lado si no cabe.</p>
    <div class="pwrap" id="pwrap"></div><div id="pLista"></div>`, () => { S.panel = null; });
  pintarPanel();
}

function pintarPanel() {
  const w = $('#pwrap'); if (!w || !S.lev) return;
  const n = S.nivel, p = S.panel, sx = w.scrollLeft;
  w.innerHTML = svgPanel(n, p); w.scrollLeft = sx;
  w.onclick = e => {
    const { c, p: fila } = puntoSVG(e, w.querySelector('svg'), 4, 8 + S.lev.t * G.u);
    if (fila === 1 && c >= 1 && c < S.lev.t) tocarCandado(p, c);
  };
  const xs = range(S.lev.t - 1).map(c => S.inds.get(key(n, p, c))).filter(Boolean);
  $('#pLista').innerHTML = xs.map(x => `<button class="item ind" data-k="${x.id}"><span class="badge ${x.nf > 0 ? 'foto' : 'ind'}">${esc(ini(x))}</span>
    <div><b>${codigo(x)}</b> · ${esc(tipoTxt(x))}<small>${esc(x.u)} · ${ic('camara', 14)} ${x.nf || 0}</small></div></button>`).join('')
    || '<p class="vacio">Sin indicaciones en este panel.</p>';
  $('#pLista').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { S.panel = null; detalle(b.dataset.k); });
}

// ---------- registrar indicación ----------
function tocarCandado(p, c) {
  S.panel = null;
  const n = S.nivel, k = key(n, p, c);
  if (S.inds.has(k)) return detalle(k);
  const cod = codigo({ n, p, c });
  hoja(`<div class="dcab"><h3>${cod}</h3><button class="x" data-x>${ic('cerrar', 28)}</button></div>
    <p class="nota">Nivel ${n} · panel ${p} · candado entre tubos ${c} y ${c + 1}</p>
    <div class="tipos">${TIPOS.map(t => `<button class="btn" data-t="${t}">${t}</button>`).join('')}</div>`);
  $('#modal').querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
    let o = '';
    if (b.dataset.t === 'Otro') { o = prompt('Describe la indicación', ''); if (o === null) return; o = o.trim(); }
    const x = { n, p, c, k: b.dataset.t, o, nota: '', nf: 0, u: S.nombre, uid: S.uid, t: Date.now() };
    setDoc(indRef(k), x).catch(errEsc);
    S.inds.set(k, { id: k, ...x });
    S.onClose = null; $('#modal').hidden = true;
    render(); detalle(k);
    if (ls.get('ties_cam', true)) abrirCamara(k, false);
  });
}

function abrirCamara(k, galeria) {
  S.camK = k; const i = galeria ? $('#gal') : $('#cam'); i.value = ''; i.click();
}

$('#cam').onchange = $('#gal').onchange = async e => {
  const files = [...e.target.files], k = S.camK; e.target.value = '';
  if (!k || !files.length || !S.lev) return;
  for (const f of files) {
    try {
      const d = await comprimir(f, S.inds.get(k));
      setDoc(doc(fotosCol(k)), { d, t: Date.now(), u: S.nombre, uid: S.uid }).catch(errEsc);
      updateDoc(indRef(k), { nf: increment(1), uu: S.nombre, ut: Date.now() }).catch(errEsc);
      toast('Foto guardada' + (navigator.onLine ? '' : ' (se sube al tener señal)'));
    } catch (err) { toast('No se pudo procesar la foto: ' + err.message, 5000); }
  }
};

async function comprimir(file, x) {
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch {
    src = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error('formato no soportado')); i.src = URL.createObjectURL(file); });
  }
  const sello = ls.get('ties_sello', true) && x;
  let max = 1600;
  for (let intento = 0; intento < 5; intento++) {
    const s = Math.min(1, max / Math.max(src.width, src.height));
    const w = Math.round(src.width * s), h = Math.round(src.height * s), bh = sello ? Math.max(48, Math.round(w * 0.07)) : 0;
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h + bh;
    const g = cv.getContext('2d'); g.drawImage(src, 0, 0, w, h);
    if (sello) {
      const fs = Math.round(bh * 0.34);
      g.fillStyle = '#0E3A5F'; g.fillRect(0, h, w, bh); g.textBaseline = 'middle';
      g.fillStyle = '#fff'; g.font = `bold ${fs}px sans-serif`; g.fillText(`${codigo(x)} · ${tipoTxt(x)}`, fs * 0.6, h + bh * 0.3);
      g.fillStyle = '#F5A300'; g.font = `${Math.round(fs * 0.8)}px sans-serif`; g.fillText(`${S.lev.nombre} · ${S.nombre} · ${fecha(Date.now())}`, fs * 0.6, h + bh * 0.72);
    }
    for (const q of [0.75, 0.62, 0.5]) { const d = cv.toDataURL('image/jpeg', q); if (d.length < 900000) return d; }
    max = Math.round(max * 0.75);
  }
  throw new Error('foto demasiado grande');
}

// ---------- detalle de una indicación ----------
function detalle(k) {
  const x0 = S.inds.get(k); if (!x0) return;
  S.detalle = k; S.fotos = []; S.notaSucia = false;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  hoja(`<div class="dcab"><h3>${codigo(x0)}</h3><button class="x" data-x>${ic('cerrar', 28)}</button></div>
    <div class="tipos" id="dTipos"></div>
    <label>Nota<textarea id="dNota" rows="3" placeholder="Descripción, largo, ubicación…"></textarea></label>
    ${SR ? `<button class="btn chico" id="dMic">${ic('mic')}<span>Dictar nota</span></button>` : ''}
    <div class="fotos" id="dFotos"></div>
    <div class="acciones"><button class="btn pri" id="dCam">${ic('camara')}Foto</button><button class="btn" id="dGal">${ic('galeria')}Galería</button></div>
    <p class="meta" id="dMeta"></p>
    <button class="btn peligro" id="dDel">${ic('borrar')}Quitar indicación</button>`, cerrarDetalle);
  const nota = $('#dNota');
  nota.oninput = () => S.notaSucia = true;
  nota.onblur = guardarNota;
  $('#dCam').onclick = () => abrirCamara(k, false);
  $('#dGal').onclick = () => abrirCamara(k, true);
  $('#dDel').onclick = quitarInd;
  if (SR) $('#dMic').onclick = () => {
    const r = new SR(); r.lang = 'es-CL'; r.interimResults = false;
    $('#dMic span').textContent = 'Escuchando…';
    r.onresult = ev => { const t = ev.results[0][0].transcript; nota.value = (nota.value ? nota.value.trim() + ' ' : '') + t; S.notaSucia = true; guardarNota(); };
    r.onend = () => { const b = $('#dMic span'); if (b) b.textContent = 'Dictar nota'; };
    r.onerror = ev => toast('Dictado: ' + ev.error);
    r.start();
  };
  S.unsubFotos = onSnapshot(query(fotosCol(k), orderBy('t')), s => { S.fotos = s.docs.map(d => ({ id: d.id, ...d.data() })); pintarFotos(); }, () => { });
  refrescarDetalle();
}

function refrescarDetalle() {
  const x = S.inds.get(S.detalle);
  if (!x) { toast('Otro usuario quitó esta indicación'); S.notaSucia = false; return cerrarModal(); }
  const t = $('#dTipos'); if (!t) return;
  t.innerHTML = TIPOS.map(tp => `<button class="btn ${x.k === tp ? 'on' : ''}" data-tp="${tp}">${tp === 'Otro' && x.k === 'Otro' && x.o ? 'Otro: ' + esc(x.o) : tp}</button>`).join('');
  t.querySelectorAll('[data-tp]').forEach(b => b.onclick = () => cambiarTipo(b.dataset.tp));
  const nota = $('#dNota');
  if (document.activeElement !== nota && !S.notaSucia && nota.value !== (x.nota || '')) nota.value = x.nota || '';
  $('#dMeta').innerHTML = `Registró <b>${esc(x.u)}</b> · ${fecha(x.t)}${x.ut ? `<br>Último cambio: <b>${esc(x.uu)}</b> · ${fecha(x.ut)}` : ''}`;
}

function pintarFotos() {
  const el = $('#dFotos'); if (!el) return;
  el.innerHTML = S.fotos.map((f, i) => `<img data-i="${i}" src="${f.d}" alt="">`).join('');
  el.querySelectorAll('img').forEach(im => im.onclick = () => {
    const f = S.fotos[+im.dataset.i], x = S.inds.get(S.detalle), j = +im.dataset.i + 1;
    visor(f.d, {
      titulo: `${codigo(x)} · foto ${j} · ${f.u}`, nombre: `${codigo(x)}_${limpio(tipoTxt(x))}_${j}.jpg`,
      eliminar: () => {
        if (!confirm('¿Eliminar esta foto para todos?')) return;
        const b = writeBatch(db);
        b.delete(doc(fotosCol(S.detalle), f.id));
        b.update(indRef(S.detalle), { nf: increment(-1), uu: S.nombre, ut: Date.now() });
        b.commit().catch(errEsc); cerrarVisor();
      }
    });
  });
}

function cambiarTipo(tp) {
  const x = S.inds.get(S.detalle); let o = '';
  if (tp === 'Otro') { o = prompt('Describe la indicación', x.o || ''); if (o === null) return; o = o.trim(); }
  if (tp === x.k && o === (x.o || '')) return;
  updateDoc(indRef(S.detalle), { k: tp, o, uu: S.nombre, ut: Date.now() }).catch(errEsc);
}

function guardarNota() {
  if (!S.notaSucia || !S.detalle) return;
  const v = $('#dNota')?.value.trim() ?? ''; S.notaSucia = false;
  if (v === (S.inds.get(S.detalle)?.nota || '')) return;
  updateDoc(indRef(S.detalle), { nota: v, uu: S.nombre, ut: Date.now() }).catch(errEsc);
}

function cerrarDetalle() {
  guardarNota(); S.unsubFotos?.(); S.unsubFotos = null; S.detalle = null; S.fotos = [];
}

function quitarInd() {
  const k = S.detalle, x = S.inds.get(k), nf = S.fotos.length;
  if (!confirm(`¿Quitar la indicación ${codigo(x)}${nf ? ` y sus ${nf} fotos` : ''}? Se borra para todos.`)) return;
  const b = writeBatch(db);
  S.fotos.forEach(f => b.delete(doc(fotosCol(k), f.id)));
  b.delete(indRef(k));
  b.commit().catch(errEsc);
  S.notaSucia = false; S.inds.delete(k); cerrarModal(); render();
}

// ---------- visor de imágenes ----------
const aBlob = d => fetch(d).then(r => r.blob());
function descargar(blob, nombre) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 20000);
}
async function compartir(blob, nombre) {
  const f = new File([blob], nombre, { type: blob.type });
  if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f], title: nombre }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  descargar(blob, nombre);
}

function visor(src, { titulo: tt = '', nombre = 'imagen', eliminar } = {}) {
  const v = $('#visor'); guardia();
  v.innerHTML = `<div class="vcab"><span>${esc(tt)}</span><button class="x" id="vX">${ic('cerrar', 28)}</button></div>
    <div class="vimg" id="vImg"><img src="${src}" alt=""></div>
    <div class="vbar"><button class="btn" id="vDes">${ic('bajar')}Guardar</button>${navigator.share ? `<button class="btn" id="vSh">${ic('compartir')}Compartir</button>` : ''}${eliminar ? `<button class="btn peligro" id="vDel">${ic('borrar')}Eliminar</button>` : ''}</div>`;
  v.hidden = false;
  $('#vX').onclick = cerrarVisor;
  $('#vImg').onclick = () => $('#vImg').classList.toggle('zoom');
  $('#vDes').onclick = async () => descargar(await aBlob(src), nombre);
  if ($('#vSh')) $('#vSh').onclick = async () => compartir(await aBlob(src), nombre);
  if (eliminar) $('#vDel').onclick = eliminar;
}
function cerrarVisor() { const v = $('#visor'); v.hidden = true; v.innerHTML = ''; }

// ---------- lámina por nivel ----------
function cortar(g, s, w) {
  s = String(s || '').replace(/\s+/g, ' ');
  if (g.measureText(s).width <= w) return s;
  while (s.length && g.measureText(s + '…').width > w) s = s.slice(0, -1);
  return s + '…';
}

const cargarImg = src => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error('no se pudo dibujar la grilla')); i.src = src; });

async function lamina(n) {
  const l = S.lev, m = 30, top = 130, lh = 28;
  const xs = [...S.inds.values()].filter(x => x.n === n).sort(ordenar);
  const uw = G.L + l.t * G.u, uh = G.top + l.p * G.rh, k = Math.max(2, Math.min(3, 1000 / uw));
  const gw = Math.round(uw * k), gh = Math.round(uh * k);
  const W = Math.max(gw + 2 * m, 1100), H = top + gh + 70 + (xs.length + 1) * lh + m;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#0E3A5F'; g.fillRect(0, 0, W, 84);
  g.textBaseline = 'middle';
  g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.fillText(`Candados sobrecalentador — Nivel ${n}`, m, 32);
  g.fillStyle = '#F5A300'; g.font = '18px sans-serif'; g.fillText(`${l.nombre} · ${xs.length} indicaciones · ${fecha(Date.now())}`, m, 64);
  g.font = '16px sans-serif'; const ly = 108;
  g.fillStyle = '#F48FB1'; g.fillRect(m, ly - 8, 16, 16); g.fillStyle = '#13202c'; g.fillText('Sin foto', m + 24, ly);
  g.fillStyle = '#D32F2F'; g.fillRect(m + 120, ly - 8, 16, 16); g.fillStyle = '#13202c'; g.fillText('Con foto', m + 144, ly);
  g.fillText('G Grieta · R Rotura · D Desgarro · O Otro · candado entre dos tubos', m + 250, ly);
  const x0 = Math.round((W - gw) / 2), y0 = top;
  g.fillStyle = '#EEF1F5'; g.fillRect(x0 - 10, y0 - 6, gw + 20, gh + 12);
  g.drawImage(await cargarImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgNivel(n, gw, gh))), x0, y0, gw, gh);
  g.textAlign = 'left';
  const cols = [m, m + 200, m + 380, W - m - 300, W - m - 210], wcol = i => (cols[i + 1] || W - m) - cols[i] - 12;
  let y = y0 + gh + 44;
  g.fillStyle = '#0E3A5F'; g.fillRect(m, y - lh / 2, W - 2 * m, lh);
  g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif';
  ['Código', 'Indicación', 'Nota', 'Fotos', 'Registró'].forEach((t, i) => g.fillText(t, cols[i] + 6, y));
  g.font = '15px sans-serif';
  xs.forEach((x, r) => {
    y += lh; g.fillStyle = r % 2 ? '#f5f7fa' : '#fff'; g.fillRect(m, y - lh / 2, W - 2 * m, lh); g.fillStyle = '#13202c';
    [codigo(x), tipoTxt(x), x.nota, String(x.nf || 0), x.u].forEach((t, i) => g.fillText(cortar(g, t, wcol(i)), cols[i] + 6, y));
  });
  return cv;
}
const canvasBlob = cv => new Promise(r => cv.toBlob(r, 'image/png'));

// ---------- exportar ----------
function csv() {
  const cols = ['Nivel', 'Panel', 'Candado (tubos)', 'Código', 'Indicación', 'Nota', 'Fotos', 'Registró', 'Fecha registro', 'Último cambio', 'Fecha cambio'];
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [...S.inds.values()].sort(ordenar).map(x =>
    [x.n, `P${pad(x.p)}`, `T${pad(x.c)}-${pad(x.c + 1)}`, codigo(x), tipoTxt(x), x.nota, x.nf || 0, x.u, fecha(x.t), x.uu || '', fecha(x.ut)]);
  return '﻿' + [cols, ...rows].map(r => r.map(q).join(';')).join('\r\n');
}

function exportar() {
  const n = S.nivel, nom = limpio(S.lev.nombre);
  hoja(`<h3>Exportar</h3>
    <button class="btn" id="eCsv">${ic('planilla')}Planilla (CSV para Excel)</button>
    <button class="btn" id="eLam">${ic('lamina')}Lámina del nivel ${n} (PNG)</button>
    <button class="btn pri" id="eZip">${ic('zip')}<span>ZIP: fotos + láminas + planilla</span></button>
    <p class="nota">El ZIP ordena las fotos como BoilerImage: Nivel N / Pxx Tyy-zz / Nn-Pxx-Tyy-zz_tipo_k.jpg.</p>
    <div class="acciones"><button class="btn" data-x>Cerrar</button></div>`);
  $('#eCsv').onclick = () => compartir(new Blob([csv()], { type: 'text/csv' }), `Candados ${nom}.csv`);
  $('#eLam').onclick = () => { cerrarModal(); verLamina(n); };
  $('#eZip').onclick = exportarZip;
}

async function verLamina(n) {
  let d;
  try { d = (await lamina(n)).toDataURL('image/png'); } catch (e) { return toast('No se pudo armar la lámina: ' + e.message, 5000); }
  visor(d, { titulo: `Lámina nivel ${n}`, nombre: `Candados Nivel ${n}.png` });
}

async function exportarZip() {
  const b = $('#eZip'), bt = $('#eZip span'); b.disabled = true; bt.textContent = 'Preparando…';
  try {
    const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
    const z = new JSZip(), base = `Candados ${limpio(S.lev.nombre)}`;
    z.file(`${base}/Candados ${limpio(S.lev.nombre)}.csv`, csv());
    for (const n of range(S.lev.n)) {
      if ([...S.inds.values()].some(x => x.n === n)) z.file(`${base}/Candados Nivel ${n}.png`, await canvasBlob(await lamina(n)));
    }
    const xs = [...S.inds.values()].filter(x => x.nf > 0).sort(ordenar);
    let i = 0, nf = 0;
    for (const x of xs) {
      i++; if ($('#eZip span')) $('#eZip span').textContent = `Fotos ${i} de ${xs.length}…`;
      const s = await getDocs(query(fotosCol(x.id), orderBy('t')));
      s.docs.forEach((d, j) => {
        const dir = `${base}/Nivel ${x.n}/P${pad(x.p)} T${pad(x.c)}-${pad(x.c + 1)}`;
        z.file(`${dir}/${codigo(x)}_${limpio(tipoTxt(x))}_${j + 1}.jpg`, d.data().d.split(',')[1], { base64: true }); nf++;
      });
    }
    const blob = await z.generateAsync({ type: 'blob' });
    const nombre = `${base} ${hoy()}.zip`;
    hoja(`<h3>ZIP listo</h3><p>${nf} fotos · ${(blob.size / 1048576).toFixed(1)} MB</p>
      <button class="btn pri" id="zSh">${ic('compartir')}Compartir</button><button class="btn" id="zDes">${ic('bajar')}Guardar en Descargas</button>
      <div class="acciones"><button class="btn" data-x>Cerrar</button></div>`);
    $('#zSh').onclick = () => compartir(blob, nombre);
    $('#zDes').onclick = () => descargar(blob, nombre);
  } catch (e) {
    toast('No se pudo armar el ZIP: ' + (e.code || e.message), 6000);
    const bb = $('#eZip'); if (bb) { bb.disabled = false; bb.querySelector('span').textContent = 'ZIP: fotos + láminas + planilla'; }
  }
}

// ---------- ajustes ----------
function ajustes() {
  const l = S.lev;
  hoja(`<h3>Ajustes</h3>
    <h4>Levantamiento (cambia para todos)</h4>
    <label>Nombre<input id="aNom" value="${esc(l.nombre)}"></label>
    <div class="fila3">
      <label>Paneles<input id="aP" type="number" inputmode="numeric" value="${l.p}"></label>
      <label>Niveles<input id="aN" type="number" inputmode="numeric" value="${l.n}"></label>
      <label>Tubos<input id="aT" type="number" inputmode="numeric" value="${l.t}"></label>
    </div>
    <button class="btn pri" id="aOk">Guardar cambios</button>
    <h4>En este teléfono</h4>
    <label class="sw"><input type="checkbox" id="aCam" ${ls.get('ties_cam', true) ? 'checked' : ''}> Abrir la cámara al marcar un candado</label>
    <label class="sw"><input type="checkbox" id="aSel" ${ls.get('ties_sello', true) ? 'checked' : ''}> Sello con código, usuario y fecha en la foto</label>
    <h4>Zona de peligro</h4>
    <button class="btn peligro" id="aDel">${ic('borrar')}Eliminar levantamiento</button>
    <div class="acciones"><button class="btn" data-x>Cerrar</button></div>`);
  $('#aCam').onchange = e => ls.set('ties_cam', e.target.checked);
  $('#aSel').onchange = e => ls.set('ties_sello', e.target.checked);
  $('#aOk').onclick = () => {
    const nombre = $('#aNom').value.trim(), p = num('#aP', 1, 200), n = num('#aN', 1, 30), t = num('#aT', 2, 100);
    if (!nombre || !p || !n || !t) return toast('Revisa el nombre y las cantidades');
    const fuera = [...S.inds.values()].filter(x => x.n > n || x.p > p || x.c > t - 1).length;
    if (fuera && !confirm(`${fuera} indicaciones quedan fuera de la grilla nueva (no se borran, siguen en la Lista y el Excel). ¿Continuar?`)) return;
    updateDoc(levRef(l.id), { nombre, p, n, t }).catch(errEsc);
    cerrarModal(); toast('Ajustes guardados');
  };
  $('#aDel').onclick = () => {
    if (prompt(`Se borrará "${l.nombre}" con todas sus indicaciones y fotos, para todos los usuarios.\nEscribe BORRAR para confirmar.`) !== 'BORRAR') return;
    const id = l.id; cerrarLev(); borrarLev(id);
  };
}

async function borrarLev(id) {
  try {
    const inds = await getDocs(collection(db, 'levantamientos', id, 'indicaciones'));
    let b = writeBatch(db), ops = 0;
    const paso = () => { if (++ops >= 400) { b.commit().catch(errEsc); b = writeBatch(db); ops = 0; } };
    for (const d of inds.docs) {
      const fs = await getDocs(collection(d.ref, 'fotos'));
      fs.docs.forEach(f => { b.delete(f.ref); paso(); });
      b.delete(d.ref); paso();
    }
    b.delete(levRef(id)); b.commit().catch(errEsc);
    toast('Levantamiento eliminado');
  } catch (e) { errEsc(e); }
}

// ---------- menú ----------
function menu() {
  if (!S.uid || ls.get('ties_miembro', null) !== S.uid) return;
  hoja(`<h3>${esc(S.nombre)}</h3>
    <button class="btn" id="mNom">${ic('editar')}Cambiar mi nombre</button>
    ${S.instalar ? `<button class="btn" id="mInst">${ic('instalar')}Instalar TIES en el teléfono</button>` : ''}
    <button class="btn" id="mSal">${ic('salir')}Cerrar sesión</button>
    <p class="nota">TIES v${VERSION}. Los cambios se guardan en el teléfono y se suben solos cuando hay señal. Cada indicación registra quién la marcó y quién la cambió por última vez.</p>
    <div class="acciones"><button class="btn" data-x>Cerrar</button></div>`);
  $('#mNom').onclick = () => {
    const v = prompt('Tu nombre', S.nombre); if (!v || !v.trim()) return;
    S.nombre = v.trim(); ls.set('ties_nombre', S.nombre);
    updateDoc(doc(db, 'miembros', S.uid), { nombre: S.nombre, t: Date.now() }).catch(errEsc);
    cerrarModal(); toast('Nombre actualizado');
  };
  if ($('#mInst')) $('#mInst').onclick = async () => { S.instalar.prompt(); await S.instalar.userChoice; S.instalar = null; cerrarModal(); };
  $('#mSal').onclick = async () => {
    if (S.pend && !confirm(`Hay ${S.pend} cambios sin subir. Si cierras sesión se pierden. ¿Cerrar igual?`)) return;
    if (!confirm('Para volver a entrar necesitarás señal y la clave del equipo. ¿Cerrar sesión?')) return;
    cerrarModal(); ls.set('ties_miembro', null); ls.set('ties_lev', null); S.levId = null;
    detenerTodo(); S.lev = null; await signOut(auth);
  };
}
