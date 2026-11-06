// TIES — levantamiento de candados del sobrecalentador, multiusuario (Firebase)
import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, updateDoc, getDocs, onSnapshot,
  query, orderBy, increment, writeBatch
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const VERSION = '2.5.1';
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
  cliente: 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z',
  planta: 'M22 22H2V10l7-3v2l5-2v3h3l1-8h3l1 8v12zM12 9.95l-5 2V10l-3 1.32V20h16v-8h-8V9.95zM11 18h2v-4h-2v4zm-4 0h2v-4H7v4zm10-4h-2v4h2v-4z',
  caldera: 'M12 12.9l-2.13 2.09C9.31 15.55 9 16.28 9 17.06 9 18.68 10.35 20 12 20s3-1.32 3-2.94c0-.78-.31-1.52-.87-2.07L12 12.9zM16 6l-.44.55C14.38 8.02 12 7.19 12 5.3V2S4 6 4 13c0 2.92 1.56 5.47 3.89 6.86-.56-.79-.89-1.76-.89-2.8 0-1.32.52-2.56 1.47-3.5L12 10.1l3.53 3.47c.95.93 1.47 2.17 1.47 3.5 0 1.02-.31 1.96-.85 2.75 1.89-1.15 3.29-3.06 3.71-5.3.66-3.55-1.07-6.9-3.86-8.52z',
  proyecto: 'M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z',
  derecha: 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
  informe: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
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
// fotos: cada indicación lleva foto general y foto de detalle (como BoilerImage)
const FT = { general: 'General', detalle: 'Detalle' };
const nG = x => x.ng ?? (x.nd === undefined ? x.nf || 0 : 0);
const nD = x => x.nd || 0;
const completa = x => nG(x) > 0 && nD(x) > 0;
// cambio del conteo general/detalle; en indicaciones antiguas (solo nf) se fijan los dos valores la primera vez
const conteoFotos = (x, tp, d) => x.ng === undefined && x.nd === undefined
  ? { ng: Math.max(0, (x.nf || 0) + (tp === 'general' ? d : 0)), nd: Math.max(0, tp === 'detalle' ? d : 0) }
  : { [tp === 'detalle' ? 'nd' : 'ng']: increment(d) };
const fotosTxt = x => `General ${nG(x)} · Detalle ${nD(x)}`;
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
  detalle: null, fotos: [], notaSucia: false, camK: null, ingresando: false, instalar: null, panel: null,
  cat: { clientes: [], plantas: [], calderas: [], sobrecalentadores: [], proyectos: [], ajustes: [] }, ruta: ls.get('ties_ruta', null) || {}
};
$('#atras').innerHTML = ic('atras', 28);
const altoCab = () => document.documentElement.style.setProperty('--hh', $('header').offsetHeight + 'px');
altoCab(); addEventListener('resize', altoCab);
$('#menuBtn').innerHTML = ic('mas', 28);

// ---------- navegación con el botón Atrás de Android ----------
function guardia() { if (!history.state?.ties) history.pushState({ ties: 1 }, ''); }
addEventListener('popstate', () => {
  if (!$('#visor').hidden) cerrarVisor();
  else if (!$('#modal').hidden) cerrarModal();
  else if (S.lev || S.ruta.cid) atras();
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
if ('serviceWorker' in navigator) {
  // al publicarse una versión nueva, recargar una vez para usarla
  const habia = !!navigator.serviceWorker.controller;
  let recargo = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (habia && !recargo) { recargo = true; location.reload(); } });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update()).catch(() => { });
}

function titulo(t) { $('#titulo').textContent = t; $('#atras').hidden = !S.lev && !S.ruta.cid; }
$('#atras').onclick = () => atras();
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
  detenerTodo(); S.lev = null; titulo('TIES'); $('#atras').hidden = true;
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

// hallazgos por nivel de las otras grillas de la caldera en el evento (para pintar el croquis en rojo)
S.cntLev = {}; S.subsCnt = {};
function seguirConteos(prj, kid) {
  const quiero = new Set(S.levs.filter(l => l.prj === prj && l.kid === kid).map(l => l.id));
  Object.keys(S.subsCnt).forEach(id => { if (!quiero.has(id)) { S.subsCnt[id](); delete S.subsCnt[id]; } });
  quiero.forEach(id => {
    if (S.subsCnt[id]) return;
    S.subsCnt[id] = onSnapshot(collection(db, 'levantamientos', id, 'indicaciones'), snap => {
      const c = {}; snap.docs.forEach(d => { const n = d.data().n; c[n] = (c[n] || 0) + 1; });
      if (JSON.stringify(c) === JSON.stringify(S.cntLev[id] || {})) return;
      S.cntLev[id] = c;
      if (S.lev) { if (S.lev.id !== id) render(); } else if (S.ruta.kid === kid) pantalla();
    }, () => { });
  });
}
// conteo por nivel del sobrecalentador sid en el evento (la grilla abierta usa sus datos en vivo)
const conteoSH = (prj, sid) => { const l = levEv(prj, sid); return !l ? {} : S.lev && l.id === S.lev.id ? conteoNiveles() : S.cntLev[l.id] || {}; };

function detenerTodo() {
  S.unsubLevs?.(); S.unsubLevs = null;
  S.unsubCat?.forEach(f => f()); S.unsubCat = null;
  Object.values(S.subsCnt || {}).forEach(f => f()); S.subsCnt = {};
  S.unsubInds?.(); S.unsubInds = null;
  cerrarModal();
}

// ---------- clientes, plantas, calderas, sobrecalentadores y proyectos ----------
// El catálogo vive en levantamientos/_cat/… para usar las mismas reglas de seguridad.
// Caldera → sobrecalentadores (paneles, tubos, niveles) y proyectos por año.
// Cada (proyecto, sobrecalentador) es un documento de "levantamientos" con prj y sid.
const catCol = c => collection(db, 'levantamientos', '_cat', c);
const catRef = (c, id) => doc(db, 'levantamientos', '_cat', c, id);
const CAT = ['clientes', 'plantas', 'calderas', 'sobrecalentadores', 'proyectos', 'ajustes'];
const CLIENTES_BASE = [{ id: 'arauco', nombre: 'Arauco' }, { id: 'cmpc', nombre: 'CMPC' }];
const porNombre = (a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es', { numeric: true });
const busca = c => id => S.cat[c].find(x => x.id === id);
const cli = busca('clientes'), pla = busca('plantas'), cal = busca('calderas'), sobre = busca('sobrecalentadores'), proy = busca('proyectos');
const shDe = kid => S.cat.sobrecalentadores.filter(x => x.kid === kid).sort((a, b) => (a.c || 0) - (b.c || 0));
const antiguosDe = kid => S.levs.filter(l => l.kid === kid && !l.prj);
// "Arauco · Valdivia · Caldera Recuperadora"
const rutaTxt = l => [cli(l.cid)?.nombre, pla(l.pid)?.nombre, cal(l.kid)?.nombre].filter(Boolean).join(' · ');
// Cliente · Planta · Evento · Caldera · Sobrecalentador
const nombreCompleto = l => [cli(l.cid)?.nombre, pla(l.pid)?.nombre, l.nombre, cal(l.kid)?.nombre, sobre(l.sid)?.nombre].filter(Boolean).join(' · ');
const nombresNiv = (l = S.lev) => sobre(l?.sid)?.nn || l?.nn || [];
const nivelNom = (i, l) => nombresNiv(l)[i - 1] || `Nivel ${i}`;
const chipNom = i => nombresNiv()[i - 1] || `N${i}`;
// niveles inspeccionados: lev.insp = { n: { u, t } } (null = no inspeccionado)
const inspN = (l, n) => l?.insp?.[n] || null;
const nInsp = l => l ? range(l.n).filter(n => inspN(l, n)).length : 0;
// paneles inspeccionados dentro de cada nivel: lev.ip = { 'N3_P12': { u, t } | null }
const inspP = (l, n, p) => l?.ip?.[`N${n}_P${p}`] || null;
const nPanInsp = (l, n) => l ? range(l.p).filter(p => inspP(l, n, p)).length : 0;
const levEv = (prj, sid) => S.levs.find(l => l.prj === prj && l.sid === sid);
const inspTxt = l => l ? `${nInsp(l)} de ${l.n} niveles inspeccionados` : 'sin iniciar';
const dimTxt = x => `${x.p} paneles · ${x.t} tubos · ${x.n} niveles`;

// guardar y mostrar de inmediato (sin esperar la respuesta de Firestore)
function crearCat(c, datos) {
  const ref = doc(catCol(c)), x = { ...datos, c: Date.now(), u: S.nombre };
  setDoc(ref, x).catch(errEsc);
  S.cat[c] = [...S.cat[c], { id: ref.id, ...x }].sort(porNombre);
  return ref.id;
}
const num = (id, min, max) => { const v = parseInt($(id).value, 10); return v >= min && v <= max ? v : null; };

function inicio() {
  detenerTodo(); estado();
  const err = e => toast('Error: ' + (e.code || e.message), 6000);
  S.unsubLevs = onSnapshot(query(collection(db, 'levantamientos'), orderBy('c', 'desc')), snap => {
    S.levs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (S.lev) {
      const l = S.levs.find(x => x.id === S.lev.id);
      if (!l) { if (snap.metadata.fromCache) return; toast('El levantamiento fue eliminado'); return cerrarLev(); }
      const cambio = l.p !== S.lev.p || l.n !== S.lev.n || l.t !== S.lev.t || l.nombre !== S.lev.nombre || l.kid !== S.lev.kid || JSON.stringify(l.insp || {}) !== JSON.stringify(S.lev.insp || {}) || JSON.stringify(l.ip || {}) !== JSON.stringify(S.lev.ip || {});
      if (cambio && S.panel) setTimeout(pintarPanel);
      S.lev = l; tituloLev(); if (cambio) render();
    } else if (S.levId && S.levs.some(x => x.id === S.levId)) abrirLev(S.levId);
    else pantalla();
  }, err);
  S.unsubCat = CAT.map(c => onSnapshot(catCol(c), snap => {
    S.cat[c] = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort(porNombre);
    // CMPC y Arauco vienen de partida (IDs fijos: si dos personas lo hacen a la vez no se duplican)
    if (c === 'clientes' && !snap.metadata.fromCache && snap.empty)
      CLIENTES_BASE.forEach(x => setDoc(catRef('clientes', x.id), { nombre: x.nombre, c: Date.now(), u: S.nombre }).catch(errEsc));
    if (S.lev) { tituloLev(); if (c === 'sobrecalentadores') render(); } else if (!S.levId) pantalla();
  }, err));
}

function atras() {
  if (S.lev) return cerrarLev();
  const r = S.ruta;
  // Planta → Evento → Caldera (trabajo)   o   Planta → Caldera (configuración de sobrecalentadores)
  if (r.prj && r.kid) r.kid = null; else if (r.prj) r.prj = null; else if (r.kid) r.kid = null; else if (r.pid) r.pid = null; else r.cid = null;
  ir(r);
}
function ir(r) {
  S.ruta = { cid: r.cid || null, pid: r.pid || null, prj: r.prj || null, kid: r.kid || null };
  ls.set('ties_ruta', S.ruta); if (S.ruta.cid) guardia();
  window.scrollTo(0, 0); pantalla();
}

function pantalla() {
  if (S.lev) return;
  const r = S.ruta;
  // si algo se borró, subir al nivel que todavía existe
  if (r.prj && !proy(r.prj) && S.cat.proyectos.length) { r.prj = null; r.kid = null; }
  if (r.kid && !cal(r.kid) && S.cat.calderas.length) r.kid = null;
  if (r.pid && !pla(r.pid) && S.cat.plantas.length) { r.pid = null; r.kid = null; r.prj = null; }
  if (r.cid && !cli(r.cid) && S.cat.clientes.length) S.ruta = {};
  const q = S.ruta;
  if (q.prj && q.kid) vistaEventoCaldera(); else if (q.prj) vistaEvento(); else if (q.kid) vistaCaldera();
  else if (q.pid) vistaPlanta(); else if (q.cid) vistaCliente(); else home();
}

const cabSimple = (t, sub) => `<div class="cabniv"><div class="ctit"><b>${t}</b>${sub ? `<span>${sub}</span>` : ''}</div></div>`;
const itemNav = (attr, icono, tit, sub, sinFlecha) => `<button class="item nav" ${attr}><span class="inav">${ic(icono, 26)}</span>
  <div><b>${tit}</b>${sub ? `<span>${sub}</span>` : ''}</div>${sinFlecha ? ic('editar', 22) : ic('derecha', 26)}</button>`;
const plural = (n, a, b) => `${n} ${n === 1 ? a : b}`;
const acciones = (borrar = 'Eliminar') => `<div class="acciones"><button class="btn" id="bRen">${ic('editar')}Renombrar</button><button class="btn peligro" id="bDel">${ic('borrar')}${borrar}</button></div>`;

function home() {
  S.lev = null; titulo('TIES');
  const sin = S.levs.filter(l => !l.kid || !cal(l.kid));
  const rec = [...S.cat.proyectos].filter(p => pla(p.pid)).sort((a, b) => b.c - a.c).slice(0, 4);
  app.innerHTML = cabSimple(`Hola, ${esc(S.nombre)}`, 'Cliente → planta → evento → caldera → sobrecalentador') +
    `<h3>Clientes</h3>` +
    (S.cat.clientes.map(c => {
      const pl = S.cat.plantas.filter(p => p.cid === c.id).length, ca = S.cat.calderas.filter(k => k.cid === c.id).length;
      return itemNav(`data-cid="${c.id}"`, 'cliente', esc(c.nombre), `${plural(pl, 'planta', 'plantas')} · ${plural(ca, 'caldera', 'calderas')}`);
    }).join('') || '<p class="vacio">Cargando clientes…</p>') +
    `<button class="btn" id="bCli">${ic('agregar')}Nuevo cliente</button>` +
    (rec.length ? `<h3>Eventos recientes</h3>` + rec.map(p => itemNav(`data-prj="${p.id}"`, 'proyecto', esc(p.nombre), esc([cli(p.cid)?.nombre, pla(p.pid)?.nombre].filter(Boolean).join(' · ')))).join('') : '') +
    (sin.length ? `<h3>Sin caldera asignada</h3><p class="nota">Asígnales una caldera en Ajustes, dentro del levantamiento.</p>` +
      sin.map(l => itemNav(`data-id="${l.id}"`, 'proyecto', esc(l.nombre), dimTxt(l))).join('') : '');
  app.querySelectorAll('[data-cid]').forEach(b => b.onclick = () => ir({ cid: b.dataset.cid }));
  app.querySelectorAll('[data-prj]').forEach(b => b.onclick = () => { const p = proy(b.dataset.prj); ir({ cid: p.cid, pid: p.pid, prj: p.id }); });
  app.querySelectorAll('[data-id]').forEach(b => b.onclick = () => abrirLev(b.dataset.id));
  $('#bCli').onclick = () => formNombre('Nuevo cliente', '', 'Ej. Celulosa Arauco', nombre => ir({ cid: crearCat('clientes', { nombre }) }));
}

function vistaCliente() {
  const c = cli(S.ruta.cid); if (!c) return home();
  titulo(c.nombre);
  const ps = S.cat.plantas.filter(p => p.cid === c.id);
  app.innerHTML = cabSimple(esc(c.nombre), 'Cliente · ' + plural(ps.length, 'planta', 'plantas')) +
    `<h3>Plantas</h3>` +
    (ps.map(p => itemNav(`data-pid="${p.id}"`, 'planta', esc(p.nombre), plural(S.cat.calderas.filter(k => k.pid === p.id).length, 'caldera', 'calderas'))).join('')
      || '<p class="vacio">Aún no hay plantas. Agrega la primera.</p>') +
    `<button class="btn pri" id="bPla">${ic('agregar')}Nueva planta</button>` + bloqueLogo('Logo del cliente', c.logo, 'bLogo') + acciones();
  app.querySelectorAll('[data-pid]').forEach(b => b.onclick = () => ir({ cid: c.id, pid: b.dataset.pid }));
  $('#bLogo').onclick = () => cargarLogo('cliente', c.id);
  if ($('#bLogoDel')) $('#bLogoDel').onclick = () => { if (confirm('¿Quitar el logo del cliente?')) { updateDoc(catRef('clientes', c.id), { logo: null }).catch(errEsc); c.logo = null; pantalla(); } };
  $('#bPla').onclick = () => formNombre('Nueva planta · ' + c.nombre, '', 'Ej. Valdivia', nombre => ir({ cid: c.id, pid: crearCat('plantas', { nombre, cid: c.id }) }));
  $('#bRen').onclick = () => formNombre('Renombrar cliente', c.nombre, '', nombre => updateDoc(catRef('clientes', c.id), { nombre }).catch(errEsc));
  $('#bDel').onclick = () => {
    if (ps.length) return toast('Primero elimina sus plantas');
    if (!confirm(`¿Eliminar el cliente ${c.nombre}?`)) return;
    writeBatch(db).delete(catRef('clientes', c.id)).commit().catch(errEsc); ir({});
  };
}

const eventosDe = pid => S.cat.proyectos.filter(x => x.pid === pid).sort((a, b) => (b.anio || 0) - (a.anio || 0) || b.c - a.c);
const levsDe = (prj, kid) => S.levs.filter(l => l.prj === prj && (!kid || l.kid === kid));

function vistaPlanta() {
  const p = pla(S.ruta.pid), c = cli(S.ruta.cid); if (!p) return ir({ cid: S.ruta.cid });
  titulo(p.nombre);
  const ks = S.cat.calderas.filter(k => k.pid === p.id), ev = eventosDe(p.id);
  app.innerHTML = cabSimple(esc(p.nombre), `${esc(c?.nombre || '')} · planta`) +
    `<h3>Eventos</h3>` +
    (ev.map(e => itemNav(`data-prj="${e.id}"`, 'proyecto', esc(e.nombre), `${e.anio} · ${plural(new Set(levsDe(e.id).map(l => l.kid)).size, 'caldera iniciada', 'calderas iniciadas')}`)).join('')
      || '<p class="vacio">Aún no hay eventos. Crea el de esta parada (ej. PGP 2026).</p>') +
    `<button class="btn pri" id="bEve">${ic('agregar')}Nuevo evento</button>
    <h3>Calderas y sobrecalentadores</h3><p class="nota">Se configuran una vez y sirven para todos los eventos de la planta.</p>` +
    (ks.map(k => itemNav(`data-kid="${k.id}"`, 'caldera', esc(k.nombre), plural(shDe(k.id).length, 'sobrecalentador', 'sobrecalentadores'))).join('')
      || '<p class="vacio">Aún no hay calderas. Agrega la primera.</p>') +
    `<button class="btn" id="bCal">${ic('agregar')}Nueva caldera</button>` + acciones();
  app.querySelectorAll('[data-prj]').forEach(b => b.onclick = () => ir({ cid: p.cid, pid: p.id, prj: b.dataset.prj }));
  app.querySelectorAll('[data-kid]').forEach(b => b.onclick = () => ir({ cid: p.cid, pid: p.id, kid: b.dataset.kid }));
  $('#bEve').onclick = () => formEvento(null, p);
  $('#bCal').onclick = () => formNombre('Nueva caldera · ' + p.nombre, '', 'Ej. Caldera Recuperadora 1',
    nombre => ir({ cid: p.cid, pid: p.id, kid: crearCat('calderas', { nombre, cid: p.cid, pid: p.id }) }));
  $('#bRen').onclick = () => formNombre('Renombrar planta', p.nombre, '', nombre => updateDoc(catRef('plantas', p.id), { nombre }).catch(errEsc));
  $('#bDel').onclick = () => {
    if (ks.length || ev.length) return toast('Primero elimina sus eventos y calderas');
    if (!confirm(`¿Eliminar la planta ${p.nombre}?`)) return;
    writeBatch(db).delete(catRef('plantas', p.id)).commit().catch(errEsc); ir({ cid: p.cid });
  };
}

// configuración de la caldera: sus sobrecalentadores
function vistaCaldera() {
  const k = cal(S.ruta.kid); if (!k) return ir({ cid: S.ruta.cid, pid: S.ruta.pid });
  titulo(k.nombre);
  const shs = shDe(k.id), ant = antiguosDe(k.id), usada = S.levs.some(l => l.kid === k.id);
  app.innerHTML = cabSimple(esc(k.nombre), `${esc(cli(k.cid)?.nombre || '')} · ${esc(pla(k.pid)?.nombre || '')} · configuración`) +
    `<h3>Sobrecalentadores</h3>` +
    (shs.map(x => itemNav(`data-sid="${x.id}"`, 'grilla', esc(x.nombre), dimTxt(x) + ((x.nn || []).length ? ' · ' + esc(x.nn.join(', ')) : ''), true)).join('')
      || '<p class="vacio">Agrega los sobrecalentadores de esta caldera: paneles, tubos y niveles de candados.</p>') +
    `<button class="btn pri" id="bSh">${ic('agregar')}Agregar sobrecalentador</button>
    <h3>Croquis</h3>${shs.length ? `<div class="cq chico">${comoImg(svgCroquis(k.id))}</div>` : ''}
    ${k.img ? `<img class="cqfoto" id="kImgV" src="${k.img}" alt="">` : '<p class="nota">Opcional: sube la imagen del croquis de la caldera (por ejemplo, la del plan de inspección) para verla junto a los candados.</p>'}
    <div class="acciones"><button class="btn" id="kImg">${ic('galeria')}${k.img ? 'Cambiar imagen' : 'Subir imagen del croquis'}</button>${k.img ? `<button class="btn peligro" id="kImgDel">${ic('borrar')}Quitar</button>` : ''}</div>` +
    (ant.length ? `<h3>Levantamientos anteriores</h3>` + ant.map(l => itemNav(`data-id="${l.id}"`, 'proyecto', esc(l.nombre), dimTxt(l))).join('') : '') +
    acciones();
  app.querySelectorAll('[data-sid]').forEach(b => b.onclick = () => formSobre(sobre(b.dataset.sid), k));
  app.querySelectorAll('[data-id]').forEach(b => b.onclick = () => abrirLev(b.dataset.id));
  $('#bSh').onclick = () => formSobre(null, k);
  $('#kImg').onclick = () => cargarCroquis(k.id);
  if ($('#kImgDel')) $('#kImgDel').onclick = () => { if (confirm('¿Quitar la imagen del croquis?')) updateDoc(catRef('calderas', k.id), { img: null }).catch(errEsc); };
  if ($('#kImgV')) $('#kImgV').onclick = () => visor(k.img, { titulo: 'Croquis · ' + k.nombre, nombre: `Croquis ${limpio(k.nombre)}.jpg` });
  $('#bRen').onclick = () => formNombre('Renombrar caldera', k.nombre, '', nombre => updateDoc(catRef('calderas', k.id), { nombre }).catch(errEsc));
  $('#bDel').onclick = () => {
    if (shs.length || usada) return toast('Primero elimina sus sobrecalentadores y sus levantamientos');
    if (!confirm(`¿Eliminar la caldera ${k.nombre}?`)) return;
    writeBatch(db).delete(catRef('calderas', k.id)).commit().catch(errEsc); ir({ cid: k.cid, pid: k.pid });
  };
}

// evento de la planta: sus calderas
function vistaEvento() {
  const e = proy(S.ruta.prj); if (!e) return ir({ cid: S.ruta.cid, pid: S.ruta.pid });
  titulo(e.nombre);
  const ks = S.cat.calderas.filter(k => k.pid === e.pid), levs = levsDe(e.id);
  app.innerHTML = cabSimple(esc(e.nombre), `${esc(cli(e.cid)?.nombre || '')} · ${esc(pla(e.pid)?.nombre || '')} · ${e.anio}`) +
    `<h3>Calderas</h3>` +
    (ks.map(k => {
      const shs = shDe(k.id), tot = shs.reduce((a, x) => a + (levEv(e.id, x.id)?.n || x.n || 0), 0), ins = shs.reduce((a, x) => a + nInsp(levEv(e.id, x.id)), 0);
      return itemNav(`data-kid="${k.id}"`, 'caldera', esc(k.nombre), shs.length ? `${plural(shs.length, 'sobrecalentador', 'sobrecalentadores')} · ${ins} de ${tot} niveles inspeccionados` : 'Sin sobrecalentadores configurados');
    }).join('') || '<p class="vacio">La planta no tiene calderas. Vuelve atrás y agrégalas en "Calderas y sobrecalentadores".</p>') +
    `<button class="btn pri" id="bRes">${ic('lista')}Resumen de hallazgos del evento</button>` +
    `<div class="acciones"><button class="btn" id="bRen">${ic('editar')}Nombre y año</button><button class="btn peligro" id="bDel">${ic('borrar')}Eliminar</button></div>`;
  app.querySelectorAll('[data-kid]').forEach(b => b.onclick = () => ir({ cid: e.cid, pid: e.pid, prj: e.id, kid: b.dataset.kid }));
  $('#bRen').onclick = () => formEvento(e, pla(e.pid));
  $('#bRes').onclick = () => resumenHallazgos(e.id);
  $('#bDel').onclick = () => {
    if (levs.length && prompt(`Se borrará el evento "${e.nombre}" con todos sus candados y fotos (${plural(levs.length, 'sobrecalentador', 'sobrecalentadores')}), para todos los usuarios.\nEscribe BORRAR para confirmar.`) !== 'BORRAR') return;
    if (!levs.length && !confirm(`¿Eliminar el evento ${e.nombre}?`)) return;
    levs.forEach(l => borrarLev(l.id));
    writeBatch(db).delete(catRef('proyectos', e.id)).commit().catch(errEsc);
    ir({ cid: e.cid, pid: e.pid });
  };
}

// caldera dentro del evento: sus sobrecalentadores → candados
function vistaEventoCaldera() {
  const e = proy(S.ruta.prj), k = cal(S.ruta.kid); if (!e || !k) return ir({ cid: S.ruta.cid, pid: S.ruta.pid, prj: S.ruta.prj });
  titulo(`${k.nombre} · ${e.nombre}`);
  const shs = shDe(k.id), levs = levsDe(e.id, k.id), huerfanos = levs.filter(l => !shs.some(x => x.id === l.sid));
  const cq = bloqueCroquis(k.id);
  app.innerHTML = cabSimple(esc(k.nombre), `${esc(e.nombre)} · ${esc(pla(e.pid)?.nombre || '')}`) +
    `<div class="${cq ? 'vgr siempre' : ''}">${cq ? `<aside class="lado">${cq}</aside>` : ''}<div>` +
    `<h3>Sobrecalentadores</h3>` +
    (shs.map(x => {
      const l = levs.find(l => l.sid === x.id);
      return itemNav(`data-sid="${x.id}"`, 'grilla', esc(x.nombre), l ? `${inspTxt(l)} · iniciado por ${esc(l.u)}` : `${dimTxt(x)} · sin iniciar`);
    }).join('') || '<p class="vacio">Esta caldera no tiene sobrecalentadores.</p>') +
    huerfanos.map(l => itemNav(`data-id="${l.id}"`, 'grilla', esc(l.nombre), 'Sobrecalentador eliminado de la caldera')).join('') +
    `<button class="btn pri" id="bRes">${ic('lista')}Resumen de hallazgos</button><button class="btn" id="bInfC">${ic('informe')}Informe de la caldera completa</button><button class="btn" id="bCfg">${ic('ajustes')}Configurar sobrecalentadores</button></div></div>`;
  $('#bRes').onclick = () => resumenHallazgos(e.id, k.id);
  $('#bInfC').onclick = () => menuInforme(e.id, k.id);
  conectarCroquis(k.id, e.id);
  app.querySelectorAll('[data-sid]').forEach(b => b.onclick = () => abrirSobre(e, k, sobre(b.dataset.sid)));
  app.querySelectorAll('[data-id]').forEach(b => b.onclick = () => abrirLev(b.dataset.id));
  $('#bCfg').onclick = () => ir({ cid: k.cid, pid: k.pid, kid: k.id });
}

// abre la grilla de candados del sobrecalentador en el evento (la crea la primera vez)
function abrirSobre(e, k, x) {
  const l = levsDe(e.id, k.id).find(l => l.sid === x.id);
  if (l) return abrirLev(l.id);
  const ref = doc(collection(db, 'levantamientos'));
  const d = { nombre: e.nombre, anio: e.anio, cid: k.cid, pid: k.pid, kid: k.id, prj: e.id, sid: x.id, p: x.p, n: x.n, t: x.t, nn: x.nn || [], c: Date.now(), u: S.nombre, uid: S.uid };
  setDoc(ref, d).catch(errEsc);
  S.levs = [{ id: ref.id, ...d }, ...S.levs];
  abrirLev(ref.id);
}

function formNombre(tit, val, ph, ok) {
  hoja(`<h3>${esc(tit)}</h3><label>Nombre<input id="fNom" value="${esc(val)}" placeholder="${esc(ph)}"></label>
    <div class="acciones"><button class="btn" data-x>Cancelar</button><button class="btn pri" id="fOk">Guardar</button></div>`);
  const i = $('#fNom'); i.focus();
  $('#fOk').onclick = () => { const v = i.value.trim(); if (!v) return toast('Escribe un nombre'); cerrarModal(); ok(v); };
}

function formSobre(x, k) {
  const d = x || ls.get('ties_dim', { p: 25, n: 7, t: 15 }), usados = x ? S.levs.filter(l => l.sid === x.id).length : 0;
  hoja(`<div class="dcab"><h3>${x ? 'Sobrecalentador' : 'Nuevo sobrecalentador · ' + esc(k.nombre)}</h3><button class="x" data-x>${ic('cerrar', 28)}</button></div>
    <label>Nombre<input id="fNom" value="${esc(x?.nombre || '')}" placeholder="Ej. Sobrecalentador Primario"></label>
    <div class="fila3">
      <label>Paneles<input id="fP" type="number" inputmode="numeric" value="${d.p}"></label>
      <label>Tubos<input id="fT" type="number" inputmode="numeric" value="${d.t}"></label>
      <label>Niveles<input id="fN" type="number" inputmode="numeric" value="${d.n}"></label>
    </div>
    <label>Nombre de cada nivel de candados (opcional, uno por línea)<textarea id="fNiv" rows="4" placeholder="Nivel 1&#10;Nivel 2&#10;…">${esc((x?.nn || []).join('\n'))}</textarea></label>
    <p class="nota">Un candado entre cada par de tubos. Si escribes los nombres, la cantidad de niveles es la de la lista.${usados ? ` Los ${usados} levantamientos ya iniciados mantienen sus paneles y tubos; los nombres de los niveles sí se actualizan.` : ''}</p>
    <div class="acciones"><button class="btn" data-x>Cancelar</button><button class="btn pri" id="fOk">Guardar</button></div>
    ${x ? `<button class="btn peligro" id="fDel">${ic('borrar')}Eliminar sobrecalentador</button>` : ''}`);
  const fNiv = $('#fNiv'), fN = $('#fN');
  fNiv.oninput = () => { const c = fNiv.value.split('\n').filter(v => v.trim()).length; if (c) fN.value = c; };
  $('#fOk').onclick = () => {
    const nombre = $('#fNom').value.trim(), nn = fNiv.value.split('\n').map(v => v.trim()).filter(Boolean);
    const p = num('#fP', 1, 200), t = num('#fT', 2, 100), n = nn.length || num('#fN', 1, 30);
    if (!nombre || !p || !t || !n || n > 30) return toast('Revisa el nombre y las cantidades');
    ls.set('ties_dim', { p, n, t }); cerrarModal();
    if (x) return updateDoc(catRef('sobrecalentadores', x.id), { nombre, p, n, t, nn }).catch(errEsc);
    crearCat('sobrecalentadores', { nombre, cid: k.cid, pid: k.pid, kid: k.id, p, n, t, nn }); pantalla();
  };
  if (x) $('#fDel').onclick = () => {
    if (usados) return toast(`Tiene ${plural(usados, 'levantamiento', 'levantamientos')} en proyectos: elimínalos primero`);
    if (!confirm(`¿Eliminar ${x.nombre}?`)) return;
    writeBatch(db).delete(catRef('sobrecalentadores', x.id)).commit().catch(errEsc);
    S.cat.sobrecalentadores = S.cat.sobrecalentadores.filter(y => y.id !== x.id); cerrarModal(); pantalla();
  };
}

function formEvento(e, p) {
  const anio = e?.anio || new Date().getFullYear();
  hoja(`<h3>${e ? 'Evento' : 'Nuevo evento · ' + esc(p?.nombre || '')}</h3>
    <div class="fila2"><label>Año<input id="fAn" type="number" inputmode="numeric" value="${anio}"></label>
    <label>Nombre<input id="fNom" value="${esc(e?.nombre || 'PGP ' + anio)}"></label></div>
    <p class="nota">Dentro del evento aparecen las calderas de la planta y, en cada una, sus sobrecalentadores con la grilla de candados.</p>
    <div class="acciones"><button class="btn" data-x>Cancelar</button><button class="btn pri" id="fOk">${e ? 'Guardar' : 'Crear'}</button></div>`);
  const an = $('#fAn'), nom = $('#fNom');
  an.oninput = () => { if (/^PGP \d{0,4}$/.test(nom.value)) nom.value = 'PGP ' + an.value; };
  $('#fOk').onclick = () => {
    const a = num('#fAn', 1990, 2100), nombre = nom.value.trim();
    if (!a || !nombre) return toast('Revisa el año y el nombre');
    cerrarModal();
    if (e) {
      const b = writeBatch(db).update(catRef('proyectos', e.id), { nombre, anio: a });
      levsDe(e.id).forEach(l => b.update(levRef(l.id), { nombre, anio: a }));
      return b.commit().catch(errEsc);
    }
    if (eventosDe(p.id).some(x => x.anio === a && x.nombre === nombre) && !confirm(`Ya existe "${nombre}" en ${a}. ¿Crear otro igual?`)) return;
    ir({ cid: p.cid, pid: p.id, prj: crearCat('proyectos', { nombre, anio: a, cid: p.cid, pid: p.id }) });
  };
}

function tituloLev() {
  if (!S.lev) return;
  const x = sobre(S.lev.sid), k = cal(S.lev.kid);
  titulo(x ? `${x.nombre} · ${S.lev.nombre}` : k ? `${k.nombre} · ${S.lev.nombre}` : S.lev.nombre);
}

function abrirLev(id) {
  const l = S.levs.find(x => x.id === id); if (!l) return;
  guardia();
  S.lev = l; S.levId = id; ls.set('ties_lev', id);
  S.nivel = Math.min(S.nivelPend || ls.get('ties_nivel_' + id, 1), l.n); S.nivelPend = null; ls.set('ties_nivel_' + id, S.nivel);
  S.inds = new Map(); S.primera = true; S.vista = 'grilla'; S.filtroN = 0;
  if (l.kid) { S.ruta = { cid: l.cid, pid: l.pid, prj: l.prj || null, kid: l.kid }; ls.set('ties_ruta', S.ruta); }
  tituloLev();
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
  window.scrollTo(0, 0); pantalla();
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
const SVG_CSS = '.tb{fill:#dde6ef;stroke:#1f3a57;stroke-width:1.6}.tbi{fill:#fff}.fz{fill:#eef3f8}.fondo{fill:#fff}' +
  '.cv{fill:#fff;stroke:#1f3a57;stroke-width:1.4}.ci{fill:#F48FB1;stroke:#c2185b;stroke-width:1}.cf{fill:#D32F2F;stroke:#8e1b1b;stroke-width:1}' +
  'text{font-family:system-ui,Roboto,Arial,sans-serif;text-anchor:middle;dominant-baseline:central}' +
  '.ti,.tf{font-size:8.5px;font-weight:700}.ti{fill:#5a0d26}.tf{fill:#fff}' +
  '.pl{font-size:10.5px;font-weight:700;fill:#0E3A5F;text-anchor:start}.pl.r{fill:#D32F2F}.pl.v{fill:#1b5e20}.pok{fill:#d9f0db;stroke:#66bb6a;stroke-width:.8}.tn{font-size:7px;fill:#33475b}';

// Los dibujos se muestran como imagen: el modo oscuro forzado del teléfono invierte el HTML pero no las imágenes
const comoImg = (svg, estilo = '') => `<img class="dib" alt="" draggable="false" style="${estilo}" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}">`;
const dibujo = el => el?.querySelector('img.dib, svg');

// grilla que se dibuja: la abierta, o la que fije S.gctx mientras se arma un informe (el dibujo es síncrono)
const GL = () => S.gctx?.l || S.lev, GI = () => S.gctx?.inds || S.inds;

function filaSVG(n, p, y, L) {
  const { u, rh } = G, t = GL().t, my = y + rh / 2;
  let s = '';
  for (let i = 1; i <= t; i++) {
    const cx = L + (i - 0.5) * u;
    s += `<rect x="${cx - 5.5}" y="${y + 3}" width="11" height="${rh - 6}" rx="5.5" class="tb"/><rect x="${cx - 1.5}" y="${y + 8}" width="3" height="${rh - 16}" rx="1.5" class="tbi"/>`;
  }
  for (let c = 1; c < t; c++) {
    const cx = L + c * u, x = GI().get(key(n, p, c));
    s += x
      ? `<rect x="${cx - 7.5}" y="${my - 6.5}" width="15" height="13" rx="2.5" class="${completa(x) ? 'cf' : 'ci'}"/><text x="${cx}" y="${my + 0.5}" class="${completa(x) ? 'tf' : 'ti'}">${esc(ini(x))}</text>`
      : `<rect x="${cx - 6.5}" y="${my - 4}" width="13" height="8" rx="2" class="cv"/>`;
  }
  return s;
}

const numerosTubo = (L, y, todos) => {
  const t = GL().t, paso = todos ? 1 : t > 30 ? 5 : t > 16 ? 2 : 1;
  return range(t).filter(i => i === 1 || i % paso === 0).map(i => `<text x="${L + (i - 0.5) * G.u}" y="${y}" class="tn">${i}</text>`).join('');
};
const panelCon = (n, p) => range(GL().t - 1).some(c => GI().has(key(n, p, c)));

// nivel completo: se usa en pantalla y en la lámina (w, h = tamaño en px para la lámina)
function svgNivel(n, w, h) {
  const l = GL(), { L, u, rh, top } = G, W = L + l.t * u, H = top + l.p * rh;
  let s = numerosTubo(L, top / 2);
  for (let p = 1; p <= l.p; p++) {
    const y = top + (p - 1) * rh;
    const ok = inspP(l, n, p);
    if (ok) s += `<rect x="0" y="${y + 1}" width="${W}" height="${rh - 2}" rx="3" class="pok"/>`;
    else if (p % 2 === 0) s += `<rect x="0" y="${y}" width="${W}" height="${rh}" class="fz"/>`;
    s += `<text x="2" y="${y + rh / 2}" class="pl${panelCon(n, p) ? ' r' : ok ? ' v' : ''}">${ok ? '✓' : ''}P${pad(p)}</text>` + filaSVG(n, p, y, L);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${w || W * 2}" height="${h || H * 2}"><style>${SVG_CSS}</style><rect class="fondo" width="${W}" height="${H}"/>${s}</svg>`;
}

// candado bajo el dedo (null = fuera de la fila)
function puntoSVG(e, el, L, ancho) {
  const r = el.getBoundingClientRect(), k = ancho / r.width;
  const xu = (e.clientX - r.left) * k, yu = (e.clientY - r.top) * k - G.top;
  return { xu, p: Math.floor(yu / G.rh) + 1, c: Math.round((xu - L) / G.u), yu };
}

function cabNivel(sub, chips) {
  return `<div class="cabniv"><div class="ctit">${sub}</div></div><div class="niveles fijo">${chips}</div>`;
}

// ---------- croquis de la caldera: sobrecalentadores lado a lado, N1 arriba ----------
const CQ = { m: 8, w: 50, g: 16, top: 42, h: 300 };
const abrevSH = t => String(t).replace(/sobrecalentador/i, 'SH').replace(/\s+/g, ' ').trim();
function partirTxt(t, max = 9) {
  const out = []; let lin = '';
  for (const p of t.split(' ')) { if ((lin + ' ' + p).trim().length > max && lin) { out.push(lin); lin = p; } else lin = (lin + ' ' + p).trim(); }
  if (lin) out.push(lin); return out.slice(0, 3);
}
function svgCroquis(kid, sidAct, nivAct, cnt = {}) {
  const shs = shDe(kid), { m, w, g, top, h } = CQ, W = m * 2 + shs.length * (w + g) - g, H = top + h + 22;
  let s = `<line x1="0" y1="${top}" x2="${W}" y2="${top}" stroke="#7b8fa4" stroke-width="2"/>`;
  shs.forEach((x, i) => {
    const prj = S.lev?.prj || S.ruta.prj, x0 = m + i * (w + g), act = x.id === sidAct, n = x.n || 1, paso = h / n, lv = levEv(prj, x.id), cn = act ? cnt : conteoSH(prj, x.id);
    const lab = partirTxt(abrevSH(x.nombre));
    s += `<g data-col="${i}"><rect x="${x0}" y="2" width="${w}" height="${top - 6}" rx="4" fill="${act ? '#F5A300' : '#dfe6ee'}"/>` +
      lab.map((t, j) => `<text x="${x0 + w / 2}" y="${(top - 4) / 2 + (j - (lab.length - 1) / 2) * 10}" class="cl">${esc(t)}</text>`).join('') +
      `<rect x="${x0}" y="${top}" width="${w}" height="${h}" fill="${act ? '#55606d' : '#7a8592'}"/>`;
    for (let k = x0 + 3; k < x0 + w; k += 4) s += `<line x1="${k}" y1="${top}" x2="${k}" y2="${top + h}" stroke="${act ? '#8a96a3' : '#a3adb8'}" stroke-width="1"/>`;
    for (let k = 0; k < 3; k++) s += `<path d="M${x0 + 5 + k * 14} ${top + h} a6 6 0 0 0 12 0" fill="none" stroke="#8a96a3" stroke-width="2"/>`;
    for (let j = 1; j <= n; j++) {
      const y = top + (j - 0.5) * paso, on = act && j === nivAct;
      const ok = inspN(lv, j), hz = cn[j] || 0;
      s += `<line x1="${x0 - 3}" y1="${y}" x2="${x0 + w + 3}" y2="${y}" stroke="${on ? '#F5A300' : hz ? '#D32F2F' : ok ? '#2e7d32' : '#0b2a5c'}" stroke-width="${on ? 5 : hz || ok ? 4 : 2.2}"/>`;
      if (!act && hz) s += `<circle cx="${x0 + w / 2}" cy="${y}" r="6.5" fill="#D32F2F"/><text x="${x0 + w / 2}" y="${y}" class="cc">${hz}</text>` + (ok ? `<circle cx="${x0 + 6}" cy="${y}" r="4.5" fill="#2e7d32"/><path d="M${x0 + 4} ${y} l1.4 1.4 l2.6 -2.8" stroke="#fff" stroke-width="1.2" fill="none"/>` : '');
      else if (ok && !act) s += `<circle cx="${x0 + w / 2}" cy="${y}" r="5" fill="#2e7d32"/><path d="M${x0 + w / 2 - 2.5} ${y} l1.8 1.8 l3.2 -3.4" stroke="#fff" stroke-width="1.4" fill="none"/>`;
      if (act) {
        const t = ((x.nn || [])[j - 1] || 'N' + j).slice(0, 7);
        s += `<rect x="${x0 + 4}" y="${y - 7}" width="${w - 8}" height="14" rx="3" fill="${on ? '#F5A300' : ok ? '#c8e6c9' : '#fff'}" stroke="${ok ? '#2e7d32' : 'none'}"/><text x="${x0 + w / 2}" y="${y}" class="cn">${esc(ok ? '✓' + t : t)}</text>`;
        if (hz) s += `<circle cx="${x0 + w + 2}" cy="${y}" r="7" fill="#D32F2F"/><text x="${x0 + w + 2}" y="${y}" class="cc">${hz}</text>`;
      }
    }
    s += '</g>';
  });
  const css = 'text{font-family:system-ui,Roboto,Arial,sans-serif;text-anchor:middle;dominant-baseline:central}.cl{font-size:8.5px;font-weight:700;fill:#0E3A5F}.cn{font-size:8px;font-weight:700;fill:#0E3A5F}.cc{font-size:8px;font-weight:700;fill:#fff}';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}"><style>${css}</style><rect width="${W}" height="${H}" fill="#fff"/>${s}</svg>`;
}
// toque en el croquis: otro sobrecalentador → abrirlo en el evento; el activo → cambiar de nivel
function tocarCroquis(e, el, kid, prj) {
  const sv = dibujo(el); if (!sv) return;
  const shs = shDe(kid), { m, w, g, top, h } = CQ, W = m * 2 + shs.length * (w + g) - g;
  const r = sv.getBoundingClientRect(), k = W / r.width, xu = (e.clientX - r.left) * k, yu = (e.clientY - r.top) * k;
  const i = Math.floor((xu - m + g / 2) / (w + g)), x = shs[i]; if (!x) return;
  if (S.lev && x.id === S.lev.sid) {
    if (yu < top) return;
    const j = Math.min(S.lev.n, Math.max(1, Math.floor((yu - top) / (h / (x.n || 1))) + 1));
    cerrarModal(); S.nivel = j; ls.set('ties_nivel_' + S.lev.id, j); return render();
  }
  const ev = proy(prj); if (!ev) return;
  cerrarModal();
  if (S.lev) { S.unsubInds?.(); S.unsubInds = null; S.lev = null; }
  abrirSobre(ev, cal(kid), x);
}
// ---------- croquis referencial con niveles detectados ----------
// cqmap = { cols: [{ sid, x1, x2, ys: [y de cada nivel, de arriba (N1) hacia abajo] }] } con coordenadas 0–1 de la imagen
async function detectarNiveles(src, kid) {
  const im = await cargarImg(src), e = Math.min(1, 900 / Math.max(im.naturalWidth, im.naturalHeight));
  const W = Math.round(im.naturalWidth * e), H = Math.round(im.naturalHeight * e);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.drawImage(im, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;
  // líneas de nivel: azul marino sobre tubos grises
  const azul = i => { const r = px[i], gg = px[i + 1], b = px[i + 2]; return b - r > 35 && b - gg > 15 && b < 225; };
  const lineas = [], min = Math.max(6, W * 0.03);
  for (let y = 0; y < H; y++) {
    let x = 0;
    while (x < W) {
      if (azul((y * W + x) * 4)) {
        const x0 = x; while (x < W && azul((y * W + x) * 4)) x++;
        if (x - x0 >= min) {
          const L = lineas.find(L => y - L.y2 <= 2 && Math.min(x, L.x2) - Math.max(x0, L.x1) > 0.5 * Math.min(x - x0, L.x2 - L.x1));
          if (L) { L.y2 = y; L.x1 = Math.min(L.x1, x0); L.x2 = Math.max(L.x2, x); } else lineas.push({ y1: y, y2: y, x1: x0, x2: x });
        }
      }
      x++;
    }
  }
  if (!lineas.length) return { cols: [] };
  const ancho = L => L.x2 - L.x1, maxW = Math.max(...lineas.map(ancho));
  // columnas (sobrecalentadores) a partir de las líneas largas, de izquierda a derecha
  const largas = lineas.filter(L => ancho(L) >= 0.5 * maxW).sort((a, b) => (a.x1 + a.x2) - (b.x1 + b.x2));
  const cols = [];
  largas.forEach(L => {
    const c = cols[cols.length - 1], cx = (L.x1 + L.x2) / 2;
    if (c && cx - c.cx < 0.5 * maxW) { c.x1s.push(L.x1); c.x2s.push(L.x2); c.cx = (c.cx * c.n + cx) / ++c.n; }
    else cols.push({ cx, n: 1, x1s: [L.x1], x2s: [L.x2], ys: [] });
  });
  const med = a => [...a].sort((p, q) => p - q)[Math.floor(a.length / 2)];
  cols.forEach(c => { c.x1 = med(c.x1s); c.x2 = med(c.x2s); });
  // cada línea al sobrecalentador con el que más se superpone (incluye tramos cortos del fondo escalonado)
  lineas.forEach(L => {
    let mejor = null, sup = 0;
    cols.forEach(c => { const o = Math.min(L.x2, c.x2) - Math.max(L.x1, c.x1); if (o > sup) { sup = o; mejor = c; } });
    if (!mejor || ancho(L) < 0.4 * (mejor.x2 - mejor.x1)) return;
    const y = (L.y1 + L.y2) / 2;
    if (!mejor.ys.some(v => Math.abs(v - y) < H * 0.012)) mejor.ys.push(y);
  });
  const shs = shDe(kid);
  return { cols: cols.filter(c => c.ys.length).map((c, i) => ({ sid: shs[i]?.id || null, x1: c.x1 / W, x2: c.x2 / W, ys: c.ys.sort((a, b) => a - b).map(y => y / H) })) };
}

// imagen del croquis con las marcas dibujadas encima (se muestra como <img>: el modo oscuro no la invierte)
const cacheMapa = new Map();
async function imagenMapa(k, { sid, nivel, cnt = {}, editar, mapa } = {}) {
  const m = mapa || k.cqmap; if (!k.img || !m) return null;
  const prj = S.lev?.prj || S.ruta.prj, ins = editar ? [] : m.cols.map(c => levEv(prj, c.sid)?.insp || {});
  const cnts = editar ? [] : m.cols.map(c => c.sid && c.sid === sid ? cnt : conteoSH(prj, c.sid));
  const clave = JSON.stringify([k.id, k.img.length, m, sid, nivel, cnts, editar, ins]);
  if (cacheMapa.has(clave)) return cacheMapa.get(clave);
  const im = await cargarImg(k.img), e = Math.min(1, 1400 / Math.max(im.naturalWidth, im.naturalHeight));
  const W = Math.round(im.naturalWidth * e), H = Math.round(im.naturalHeight * e), u = Math.max(W, H) / 100;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(im, 0, 0, W, H);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const chip = (x, y, t, fondo, letra, r = 1.9 * u) => {
    g.font = `bold ${Math.round(r * 1.05)}px sans-serif`; const w = Math.max(2 * r, g.measureText(t).width + r);
    g.fillStyle = fondo; g.beginPath(); g.roundRect(x - w / 2, y - r, w, 2 * r, r * 0.5); g.fill();
    g.strokeStyle = '#0E3A5F'; g.lineWidth = u * 0.25; g.stroke(); g.fillStyle = letra; g.fillText(t, x, y + 0.5);
  };
  m.cols.forEach((c, ci) => {
    const x1 = c.x1 * W, x2 = c.x2 * W, act = c.sid && c.sid === sid, x = sobre(c.sid);
    if (editar) {
      g.fillStyle = 'rgba(245,163,0,.95)'; chip((x1 + x2) / 2, 2.2 * u, x ? abrevSH(x.nombre).slice(0, 14) : `Columna ${ci + 1}`, '#F5A300', '#1b1300', 1.7 * u);
    }
    if (act) { g.strokeStyle = '#F5A300'; g.lineWidth = u * 0.6; g.strokeRect(x1 - u, 0.5 * u, x2 - x1 + 2 * u, H - u); }
    c.ys.forEach((yy, j) => {
      const y = yy * H, on = act && nivel === j + 1, ok = !editar && ins[ci]?.[j + 1], hz = editar ? 0 : cnts[ci]?.[j + 1] || 0;
      if ((ok || hz) && !on) {
        g.strokeStyle = hz ? '#D32F2F' : '#2e7d32'; g.lineWidth = u * 0.9; g.beginPath(); g.moveTo(x1 - u * 0.6, y); g.lineTo(x2 + u * 0.6, y); g.stroke();
        if (!act) {
          if (hz) { chip((x1 + x2) / 2, y, String(hz), '#D32F2F', '#fff', 1.6 * u); if (ok) chip(x1 + 1.2 * u, y, '✓', '#2e7d32', '#fff', 1.3 * u); }
          else chip((x1 + x2) / 2, y, '✓', '#2e7d32', '#fff', 1.5 * u);
        }
      }
      if (editar || act) {
        if ((!ok && !hz) || on) { g.strokeStyle = on ? '#F5A300' : editar ? '#F5A300' : 'rgba(14,58,95,.9)'; g.lineWidth = on ? u * 1.1 : u * 0.45; g.beginPath(); g.moveTo(x1 - u * 0.6, y); g.lineTo(x2 + u * 0.6, y); g.stroke(); }
        const nom = (x?.nn || [])[j] || `N${j + 1}`;
        chip(x1 + 2.6 * u, y, (ok ? '✓' : '') + nom.slice(0, 6), on ? '#F5A300' : ok ? '#c8e6c9' : '#fff', '#0E3A5F');
        if (act && hz) chip(x2 - 0.5 * u, y, String(hz), '#D32F2F', '#fff', 1.6 * u);
      }
    });
  });
  const d = cv.toDataURL('image/jpeg', 0.85), res = { d, w: W, h: H };
  if (cacheMapa.size > 30) cacheMapa.clear();
  cacheMapa.set(clave, res); return res;
}
// punto tocado sobre la imagen → { col, nivel }
function puntoMapa(e, el, m) {
  const r = el.getBoundingClientRect(), u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
  const col = m.cols.find(c => u >= c.x1 - 0.03 && u <= c.x2 + 0.03); if (!col) return null;
  let nivel = 0, d = 1; col.ys.forEach((y, j) => { const dd = Math.abs(y - v); if (dd < d) { d = dd; nivel = j + 1; } });
  return { col, nivel: d < 0.06 ? nivel : 0, u, v };
}
async function pintarMapa(sel, k, op) {
  const el = $(sel); if (!el) return;
  const res = await imagenMapa(k, op); if (!res || !$(sel)) return;
  el.src = res.d;
}
function tocarMapa(e, el, kid, prj) {
  const k = cal(kid), p = k?.cqmap && puntoMapa(e, el, k.cqmap); if (!p || !p.col.sid) return;
  const x = sobre(p.col.sid); if (!x) return;
  if (S.lev && x.id === S.lev.sid) {
    if (!p.nivel) return; cerrarModal(); S.nivel = Math.min(p.nivel, S.lev.n); ls.set('ties_nivel_' + S.lev.id, S.nivel); return render();
  }
  const ev = proy(prj); if (!ev) return;
  cerrarModal(); S.nivelPend = p.nivel || 1;
  if (S.lev) { S.unsubInds?.(); S.unsubInds = null; S.lev = null; }
  abrirSobre(ev, k, x);
}

// revisar / corregir los niveles detectados antes de guardarlos
function editorNiveles(kid, mapa) {
  const k = cal(kid), shs = shDe(kid); if (!k?.img) return;
  let m = JSON.parse(JSON.stringify(mapa || k.cqmap || { cols: [] }));
  hoja(`<div class="dcab"><h3>Niveles del croquis</h3><button class="x" data-x>${ic('cerrar', 28)}</button></div>
    <p class="nota">Revisa las líneas detectadas. Toca una línea para quitarla o toca dentro de un sobrecalentador para agregar un nivel. N1 es el de más arriba.</p>
    <div id="edCols"></div>
    <img class="cqfoto" id="edImg" alt="" style="cursor:crosshair">
    <label class="sw"><input type="checkbox" id="edCant"> Ajustar la cantidad de niveles de cada sobrecalentador según el croquis</label>
    <div class="acciones"><button class="btn" id="edDet">${ic('ajustes')}Volver a detectar</button><button class="btn pri" id="edOk">Guardar niveles</button></div>`);
  const pintar = () => {
    $('#edCols').innerHTML = m.cols.map((c, i) => {
      const x = sobre(c.sid), dif = x && x.n !== c.ys.length;
      return `<div class="edcol"><b>Columna ${i + 1}</b><select data-ci="${i}"><option value="">— sin asignar —</option>${shs.map(s => `<option value="${s.id}" ${s.id === c.sid ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select>
        <span class="${dif ? 'pend' : 'ok'}">${c.ys.length} detectados${x ? ` · ${x.n} en TIES` : ''}</span></div>`;
    }).join('') || '<p class="aviso">No se encontraron líneas azules de nivel en la imagen.</p>';
    $('#edCols').querySelectorAll('select').forEach(sl => sl.onchange = () => { m.cols[+sl.dataset.ci].sid = sl.value || null; pintar(); });
    pintarMapa('#edImg', k, { editar: true, mapa: m });
  };
  $('#edImg').onclick = e => {
    const p = puntoMapa(e, e.currentTarget, m); if (!p) return;
    const j = p.col.ys.findIndex(y => Math.abs(y - p.v) < 0.015);
    if (j >= 0) p.col.ys.splice(j, 1); else { p.col.ys.push(p.v); p.col.ys.sort((a, b) => a - b); }
    pintar();
  };
  $('#edDet').onclick = async () => { m = await detectarNiveles(k.img, kid); pintar(); toast(`${m.cols.length} sobrecalentador(es) detectados`); };
  $('#edOk').onclick = () => {
    const ajustar = $('#edCant').checked, b = writeBatch(db);
    b.update(catRef('calderas', kid), { cqmap: m });
    if (ajustar) m.cols.forEach(c => { const x = sobre(c.sid); if (x && c.ys.length && c.ys.length !== x.n) b.update(catRef('sobrecalentadores', x.id), { n: c.ys.length, nn: (x.nn || []).slice(0, c.ys.length) }); });
    b.commit().catch(errEsc);
    k.cqmap = m; cerrarModal(); toast('Niveles del croquis guardados'); if (S.lev) render(); else pantalla();
  };
  pintar();
}

function bloqueCroquis(kid) {
  const k = cal(kid); if (!k || !shDe(kid).length) return '';
  const mapa = k.img && k.cqmap?.cols?.length;
  return `<div class="cqtit">Croquis · ${esc(k.nombre)}</div>
    ${mapa ? `<div class="cq ref"><img class="dib" id="cqRef" alt=""><span>Toca un nivel para verlo u otro sobrecalentador para abrirlo</span></div>`
      : k.img ? `<button class="cqimg" id="cqImg"><img src="${k.img}" alt=""><span>Croquis referencial · toca para ampliar</span></button>` : ''}
    <div class="acciones cqacc">${k.img ? `<button class="btn chico" id="cqNiv">${ic('ajustes')}${mapa ? 'Editar niveles' : 'Detectar niveles'}</button>` : ''}
    <button class="btn chico" id="cqCarga">${ic('galeria')}${k.img ? 'Cambiar croquis' : 'Cargar croquis referencial'}</button></div>
    ${mapa ? '' : `<div class="cqtit sub">Niveles · toca para navegar</div>
    <div class="cq" id="cq">${comoImg(svgCroquis(kid, S.lev?.sid, S.nivel, S.lev ? conteoNiveles() : {}))}</div>`}`;
}
function cargarCroquis(kid) { S.camK = null; S.croquisK = kid; const i = $('#gal'); i.value = ''; i.click(); }
function conectarCroquis(kid, prj) {
  if (prj) seguirConteos(prj, kid);
  app.querySelectorAll('#cq').forEach(c => c.onclick = e => tocarCroquis(e, c, kid, prj));
  const b = $('#cqImg'); if (b) b.onclick = () => visor(cal(kid).img, { titulo: 'Croquis · ' + cal(kid).nombre, nombre: `Croquis ${limpio(cal(kid).nombre)}.jpg` });
  const c = $('#cqCarga'); if (c) c.onclick = () => cargarCroquis(kid);
  const k = cal(kid), op = { sid: S.lev?.sid, nivel: S.nivel, cnt: S.lev ? conteoNiveles() : {} };
  const ref = $('#cqRef'); if (ref && k) { pintarMapa('#cqRef', k, op); ref.onclick = e => tocarMapa(e, ref, kid, prj); }
  const nv = $('#cqNiv'); if (nv) nv.onclick = async () => {
    if (k.cqmap?.cols?.length) return editorNiveles(kid);
    nv.disabled = true; editorNiveles(kid, await detectarNiveles(k.img, kid));
  };
}

function vistaGrilla() {
  const l = S.lev, n = S.nivel, cnt = conteoNiveles();
  const chips = range(l.n).map(i => `<button class="chip ${i === n ? 'on' : ''} ${inspN(l, i) ? 'ins' : ''}" data-n="${i}">${inspN(l, i) ? '<b class="chk">✓</b>' : ''}${esc(chipNom(i))}${cnt[i] ? `<i>${cnt[i]}</i>` : ''}</button>`).join('');
  const cq = l.prj && l.sid ? bloqueCroquis(l.kid) : '', ins = inspN(l, n);
  const bIns = `<div class="insbar ${ins ? 'ok' : ''}">${ins ? `<span>${ic('lista', 20)} <b>${esc(nivelNom(n))} inspeccionado</b> por ${esc(ins.u)} · ${fecha(ins.t)}</span><button class="btn chico" id="bIns">Desmarcar</button>`
    : `<span>${esc(nivelNom(n))} sin marcar · ${nPanInsp(l, n)} de ${l.p} paneles inspeccionados</span><button class="btn chico pri" id="bIns">Marcar nivel como inspeccionado</button>`}</div>`;
  const bCq = cq ? `<button class="chip cqchip" id="bCq">${ic('caldera', 22)}Croquis</button>` : '';
  return cabNivel(`<b>Candados — ${esc(nivelNom(n))}</b><span>${cnt[n] || 0} indicación(es) · ${S.inds.size} en total</span>`, bCq + chips) +
    `<div class="${cq ? 'vgr' : ''}">${cq ? `<aside class="lado">${cq}</aside>` : ''}<div>${bIns}
    <div class="gwrap" id="gwrap">${comoImg(svgNivel(n))}</div>
    <div class="leyenda"><span class="ley"><span class="sw ind"></span>falta foto general o de detalle</span><span class="ley"><span class="sw foto"></span>con general y detalle</span>
      <span>${l.t > 16 ? 'Toca un panel para abrirlo en grande.' : 'Toca el candado entre dos tubos, o el nombre del panel para verlo en grande.'}</span></div></div></div>`;
}

function vistaLista() {
  const l = S.lev, f = S.filtroN, cnt = conteoNiveles();
  const xs = [...S.inds.values()].filter(x => !f || x.n === f).sort(ordenar);
  const porTipo = {}; xs.forEach(x => porTipo[x.k] = (porTipo[x.k] || 0) + 1);
  const chips = `<button class="chip ${!f ? 'on' : ''}" data-f="0">Todos<i>${S.inds.size}</i></button>` +
    range(l.n).map(i => `<button class="chip ${i === f ? 'on' : ''}" data-f="${i}">${esc(chipNom(i))}${cnt[i] ? `<i>${cnt[i]}</i>` : ''}</button>`).join('');
  return cabNivel(`<b>Indicaciones${f ? ' — ' + esc(nivelNom(f)) : ''}</b><span>${xs.length}${Object.keys(porTipo).length ? ' · ' + TIPOS.filter(t => porTipo[t]).map(t => `${t} ${porTipo[t]}`).join(' · ') : ''}</span>`, chips) +
    (l.prj ? `<button class="btn pri resbtn" id="bResL">${ic('lista')}Resumen de hallazgos de la caldera</button>` : '') +
    (xs.map(x => `<button class="item ind" data-k="${x.id}"><span class="badge ${completa(x) ? 'foto' : 'ind'}">${esc(ini(x))}</span>
      <div><b>${codigo(x)}</b> · ${esc(tipoTxt(x))}${x.nota ? `<br><span class="nt">${esc(x.nota)}</span>` : ''}
      <small>${esc(x.u)} · ${fecha(x.t)}${x.uu && x.uu !== x.u ? ` · editó ${esc(x.uu)}` : ''} · ${ic('camara', 14)} ${fotosTxt(x)}</small></div></button>`).join('')
    || '<p class="vacio">Sin indicaciones registradas.</p>');
}

function barraInferior() {
  const b = (id, i, tx) => `<button id="${id}">${ic(i, 30)}<span>${tx}</span></button>`;
  return `<nav class="abajo">${S.vista === 'lista' ? b('nVis', 'grilla', 'Grilla') : b('nVis', 'lista', 'Lista')}${b('nInf', 'informe', 'Informe')}${b('nLam', 'lamina', 'Lámina')}${b('nExp', 'compartir', 'Exportar')}${b('nAju', 'ajustes', 'Ajustes')}</nav>`;
}

function conectar() {
  app.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { S.nivel = +b.dataset.n; ls.set('ties_nivel_' + S.lev.id, S.nivel); render(); });
  if (S.lev.prj && S.lev.kid) {
    conectarCroquis(S.lev.kid, S.lev.prj);
    const bc = $('#bCq'); if (bc) bc.onclick = () => {
      const kid = S.lev.kid, k = cal(kid), mapa = k?.img && k.cqmap?.cols?.length;
      hoja(`<div class="dcab"><h3>Croquis · ${esc(k?.nombre || '')}</h3><button class="x" data-x>${ic('cerrar', 28)}</button></div>
        <p class="nota">Toca un nivel para verlo, u otro sobrecalentador para abrirlo.</p>
        ${mapa ? '<img class="cqfoto" id="cqHRef" alt="">' : `${k?.img ? `<img class="cqfoto" id="cqHImg" src="${k.img}" alt="">` : ''}<div class="cq grande" id="cqH">${comoImg(svgCroquis(kid, S.lev.sid, S.nivel, conteoNiveles()))}</div>`}
        <div class="acciones">${k?.img ? `<button class="btn chico" id="cqHNiv">${ic('ajustes')}${mapa ? 'Editar niveles' : 'Detectar niveles'}</button>` : ''}<button class="btn chico" id="cqHCarga">${ic('galeria')}${k?.img ? 'Cambiar croquis' : 'Cargar croquis referencial'}</button></div>`);
      const prj = S.lev.prj;
      if (mapa) { pintarMapa('#cqHRef', k, { sid: S.lev.sid, nivel: S.nivel, cnt: conteoNiveles() }); $('#cqHRef').onclick = e => tocarMapa(e, e.currentTarget, kid, prj); }
      else { const c = $('#cqH'); c.onclick = e => tocarCroquis(e, c, kid, prj); }
      $('#cqHCarga').onclick = () => { cerrarModal(); cargarCroquis(kid); };
      if ($('#cqHNiv')) $('#cqHNiv').onclick = async () => editorNiveles(kid, mapa ? null : await detectarNiveles(k.img, kid));
      const im = $('#cqHImg'); if (im) im.onclick = () => visor(k.img, { titulo: 'Croquis · ' + k.nombre, nombre: `Croquis ${limpio(k.nombre)}.jpg` });
    };
  }
  app.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { S.filtroN = +b.dataset.f; render(); });
  app.querySelectorAll('[data-k]').forEach(b => b.onclick = () => detalle(b.dataset.k));
  const g = $('#gwrap');
  if (g) g.onclick = e => {
    const l = S.lev, { xu, p, c, yu } = puntoSVG(e, dibujo(g), G.L, G.L + l.t * G.u);
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
  $('#nInf').onclick = () => menuInforme();
  const bi = $('#bIns'); if (bi) bi.onclick = () => marcarInspeccion(S.nivel);
  const br = $('#bResL'); if (br) br.onclick = () => resumenHallazgos(S.lev.prj, S.lev.kid);
  $('#nAju').onclick = ajustes;
}

// ---------- panel en grande ----------
function svgPanel(n, p) {
  const L = 4, W = L * 2 + S.lev.t * G.u, H = G.top + G.rh;
  return comoImg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}"><style>${SVG_CSS}</style><rect class="fondo" width="${W}" height="${H}"/>${numerosTubo(L, G.top / 2, true)}${filaSVG(n, p, G.top, L)}</svg>`, `width:${Math.max(S.lev.t * 46, 300)}px`);
}

function verPanel(p) {
  S.panel = p;
  hoja(`<div class="dcab"><h3>Nivel ${S.nivel} · Panel P${pad(p)}</h3><button class="x" data-x>${ic('cerrar', 28)}</button></div>
    <div id="pIns"></div>
    <p class="nota">Toca el candado entre dos tubos. Desliza hacia el lado si no cabe.</p>
    <div class="pwrap" id="pwrap"></div><div id="pLista"></div>`, () => { S.panel = null; });
  pintarPanel();
}

function pintarPanel() {
  const w = $('#pwrap'); if (!w || !S.lev) return;
  const n = S.nivel, p = S.panel, sx = w.scrollLeft;
  w.innerHTML = svgPanel(n, p); w.scrollLeft = sx;
  w.onclick = e => {
    const { c, p: fila } = puntoSVG(e, dibujo(w), 4, 8 + S.lev.t * G.u);
    if (fila === 1 && c >= 1 && c < S.lev.t) tocarCandado(p, c);
  };
  const xs = range(S.lev.t - 1).map(c => S.inds.get(key(n, p, c))).filter(Boolean);
  $('#pLista').innerHTML = xs.map(x => `<button class="item ind" data-k="${x.id}"><span class="badge ${completa(x) ? 'foto' : 'ind'}">${esc(ini(x))}</span>
    <div><b>${codigo(x)}</b> · ${esc(tipoTxt(x))}<small>${esc(x.u)} · ${ic('camara', 14)} ${fotosTxt(x)}</small></div></button>`).join('')
    || '<p class="vacio">Sin indicaciones en este panel.</p>';
  $('#pLista').querySelectorAll('[data-k]').forEach(b => b.onclick = () => { S.panel = null; detalle(b.dataset.k); });
  const ok = inspP(S.lev, n, p), bi = $('#pIns');
  if (bi) {
    bi.innerHTML = `<div class="insbar ${ok ? 'ok' : ''}">${ok ? `<span><b>Panel P${pad(p)} inspeccionado</b> por ${esc(ok.u)} · ${fecha(ok.t)}</span><button class="btn chico" id="pInsB">Desmarcar</button>`
      : `<span>Panel P${pad(p)} sin marcar · ${nPanInsp(S.lev, n)} de ${S.lev.p} paneles</span><button class="btn chico pri" id="pInsB">Marcar panel como inspeccionado</button>`}</div>`;
    $('#pInsB').onclick = () => marcarPanel(n, p);
  }
}

function marcarPanel(n, p) {
  const l = S.lev, ya = inspP(l, n, p);
  if (ya && !confirm(`¿Desmarcar el panel P${pad(p)}? (lo marcó ${ya.u})`)) return;
  const v = ya ? null : { u: S.nombre, t: Date.now() }, ip = { ...(l.ip || {}), [`N${n}_P${p}`]: v }, cambios = { [`ip.N${n}_P${p}`]: v };
  let insp = l.insp || {}, todo = false;
  // todos los paneles inspeccionados → el nivel queda marcado
  if (!ya && !inspN(l, n) && range(l.p).every(q => ip[`N${n}_P${q}`])) { cambios['insp.' + n] = v; insp = { ...insp, [n]: v }; todo = true; }
  updateDoc(levRef(l.id), cambios).catch(errEsc);
  S.lev = { ...l, ip, insp };
  const i = S.levs.findIndex(x => x.id === l.id); if (i >= 0) S.levs[i] = S.lev;
  toast(todo ? `Todos los paneles listos: ${nivelNom(n)} marcado como inspeccionado` : ya ? `Panel P${pad(p)} desmarcado` : `Panel P${pad(p)} inspeccionado`, todo ? 4000 : 2000);
  render(); pintarPanel();
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
    if (ls.get('ties_cam', true)) abrirCamara(k, false, 'general');
  });
}

function abrirCamara(k, galeria, tp = 'general') {
  S.camK = k; S.camTp = tp; const i = galeria ? $('#gal') : $('#cam'); i.value = ''; i.click();
}

$('#cam').onchange = $('#gal').onchange = async e => {
  if (S.logoDest) {
    const dst = S.logoDest, f = e.target.files[0]; S.logoDest = null; e.target.value = '';
    if (!f) return;
    try {
      const d = await procesarLogo(f);
      if (dst.tipo === 'empresa') {
        setDoc(catRef('ajustes', 'empresa'), { logo: d, c: Date.now(), u: S.nombre }).catch(errEsc);
        const a = S.cat.ajustes.find(x => x.id === 'empresa'); if (a) a.logo = d; else S.cat.ajustes.push({ id: 'empresa', logo: d });
      } else { updateDoc(catRef('clientes', dst.id), { logo: d }).catch(errEsc); const c = cli(dst.id); if (c) c.logo = d; }
      toast('Logo guardado'); if (!$('#modal').hidden && dst.tipo === 'empresa') menu(); else if (!S.lev) pantalla();
    } catch (err) { toast('No se pudo procesar el logo: ' + err.message, 5000); }
    return;
  }
  if (S.croquisK) {
    const kid = S.croquisK, f = e.target.files[0]; S.croquisK = null; e.target.value = '';
    if (!f) return;
    try {
      const d = await comprimir(f, null);
      updateDoc(catRef('calderas', kid), { img: d }).catch(errEsc);
      const k = cal(kid); if (k) { k.img = d; k.cqmap = null; }
      updateDoc(catRef('calderas', kid), { cqmap: null }).catch(errEsc);
      toast('Croquis guardado. Detectando niveles…'); if (S.lev) render(); else pantalla();
      if (k) editorNiveles(kid, await detectarNiveles(d, kid));
    }
    catch (err) { toast('No se pudo procesar la imagen: ' + err.message, 5000); }
    return;
  }
  const files = [...e.target.files], k = S.camK, tp = S.camTp === 'detalle' ? 'detalle' : 'general'; e.target.value = '';
  if (!k || !files.length || !S.lev) return;
  for (const f of files) {
    try {
      const x = S.inds.get(k), d = await comprimir(f, x, tp);
      setDoc(doc(fotosCol(k)), { d, tp, t: Date.now(), u: S.nombre, uid: S.uid }).catch(errEsc);
      // la primera vez que se separan, las fotos antiguas cuentan como generales
      updateDoc(indRef(k), { ...conteoFotos(x, tp, 1), nf: increment(1), uu: S.nombre, ut: Date.now() }).catch(errEsc);
      if (x) S.inds.set(k, { ...x, ng: nG(x) + (tp === 'general'), nd: nD(x) + (tp === 'detalle') });
      const falta = x && tp === 'general' && !nD(x);
      toast(`Foto ${FT[tp].toLowerCase()} guardada` + (falta ? '. Ahora toma la foto de detalle.' : '') + (navigator.onLine ? '' : ' (se sube al tener señal)'), falta ? 4500 : 2600);
      if (S.detalle === k) refrescarDetalle();
    } catch (err) { toast('No se pudo procesar la foto: ' + err.message, 5000); }
  }
};

async function comprimir(file, x, tp) {
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
      g.fillStyle = '#fff'; g.font = `bold ${fs}px sans-serif`; g.fillText(`${codigo(x)} · ${tipoTxt(x)}${tp ? ' · ' + FT[tp] : ''}`, fs * 0.6, h + bh * 0.3);
      g.fillStyle = '#F5A300'; g.font = `${Math.round(fs * 0.8)}px sans-serif`; g.fillText(`${nombreCompleto(S.lev)} · ${S.nombre} · ${fecha(Date.now())}`, fs * 0.6, h + bh * 0.72);
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
    ${['general', 'detalle'].map(tp => `<div class="secfoto" id="sec_${tp}"><h4>${ic('camara', 18)} Foto ${tp === 'general' ? 'general' : 'de detalle'} <span id="est_${tp}"></span></h4>
      <div class="fotos" id="dFotos_${tp}"></div>
      <div class="acciones"><button class="btn" id="dCam_${tp}">${ic('camara')}${FT[tp]}</button><button class="btn" id="dGal_${tp}">${ic('galeria')}Galería</button></div></div>`).join('')}
    <p class="meta" id="dMeta"></p>
    <button class="btn peligro" id="dDel">${ic('borrar')}Quitar indicación</button>`, cerrarDetalle);
  const nota = $('#dNota');
  nota.oninput = () => S.notaSucia = true;
  nota.onblur = guardarNota;
  ['general', 'detalle'].forEach(tp => {
    $('#dCam_' + tp).onclick = () => abrirCamara(k, false, tp);
    $('#dGal_' + tp).onclick = () => abrirCamara(k, true, tp);
  });
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
  // resaltar la foto que falta (primero la general, luego la de detalle)
  const falta = !nG(x) ? 'general' : !nD(x) ? 'detalle' : null;
  ['general', 'detalle'].forEach(tp => {
    const n = tp === 'general' ? nG(x) : nD(x);
    $('#dCam_' + tp).classList.toggle('pri', tp === falta);
    $('#est_' + tp).innerHTML = n ? `<b class="ok">✓ ${n}</b>` : '<b class="pend">falta</b>';
  });
  $('#dMeta').innerHTML = `Registró <b>${esc(x.u)}</b> · ${fecha(x.t)}${x.ut ? `<br>Último cambio: <b>${esc(x.uu)}</b> · ${fecha(x.ut)}` : ''}`;
}

const tipoFoto = f => f.tp === 'detalle' ? 'detalle' : 'general';
function pintarFotos() {
  ['general', 'detalle'].forEach(tp => {
    const el = $('#dFotos_' + tp); if (!el) return;
    const fs = S.fotos.filter(f => tipoFoto(f) === tp);
    el.innerHTML = fs.map((f, i) => `<img data-i="${i}" src="${f.d}" alt="">`).join('');
    el.querySelectorAll('img').forEach(im => im.onclick = () => {
      const f = fs[+im.dataset.i], x = S.inds.get(S.detalle), j = +im.dataset.i + 1;
      visor(f.d, {
        titulo: `${codigo(x)} · ${FT[tp].toLowerCase()} ${j} · ${f.u}`, nombre: `${codigo(x)}_${limpio(tipoTxt(x))}_${tp}_${j}.jpg`,
        eliminar: () => {
          if (!confirm('¿Eliminar esta foto para todos?')) return;
          const b = writeBatch(db);
          b.delete(doc(fotosCol(S.detalle), f.id));
          b.update(indRef(S.detalle), { ...conteoFotos(S.inds.get(S.detalle) || {}, tp, -1), nf: increment(-1), uu: S.nombre, ut: Date.now() });
          b.commit().catch(errEsc); cerrarVisor();
        }
      });
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
  g.fillStyle = '#fff'; g.font = 'bold 30px sans-serif'; g.fillText(`Candados ${sobre(l.sid)?.nombre || 'sobrecalentador'} — ${nivelNom(n)}`, m, 32);
  g.fillStyle = '#F5A300'; g.font = '18px sans-serif'; g.fillText(`${nombreCompleto(l)} · ${xs.length} indicaciones · ${fecha(Date.now())}`, m, 64);
  g.font = '16px sans-serif'; const ly = 108;
  g.fillStyle = '#F48FB1'; g.fillRect(m, ly - 8, 16, 16); g.fillStyle = '#13202c'; g.fillText('Falta foto', m + 24, ly);
  g.fillStyle = '#D32F2F'; g.fillRect(m + 120, ly - 8, 16, 16); g.fillStyle = '#13202c'; g.fillText('General y detalle', m + 144, ly);
  g.fillText('G Grieta · R Rotura · D Desgarro · O Otro · candado entre dos tubos', m + 300, ly);
  const x0 = Math.round((W - gw) / 2), y0 = top;
  g.fillStyle = '#EEF1F5'; g.fillRect(x0 - 10, y0 - 6, gw + 20, gh + 12);
  g.drawImage(await cargarImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgNivel(n, gw, gh))), x0, y0, gw, gh);
  g.textAlign = 'left';
  const cols = [m, m + 200, m + 380, W - m - 300, W - m - 210], wcol = i => (cols[i + 1] || W - m) - cols[i] - 12;
  let y = y0 + gh + 44;
  g.fillStyle = '#0E3A5F'; g.fillRect(m, y - lh / 2, W - 2 * m, lh);
  g.fillStyle = '#fff'; g.font = 'bold 15px sans-serif';
  ['Código', 'Indicación', 'Nota', 'Fotos general', 'Fotos detalle', 'Registró'].forEach((t, i) => g.fillText(t, cols[i] + 6, y));
  g.font = '15px sans-serif';
  xs.forEach((x, r) => {
    y += lh; g.fillStyle = r % 2 ? '#f5f7fa' : '#fff'; g.fillRect(m, y - lh / 2, W - 2 * m, lh); g.fillStyle = '#13202c';
    [codigo(x), tipoTxt(x), x.nota, `G ${nG(x)} · D ${nD(x)}`, x.u].forEach((t, i) => g.fillText(cortar(g, t, wcol(i)), cols[i] + 6, y));
  });
  return cv;
}
const canvasBlob = cv => new Promise(r => cv.toBlob(r, 'image/png'));

// ---------- exportar ----------
function csv() {
  const cols = ['Nivel', 'Panel', 'Candado (tubos)', 'Código', 'Indicación', 'Nota', 'Fotos', 'Registró', 'Fecha registro', 'Último cambio', 'Fecha cambio'];
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [...S.inds.values()].sort(ordenar).map(x =>
    [x.n, `P${pad(x.p)}`, `T${pad(x.c)}-${pad(x.c + 1)}`, codigo(x), tipoTxt(x), x.nota, nG(x), nD(x), x.u, fecha(x.t), x.uu || '', fecha(x.ut)]);
  return '﻿' + [cols, ...rows].map(r => r.map(q).join(';')).join('\r\n');
}

function exportar() {
  const n = S.nivel, nom = limpio(nombreCompleto(S.lev));
  hoja(`<h3>Exportar</h3>
    <button class="btn" id="eCsv">${ic('planilla')}Planilla (CSV para Excel)</button>
    <button class="btn" id="eLam">${ic('lamina')}Lámina: ${esc(nivelNom(n))} (PNG)</button>
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
  visor(d, { titulo: `Lámina · ${nivelNom(n)}`, nombre: `Candados ${limpio(nombreCompleto(S.lev))} Nivel ${n}.png` });
}

async function exportarZip() {
  const b = $('#eZip'), bt = $('#eZip span'); b.disabled = true; bt.textContent = 'Preparando…';
  try {
    const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
    const z = new JSZip(), base = `Candados ${limpio(nombreCompleto(S.lev))}`;
    z.file(`${base}/${base}.csv`, csv());
    for (const n of range(S.lev.n)) {
      if ([...S.inds.values()].some(x => x.n === n)) z.file(`${base}/Candados Nivel ${n}.png`, await canvasBlob(await lamina(n)));
    }
    const xs = [...S.inds.values()].filter(x => x.nf > 0).sort(ordenar);
    let i = 0, nf = 0;
    for (const x of xs) {
      i++; if ($('#eZip span')) $('#eZip span').textContent = `Fotos ${i} de ${xs.length}…`;
      const s = await getDocs(query(fotosCol(x.id), orderBy('t')));
      const cuenta = { general: 0, detalle: 0 };
      s.docs.forEach(d => {
        const f = d.data(), tp = tipoFoto(f), dir = `${base}/Nivel ${x.n}/P${pad(x.p)} T${pad(x.c)}-${pad(x.c + 1)}`;
        z.file(`${dir}/${codigo(x)}_${limpio(tipoTxt(x))}_${tp}_${++cuenta[tp]}.jpg`, f.d.split(',')[1], { base64: true }); nf++;
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

// ---------- logos (empresa en el menú ⋮, cliente en su pantalla) ----------
const logoEmpresa = () => S.cat.ajustes.find(x => x.id === 'empresa')?.logo || null;
function cargarLogo(tipo, id) { S.camK = null; S.croquisK = null; S.logoDest = { tipo, id }; const i = $('#gal'); i.value = ''; i.click(); }
async function procesarLogo(file) {
  let src;
  try { src = await createImageBitmap(file); }
  catch { src = await cargarImg(URL.createObjectURL(file)); }
  const e = Math.min(1, 600 / Math.max(src.width, src.height)), w = Math.round(src.width * e), h = Math.round(src.height * e);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(src, 0, 0, w, h);
  let d = cv.toDataURL('image/png');   // PNG conserva el fondo transparente
  if (d.length > 400000) { const c2 = document.createElement('canvas'); c2.width = w; c2.height = h; const g = c2.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(cv, 0, 0); d = c2.toDataURL('image/jpeg', 0.9); }
  return d;
}
const bloqueLogo = (titulo, logo, id) => `<h3>${titulo}</h3>${logo ? `<div class="logoprev"><img src="${logo}" alt=""></div>` : '<p class="nota">Aparece arriba a la derecha en los informes.</p>'}
  <div class="acciones"><button class="btn" id="${id}">${ic('galeria')}${logo ? 'Cambiar logo' : 'Cargar logo'}</button>${logo ? `<button class="btn peligro" id="${id}Del">${ic('borrar')}Quitar</button>` : ''}</div>`;

// ---------- niveles inspeccionados ----------
function marcarInspeccion(n) {
  const l = S.lev, ya = inspN(l, n);
  if (ya && !confirm(`¿Desmarcar ${nivelNom(n)} como inspeccionado? (lo marcó ${ya.u})`)) return;
  const v = ya ? null : { u: S.nombre, t: Date.now() };
  updateDoc(levRef(l.id), { ['insp.' + n]: v }).catch(errEsc);
  S.lev = { ...l, insp: { ...(l.insp || {}), [n]: v } };
  const i = S.levs.findIndex(x => x.id === l.id); if (i >= 0) S.levs[i] = S.lev;
  toast(ya ? `${nivelNom(n)} desmarcado` : `${nivelNom(n)} marcado como inspeccionado`); render();
}

// ---------- resumen de hallazgos (evento completo o una caldera) ----------
async function resumenHallazgos(prj, kid) {
  const e = proy(prj); if (!e) return;
  const ks = S.cat.calderas.filter(k => k.pid === e.pid && (!kid || k.id === kid));
  hoja(`<div class="dcab"><h3>Resumen de hallazgos</h3><button class="x" data-x>${ic('cerrar', 28)}</button></div><p class="nota">Cargando…</p>`);
  const levs = S.levs.filter(l => l.prj === prj && (!kid || l.kid === kid)), inds = new Map();
  try {
    await Promise.all(levs.map(async l => {
      const s = await getDocs(collection(db, 'levantamientos', l.id, 'indicaciones'));
      inds.set(l.id, s.docs.map(d => ({ id: d.id, ...d.data() })).sort(ordenar));
    }));
  } catch (err) { toast('No se pudo cargar el resumen: ' + (err.code || err.message), 5000); }
  if ($('#modal').hidden) return;
  const todas = levs.flatMap(l => (inds.get(l.id) || []).map(x => ({ ...x, lev: l })));
  const porTipo = t => todas.filter(x => x.k === t).length, faltan = todas.filter(x => !completa(x)).length;
  let totN = 0, insN = 0;
  ks.forEach(k => shDe(k.id).forEach(x => { const l = levEv(prj, x.id); totN += l?.n || x.n || 0; insN += nInsp(l); }));
  const tile = (n, t, cls = '') => `<div class="tile ${cls}"><b>${n}</b><span>${t}</span></div>`;
  let h = `<div class="dcab"><h3>Resumen de hallazgos</h3><button class="x" data-x>${ic('cerrar', 28)}</button></div>
    <p class="nota">${esc([cli(e.cid)?.nombre, pla(e.pid)?.nombre, e.nombre, kid ? cal(kid)?.nombre : 'todas las calderas'].filter(Boolean).join(' · '))}</p>
    <div class="tiles">${tile(todas.length, 'hallazgos', todas.length ? 'rojo' : '')}${TIPOS.map(t => tile(porTipo(t), t)).join('')}
    ${tile(`${insN}/${totN}`, 'niveles inspeccionados', insN && insN === totN ? 'verde' : '')}${tile(faltan, 'con fotos pendientes', faltan ? 'ambar' : '')}</div>`;
  ks.forEach(k => {
    const shs = shDe(k.id); if (!shs.length) return;
    if (!kid) h += `<h4 class="rcal">${ic('caldera', 18)} ${esc(k.nombre)}</h4>`;
    shs.forEach(x => {
      const l = levEv(prj, x.id), xs = l ? inds.get(l.id) || [] : [], n = l?.n || x.n;
      const cnt = {}; xs.forEach(y => cnt[y.n] = (cnt[y.n] || 0) + 1);
      h += `<div class="rsh"><div class="rshcab"><b>${esc(x.nombre)}</b><span>${l ? `${nInsp(l)}/${n} inspeccionados · ${plural(xs.length, 'hallazgo', 'hallazgos')}` : 'sin iniciar'}</span></div>
        <div class="rniv">${range(n).map(j => `<button class="rn ${inspN(l, j) ? 'ok' : ''} ${cnt[j] ? 'con' : ''}" data-sid="${x.id}" data-kid="${k.id}" data-n="${j}">${inspN(l, j) ? '✓ ' : ''}${esc((x.nn || [])[j - 1] || 'N' + j)}${!inspN(l, j) && nPanInsp(l, j) ? `<small>${nPanInsp(l, j)}/${l.p}</small>` : ''}${cnt[j] ? `<i>${cnt[j]}</i>` : ''}</button>`).join('')}</div>
        ${xs.map(y => `<button class="rh" data-lev="${l.id}" data-k="${y.id}"><span class="badge ${completa(y) ? 'foto' : 'ind'}">${esc(ini(y))}</span>
          <div><b>${codigo(y)}</b> · ${esc(tipoTxt(y))}${y.nota ? `<br><span class="nt">${esc(y.nota)}</span>` : ''}<small>${esc(y.u)} · ${fecha(y.t)} · ${fotosTxt(y)}</small></div></button>`).join('')}</div>`;
    });
  });
  if (!ks.some(k => shDe(k.id).length)) h += '<p class="vacio">No hay sobrecalentadores configurados.</p>';
  const m = $('#modal'); m.firstChild.innerHTML = h; m.firstChild.classList.add('ancha');
  m.querySelectorAll('[data-x]').forEach(b => b.onclick = cerrarModal);
  // tocar un nivel → abrir ese sobrecalentador en ese nivel; tocar un hallazgo → abrir su ficha
  m.querySelectorAll('.rn').forEach(b => b.onclick = () => {
    const x = sobre(b.dataset.sid), k = cal(b.dataset.kid); cerrarModal();
    if (S.lev) { S.unsubInds?.(); S.unsubInds = null; S.lev = null; }
    S.nivelPend = +b.dataset.n; abrirSobre(e, k, x);
  });
  m.querySelectorAll('.rh').forEach(b => b.onclick = () => {
    const l = S.levs.find(v => v.id === b.dataset.lev), y = (inds.get(b.dataset.lev) || []).find(v => v.id === b.dataset.k); if (!l || !y) return;
    cerrarModal(); if (S.lev) { S.unsubInds?.(); S.unsubInds = null; S.lev = null; }
    S.nivelPend = y.n; abrirLev(l.id); S.inds.set(y.id, y); render(); detalle(y.id);
  });
}

// ---------- informe PDF / Word (como el de BoilerImage, con foto general y de detalle) ----------
const medir = d => cargarImg(d).then(i => ({ d, w: i.naturalWidth, h: i.naturalHeight }));

// quita la franja del sello (código, usuario y fecha) de la parte de abajo de la foto, para la versión del cliente
async function sinSello(f) {
  const im = await cargarImg(f.d), w = im.naturalWidth, h = im.naturalHeight;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); g.drawImage(im, 0, 0);
  const px = g.getImageData(0, 0, 4, h).data, azul = y => { const i = (y * 4 + 1) * 4; return Math.abs(px[i] - 14) < 22 && Math.abs(px[i + 1] - 58) < 22 && Math.abs(px[i + 2] - 95) < 22; };
  let y = h - 1; while (y > h * 0.75 && azul(y)) y--;
  const banda = h - 1 - y; if (banda < 30) return { d: f.d, w, h };
  const c2 = document.createElement('canvas'); c2.width = w; c2.height = h - banda; c2.getContext('2d').drawImage(im, 0, 0);
  return { d: c2.toDataURL('image/jpeg', 0.85), w, h: h - banda };
}

// grilla de un nivel como PNG para el informe
async function grillaPNG(l, inds, n) {
  const uw = G.L + l.t * G.u, uh = G.top + l.p * G.rh, gw = Math.round(uw * 2.2), gh = Math.round(uh * 2.2);
  S.gctx = { l, inds }; const sv = svgNivel(n, gw, gh); S.gctx = null;
  const im = await cargarImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sv));
  const cv = document.createElement('canvas'); cv.width = gw; cv.height = gh; cv.getContext('2d').drawImage(im, 0, 0, gw, gh);
  return { d: cv.toDataURL('image/png'), w: gw, h: gh };
}

// niveles (grilla + tabla) y fichas con fotos de una grilla
async function seccionInforme(l, xs, paraCliente, avance, pre = '') {
  const shn = sobre(l.sid)?.nombre || 'Sobrecalentador', inds = new Map(xs.map(x => [x.id, x])), sec = { titulo: shn, niveles: [], fichas: [] };
  const nn = n => nombresNiv(l)[n - 1] || 'N' + n;
  for (const n of range(l.n)) {
    const ys = xs.filter(x => x.n === n); if (!ys.length) continue;
    avance(`${pre}grilla ${nn(n)}…`);
    sec.niveles.push({
      titulo: `${nivelNom(n, l)} · ${shn}`, img: await grillaPNG(l, inds, n),
      filas: ys.map(x => [codigo(x), pad(x.p), `T${pad(x.c)}-${pad(x.c + 1)}`, tipoTxt(x), `G ${nG(x)} · D ${nD(x)}`, x.nota || ''])
    });
  }
  let i = 0;
  for (const x of xs) {
    avance(`${pre}fotos ${++i} de ${xs.length}…`);
    let fs = [];
    if (x.nf > 0) fs = (await getDocs(query(collection(db, 'levantamientos', l.id, 'indicaciones', x.id, 'fotos'), orderBy('t')))).docs.map(d => d.data());
    const g = fs.find(f => tipoFoto(f) === 'general'), d = fs.find(f => tipoFoto(f) === 'detalle');
    sec.fichas.push({
      titulo: `Nivel ${pad(x.n)}${nombresNiv(l)[x.n - 1] ? ' (' + nombresNiv(l)[x.n - 1] + ')' : ''}, Panel N°${pad(x.p)}, Tubos N°${pad(x.c)}-${pad(x.c + 1)}  ·  ${tipoTxt(x)}`,
      ubic: `${shn} · Código ${codigo(x)} · candado entre los tubos ${x.c} y ${x.c + 1}` + (paraCliente ? '' : ` · registró ${x.u}, ${fecha(x.t)}`),
      general: g ? await (paraCliente ? sinSello(g) : medir(g.d)) : null, detalle: d ? await (paraCliente ? sinSello(d) : medir(d.d)) : null, obs: x.nota || ''
    });
  }
  return sec;
}

// alcance 'sh' = sobrecalentador abierto; 'caldera' = todos los sobrecalentadores de la caldera en el evento
async function datosInforme(avance, paraCliente, alcance = 'sh', prj, kid) {
  const l0 = alcance === 'sh' ? S.lev : null;
  prj = prj || S.lev?.prj; kid = kid || S.lev?.kid;
  const e = proy(prj), k = cal(kid), cliId = l0?.cid || k?.cid;
  const base = l0 ? nombreCompleto(l0) : [cli(k?.cid)?.nombre, pla(k?.pid)?.nombre, e?.nombre, k?.nombre].filter(Boolean).join(' · ');
  const c = {
    titulo: alcance === 'caldera' ? 'Inspección de candados · caldera completa' : 'Inspección de candados',
    subtitulo: paraCliente ? base : `${base} · ${fecha(Date.now()).slice(0, 10)}`,
    secciones: [], pie: paraCliente ? 'Informe de inspección de candados' : 'TIES · Informe de candados · uso interno'
  };
  c.logos = (await Promise.all([cli(cliId)?.logo, logoEmpresa()].filter(Boolean).map(medir))).filter(Boolean);
  // indicaciones de todas las grillas de la caldera en el evento
  const inds = new Map();
  if (prj && kid) {
    avance('Leyendo la caldera…');
    const levs = S.levs.filter(v => v.prj === prj && v.kid === kid);
    await Promise.all(levs.map(async v => inds.set(v.id, S.lev && v.id === S.lev.id ? [...S.inds.values()].sort(ordenar)
      : (await getDocs(collection(db, 'levantamientos', v.id, 'indicaciones'))).docs.map(d => ({ id: d.id, ...d.data() })).sort(ordenar))));
    inds.forEach((ys, id) => { if (!S.lev || id !== S.lev.id) { const cc = {}; ys.forEach(y => cc[y.n] = (cc[y.n] || 0) + 1); S.cntLev[id] = cc; } });
  }
  if (l0) {
    const xs = [...S.inds.values()].sort(ordenar), cnt = conteoNiveles();
    c.resumen = `${l0.n} niveles · ${l0.p} paneles · ${l0.t} tubos por panel (${l0.t - 1} candados) · ${xs.length} indicación(es)`;
    c.conteo = range(l0.n).map(i => `${chipNom(i)}: ${cnt[i] || 0}`).join('    ');
    c.filas = xs.map(x => [codigo(x), chipNom(x.n), pad(x.p), `T${pad(x.c)}-${pad(x.c + 1)}`, tipoTxt(x), `G ${nG(x)} · D ${nD(x)}`, x.nota || '']);
  } else c.soloResumen = true;
  // resumen de hallazgos de la caldera
  if (prj && kid) {
    const todas = [...inds.values()].flat(), shs = shDe(kid);
    let totN = 0, insN = 0;
    shs.forEach(x => { const v = levEv(prj, x.id); totN += v?.n || x.n || 0; insN += nInsp(v); });
    const tiles = [[todas.length, 'hallazgos'], ...TIPOS.map(t => [todas.filter(y => y.k === t).length, t]), [`${insN}/${totN}`, 'niveles inspeccionados']];
    if (!paraCliente) tiles.push([todas.filter(y => !completa(y)).length, 'con fotos pendientes']);
    c.resumenCal = {
      titulo: `Resumen de hallazgos · ${k?.nombre || ''}`, tiles,
      shs: shs.map(x => {
        const v = levEv(prj, x.id), ys = v ? inds.get(v.id) || [] : [], n = v?.n || x.n, cnt = {};
        ys.forEach(y => cnt[y.n] = (cnt[y.n] || 0) + 1);
        return {
          nombre: x.nombre, estado: v ? `${nInsp(v)}/${n} niveles inspeccionados · ${plural(ys.length, 'hallazgo', 'hallazgos')}` : 'sin iniciar',
          niveles: range(n).map(j => ({ nom: (x.nn || [])[j - 1] || 'N' + j, ok: !!inspN(v, j), n: cnt[j] || 0 })),
          filas: ys.map(y => [codigo(y), (x.nn || [])[y.n - 1] || 'N' + y.n, pad(y.p), `T${pad(y.c)}-${pad(y.c + 1)}`, tipoTxt(y), y.nota || ''])
        };
      })
    };
  }
  // croquis de la caldera (con el sobrecalentador marcado si es de uno solo)
  if (k && (k.img || shDe(k.id).length)) {
    avance('Croquis…');
    const sid = l0?.sid || null, cnt = l0 ? conteoNiveles() : {};
    let img = k.cqmap?.cols?.length ? await imagenMapa(k, { sid, cnt }) : k.img ? await medir(k.img) : null;
    if (!img) {
      const sv = svgCroquis(k.id, sid, 0, cnt), vb = sv.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/), w = Math.round(+vb[1] * 4), h = Math.round(+vb[2] * 4);
      const i2 = await cargarImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sv));
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').drawImage(i2, 0, 0, w, h);
      img = { d: cv.toDataURL('image/png'), w, h };
    }
    c.croquis = { titulo: `Croquis · ${l0 ? sobre(l0.sid)?.nombre || k.nombre : k.nombre}`, img };
  }
  // secciones: el sobrecalentador abierto, o todos los de la caldera en orden
  if (l0) c.secciones.push(await seccionInforme(l0, [...S.inds.values()].sort(ordenar), paraCliente, avance));
  else {
    const shs = shDe(kid);
    for (const [i, x] of shs.entries()) {
      const v = levEv(prj, x.id); if (!v) continue;
      const xs = inds.get(v.id) || []; if (!xs.length) continue;
      c.secciones.push(await seccionInforme(v, xs, paraCliente, avance, `${abrevSH(x.nombre)} (${i + 1}/${shs.length}): `));
    }
  }
  c.total = c.secciones.reduce((a, s) => a + s.fichas.length, 0);
  return c;
}

// prj/kid: caldera en el evento; desde la grilla se puede elegir el sobrecalentador o toda la caldera
function menuInforme(prj, kid) {
  const desdeGrilla = !prj && S.lev; prj = prj || S.lev?.prj; kid = kid || S.lev?.kid;
  const k = cal(kid), cliId = k?.cid || S.lev?.cid, conCal = !!(prj && kid);
  const alc = !desdeGrilla ? 'caldera' : ls.get('ties_inf_alc', 'sh') === 'caldera' && conCal ? 'caldera' : 'sh';
  const xs = desdeGrilla ? [...S.inds.values()] : [], faltan = xs.filter(x => !completa(x)).length;
  hoja(`<h3>Informe de candados</h3>
    <p class="nota">${esc(desdeGrilla ? nombreCompleto(S.lev) : [cli(k?.cid)?.nombre, pla(k?.pid)?.nombre, proy(prj)?.nombre, k?.nombre].filter(Boolean).join(' · '))}</p>
    ${desdeGrilla && conCal ? `<h4>Alcance</h4><div class="version">
      <label><input type="radio" name="iAlc" value="sh" ${alc === 'sh' ? 'checked' : ''}><span><b>Este sobrecalentador</b><small>${esc(sobre(S.lev.sid)?.nombre || '')}</small></span></label>
      <label><input type="radio" name="iAlc" value="caldera" ${alc === 'caldera' ? 'checked' : ''}><span><b>Toda la caldera</b><small>${plural(shDe(kid).length, 'sobrecalentador', 'sobrecalentadores')} en un solo informe</small></span></label></div>` : ''}
    <p class="nota">Resumen de hallazgos de la caldera, croquis, una hoja por nivel con su grilla y su tabla, y el detalle de cada candado con foto general, foto de detalle y observaciones.</p>
    ${faltan ? `<p class="aviso">${ic('camara', 18)} ${plural(faltan, 'indicación no tiene', 'indicaciones no tienen')} las dos fotos; en el informe aparecerá "Sin foto".</p>` : ''}
    <h4>Versión</h4><div class="version"><label><input type="radio" name="iVer" value="cliente" ${ls.get('ties_inf_ver', 'cliente') === 'cliente' ? 'checked' : ''}><span><b>Para el cliente</b><small>Sin fechas del levantamiento ni quién lo registró; fotos sin sello</small></span></label>
      <label><input type="radio" name="iVer" value="interno" ${ls.get('ties_inf_ver', 'cliente') === 'interno' ? 'checked' : ''}><span><b>Interno</b><small>Con fecha, responsables y fotos con sello</small></span></label></div>
    ${!logoEmpresa() || !cli(cliId)?.logo ? `<p class="nota">Logos: ${!logoEmpresa() ? 'carga el de la empresa en el menú ⋮' : ''}${!logoEmpresa() && !cli(cliId)?.logo ? ' y ' : ''}${!cli(cliId)?.logo ? 'el del cliente en la pantalla del cliente' : ''}.</p>` : ''}
    <button class="btn pri" id="iPdf">${ic('informe')}<span>Informe PDF</span></button>
    <button class="btn" id="iDoc">${ic('informe')}<span>Informe Word (.docx)</span></button>
    <p class="nota" id="iAv"></p>
    <div class="acciones"><button class="btn" data-x>Cerrar</button></div>`);
  $('#modal').querySelectorAll('[name="iVer"]').forEach(r => r.onchange = () => ls.set('ties_inf_ver', r.value));
  $('#modal').querySelectorAll('[name="iAlc"]').forEach(r => r.onchange = () => ls.set('ties_inf_alc', r.value));
  const alcance = () => !desdeGrilla ? 'caldera' : $('#modal [name="iAlc"]:checked')?.value || 'sh';
  $('#iPdf').onclick = () => generarInforme('pdf', alcance(), prj, kid);
  $('#iDoc').onclick = () => generarInforme('docx', alcance(), prj, kid);
}

async function generarInforme(tipo, alcance, prj, kid) {
  const bs = ['#iPdf', '#iDoc'].map(s => $(s)); bs.forEach(b => b && (b.disabled = true));
  const av = t => { const e = $('#iAv'); if (e) e.textContent = t; };
  try {
    av('Preparando…');
    const cliente = ($('#modal [name="iVer"]:checked')?.value || 'cliente') === 'cliente';
    const c = await datosInforme(av, cliente, alcance, prj, kid);
    av(tipo === 'pdf' ? 'Armando el PDF…' : 'Armando el Word…');
    const m = await import('./informe.js');
    const blob = tipo === 'pdf' ? await m.informePDF(c) : await m.informeWord(c);
    const k = cal(kid), base = alcance === 'caldera' ? [cli(k?.cid)?.nombre, pla(k?.pid)?.nombre, proy(prj)?.nombre, k?.nombre].filter(Boolean).join(' · ') + ' completa' : nombreCompleto(S.lev);
    const nombre = `Informe candados ${limpio(base)}${cliente ? '' : ' INTERNO ' + hoy()}.${tipo}`;
    hoja(`<h3>Informe listo</h3><p>${alcance === 'caldera' ? 'Caldera completa' : 'Sobrecalentador'} · ${cliente ? 'para el cliente' : 'interno'} · ${tipo === 'pdf' ? 'PDF' : 'Word'} · ${c.total} indicación(es) · ${(blob.size / 1048576).toFixed(1)} MB</p>
      <button class="btn pri" id="zSh">${ic('compartir')}Compartir</button><button class="btn" id="zDes">${ic('bajar')}Guardar en Descargas</button>
      <div class="acciones"><button class="btn" data-x>Cerrar</button></div>`);
    $('#zSh').onclick = () => compartir(blob, nombre);
    $('#zDes').onclick = () => descargar(blob, nombre);
  } catch (e) {
    console.error(e);
    toast('No se pudo armar el informe: ' + (e.code || e.message), 6000);
    bs.forEach(b => b && (b.disabled = false)); av('');
  }
}

// ---------- ajustes ----------
function ajustes() {
  const l = S.lev;
  const deProy = !!l.prj;
  hoja(`<h3>Ajustes</h3>
    <h4>${deProy ? esc(sobre(l.sid)?.nombre || 'Sobrecalentador') + ' en ' + esc(l.nombre) : 'Levantamiento'} (cambia para todos)</h4>
    ${deProy ? '<p class="nota">El nombre y el año se cambian en el proyecto; los nombres de los niveles, en el sobrecalentador de la caldera.</p>' : `<label>Caldera<select id="aCal"><option value="">— Sin asignar —</option>${S.cat.calderas.map(k => ({ k, t: rutaTxt({ cid: k.cid, pid: k.pid, kid: k.id }) }))
      .sort((a, b) => a.t.localeCompare(b.t, 'es')).map(({ k, t }) => `<option value="${k.id}" ${k.id === l.kid ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
    <div class="fila2"><label>Año<input id="aAn" type="number" inputmode="numeric" value="${l.anio || new Date(l.c > 946684800000 ? l.c : Date.now()).getFullYear()}"></label>
    <label>Nombre<input id="aNom" value="${esc(l.nombre)}"></label></div>`}
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
    <button class="btn peligro" id="aDel">${ic('borrar')}${deProy ? 'Borrar los candados de este sobrecalentador' : 'Eliminar levantamiento'}</button>
    <div class="acciones"><button class="btn" data-x>Cerrar</button></div>`);
  $('#aCam').onchange = e => ls.set('ties_cam', e.target.checked);
  $('#aSel').onchange = e => ls.set('ties_sello', e.target.checked);
  $('#aOk').onclick = () => {
    const nombre = deProy ? l.nombre : $('#aNom').value.trim(), p = num('#aP', 1, 200), n = num('#aN', 1, 30), t = num('#aT', 2, 100);
    const anio = deProy ? l.anio : num('#aAn', 1990, 2100), k = deProy ? cal(l.kid) : cal($('#aCal').value);
    if (!nombre || !p || !n || !t || !anio) return toast('Revisa el año, el nombre y las cantidades');
    const fuera = [...S.inds.values()].filter(x => x.n > n || x.p > p || x.c > t - 1).length;
    if (fuera && !confirm(`${fuera} indicaciones quedan fuera de la grilla nueva (no se borran, siguen en la Lista y el Excel). ¿Continuar?`)) return;
    updateDoc(levRef(l.id), deProy ? { p, n, t } : { nombre, p, n, t, anio, kid: k?.id || null, pid: k?.pid || null, cid: k?.cid || null }).catch(errEsc);
    if (k && !deProy) { S.ruta = { cid: k.cid, pid: k.pid, kid: k.id }; ls.set('ties_ruta', S.ruta); }
    cerrarModal(); toast('Ajustes guardados');
  };
  $('#aDel').onclick = () => {
    if (prompt(`Se borrará "${nombreCompleto(l)}" con todas sus indicaciones y fotos, para todos los usuarios.\nEscribe BORRAR para confirmar.`) !== 'BORRAR') return;
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
    ${bloqueLogo('Logo de la empresa', logoEmpresa(), 'mLogo')}
    <p class="nota">TIES v${VERSION}. Los cambios se guardan en el teléfono y se suben solos cuando hay señal. Cada indicación registra quién la marcó y quién la cambió por última vez.</p>
    <div class="acciones"><button class="btn" data-x>Cerrar</button></div>`);
  $('#mNom').onclick = () => {
    const v = prompt('Tu nombre', S.nombre); if (!v || !v.trim()) return;
    S.nombre = v.trim(); ls.set('ties_nombre', S.nombre);
    updateDoc(doc(db, 'miembros', S.uid), { nombre: S.nombre, t: Date.now() }).catch(errEsc);
    cerrarModal(); toast('Nombre actualizado');
  };
  $('#mLogo').onclick = () => cargarLogo('empresa');
  if ($('#mLogoDel')) $('#mLogoDel').onclick = () => { if (!confirm('¿Quitar el logo de la empresa?')) return; setDoc(catRef('ajustes', 'empresa'), { logo: null, c: Date.now(), u: S.nombre }).catch(errEsc); const a = S.cat.ajustes.find(x => x.id === 'empresa'); if (a) a.logo = null; menu(); };
  if ($('#mInst')) $('#mInst').onclick = async () => { S.instalar.prompt(); await S.instalar.userChoice; S.instalar = null; cerrarModal(); };
  $('#mSal').onclick = async () => {
    if (S.pend && !confirm(`Hay ${S.pend} cambios sin subir. Si cierras sesión se pierden. ¿Cerrar igual?`)) return;
    if (!confirm('Para volver a entrar necesitarás señal y la clave del equipo. ¿Cerrar sesión?')) return;
    cerrarModal(); ls.set('ties_miembro', null); ls.set('ties_lev', null); S.levId = null;
    detenerTodo(); S.lev = null; await signOut(auth);
  };
}
