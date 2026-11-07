// TIES — informe de candados en PDF (jsPDF) y Word (.docx armado a mano con JSZip)
// Recibe los datos ya preparados por app.js:
// c = { titulo, subtitulo, resumen, conteo, filas: [[código, nivel, panel, candado, indicación, estado, fotos, obs]],
//       croquis: { titulo, img: {d, w, h} } | null,
//       niveles: [{ titulo, img: {d, w, h}, filas: [[código, panel, candado, indicación, estado, fotos, obs]] }],
//       fichas: [{ titulo, ubic, general: {d, w, h} | null, detalle: {d, w, h} | null, obs }], pie }

const AZUL = [14, 58, 95], GRIS = [90, 107, 123], CELESTE = [214, 228, 240], SUAVE = [238, 241, 245];
const COLS_RES = [['Código', 34], ['Nivel', 16], ['Panel', 14], ['Candado', 18], ['Indicación', 30], ['Estado', 20], ['Observaciones', 50]];
// color de la celda Indicación: rotura en naranjo, grieta en rojo con letra blanca
const COLOR_IND = {
  Rotura: { fondo: [251, 140, 0], letra: [19, 32, 44] }, Grieta: { fondo: [211, 47, 47], letra: [255, 255, 255] },
  Desgarro: { fondo: [123, 31, 162], letra: [255, 255, 255] }, Ausencia: { fondo: [255, 213, 79], letra: [19, 32, 44] }, Otro: { fondo: [84, 110, 122], letra: [255, 255, 255] }
};
// color de la celda Estado: reparado en verde, pendiente en ámbar
const COLOR_EST = { Reparado: { fondo: [46, 125, 50], letra: [255, 255, 255] }, Pendiente: { fondo: [255, 224, 178], letra: [19, 32, 44] } };
const colorInd = (cols, i, v) => { const t = String(v ?? '').trim(); if (cols[i][0] === 'Estado') return COLOR_EST[t] || null; return cols[i][0] === 'Indicación' && t ? COLOR_IND[t] || COLOR_IND[t[0].toUpperCase() + t.slice(1).toLowerCase()] || COLOR_IND.Otro : null; };
const VERDE = [200, 230, 201], VERDE_O = [46, 125, 50], ROJO = [211, 47, 47];
const COLS_NIV = [['Código', 36], ['Panel', 15], ['Candado', 20], ['Indicación', 32], ['Estado', 20], ['Fotos', 22], ['Observaciones', 37]];
const COLS = [['Código', 34], ['Nivel', 16], ['Panel', 12], ['Candado', 18], ['Indicación', 26], ['Estado', 20], ['Fotos', 18], ['Observaciones', 38]];

// ---------- PDF ----------
export async function informePDF(c) {
  const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm');
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const W = 210, H = 297, M = 14, ANCHO = W - 2 * M, FIN = H - 16;
  let hoja = 1, y = 0;
  const color = (k, a) => pdf[k](a[0], a[1], a[2]);
  // logos arriba a la derecha (el último, la empresa, en la esquina)
  const LH = 12, logos = (c.logos || []).map(im => { let h = LH, w = im.w / im.h * h; if (w > 34) { w = 34; h = w * im.h / im.w; } return { ...im, lw: w, lh: h }; });
  const anchoLogos = logos.reduce((a, l) => a + l.lw + 4, 0), ANCHO_T = ANCHO - anchoLogos - 3;
  const cab = t => {
    let x = W - M;
    [...logos].reverse().forEach(l => { x -= l.lw; pdf.addImage(l.d, l.d.startsWith('data:image/png') ? 'PNG' : 'JPEG', x, 9 + (LH - l.lh) / 2, l.lw, l.lh, undefined, 'FAST'); x -= 4; });
    // título en una línea (se achica) o en dos; subtítulo hasta dos líneas
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); while (pdf.getTextWidth(t) > ANCHO_T && pdf.getFontSize() > 11) pdf.setFontSize(pdf.getFontSize() - 0.5);
    const lt = pdf.splitTextToSize(t, ANCHO_T).slice(0, 2); color('setTextColor', AZUL); pdf.text(lt, M, 16, { lineHeightFactor: 1.1 });
    let yy = 16 + (lt.length - 1) * pdf.getFontSize() * 0.39 + 5.5;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); color('setTextColor', GRIS);
    const ls = pdf.splitTextToSize(c.subtitulo, ANCHO_T).slice(0, 2); pdf.text(ls, M, yy, { lineHeightFactor: 1.15 });
    yy = Math.max(yy + (ls.length - 1) * 3.4 + 3, 9 + LH + 3);
    color('setDrawColor', AZUL); pdf.setLineWidth(0.6); pdf.line(M, yy, W - M, yy); y = yy + 8;
  };
  const pie = () => { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); color('setTextColor', GRIS); pdf.text(`${c.pie} · hoja ${hoja}`, W - M, H - 8, { align: 'right' }); };
  const nueva = t => { pie(); pdf.addPage(); hoja++; cab(t); };
  const texto = (t, sz = 10, b = false, col = [19, 32, 44]) => { pdf.setFont('helvetica', b ? 'bold' : 'normal'); pdf.setFontSize(sz); color('setTextColor', col); };

  // hoja 1: resumen y tabla del sobrecalentador (en el informe de caldera completa, la hoja 1 es el resumen de la caldera)
  cab(c.soloResumen ? c.titulo : c.titulo);
  if (!c.soloResumen) {
    texto(c.resumen, 10.5); pdf.text(pdf.splitTextToSize(c.resumen, ANCHO), M, y); y += 7;
    texto(c.conteo, 10, true); const lc = pdf.splitTextToSize(c.conteo, ANCHO); pdf.text(lc, M, y); y += lc.length * 5 + 4;
  }
  const tabla = (cols, filas, tit) => {
    const encabezado = () => {
      color('setFillColor', CELESTE); pdf.rect(M, y - 4.5, ANCHO, 7, 'F'); texto('', 9, true);
      let x = M + 1.5; cols.forEach(([t, w]) => { pdf.text(t, x, y); x += w; }); y += 6;
    };
    if (!filas.length) { texto('', 10); pdf.text('Sin indicaciones registradas.', M, y); y += 6; return; }
    encabezado();
    filas.forEach(f => {
      texto('', 9);
      const celdas = f.map((v, i) => pdf.splitTextToSize(String(v ?? ''), cols[i][1] - 3));
      const alto = Math.max(...celdas.map(l => l.length)) * 4 + 2.5;
      if (y + alto > FIN) { nueva(tit + ' (cont.)'); encabezado(); texto('', 9); }
      let x = M + 1.5;
      celdas.forEach((l, i) => {
        const ci = colorInd(cols, i, f[i]);
        if (ci) { color('setFillColor', ci.fondo); pdf.roundedRect(x - 1.2, y - 3.6, cols[i][1] - 1.5, alto - 1.6, 1, 1, 'F'); texto('', 9, true, ci.letra); }
        pdf.text(l, x, y); if (ci) texto('', 9); x += cols[i][1];
      });
      color('setDrawColor', [213, 221, 230]); pdf.setLineWidth(0.2); pdf.line(M, y + alto - 3.5, W - M, y + alto - 3.5);
      y += alto;
    });
  };
  const hojaImagen = (im, fmt) => {
    const e = Math.min(ANCHO / im.w, (FIN - y - 2) / im.h), iw = im.w * e, ih = im.h * e;
    pdf.addImage(im.d, fmt, M + (ANCHO - iw) / 2, y, iw, ih, undefined, 'FAST'); y += ih + 4;
  };
  if (!c.soloResumen) tabla(COLS, c.filas, c.titulo);

  // resumen de hallazgos de la caldera
  if (c.resumenCal) {
    const R = c.resumenCal;
    if (c.soloResumen) { texto('', 12, true, AZUL); pdf.text(R.titulo, M, y); y += 7; } else nueva(R.titulo);
    const nT = R.tiles.length, tw = (ANCHO - (nT - 1) * 2.5) / nT;
    R.tiles.forEach(([v, t], i) => {
      const x = M + i * (tw + 2.5); color('setDrawColor', [201, 211, 222]); pdf.setLineWidth(0.3); pdf.roundedRect(x, y, tw, 18, 2, 2, 'S');
      const rojo = i === 0 && +v > 0, ok = /\//.test(String(v)) && String(v).split('/')[0] === String(v).split('/')[1] && String(v) !== '0/0';
      texto('', 15, true, rojo ? ROJO : ok ? VERDE_O : AZUL); pdf.text(String(v), x + tw / 2, y + 8, { align: 'center' });
      texto('', 7.5, false, GRIS); pdf.text(pdf.splitTextToSize(t, tw - 2), x + tw / 2, y + 13, { align: 'center' });
    });
    y += 24;
    texto('', 8, false, GRIS); pdf.text('Verde: nivel inspeccionado · número rojo: hallazgos en el nivel', M, y); y += 6;
    R.shs.forEach(sh => {
      const alto = 9 + 11 + (sh.filas.length ? 10 : 0);
      if (y + alto > FIN) nueva(R.titulo + ' (cont.)');
      color('setFillColor', SUAVE); pdf.rect(M, y, ANCHO, 8, 'F');
      texto('', 10.5, true, AZUL); pdf.text(sh.nombre, M + 2, y + 5.5);
      texto('', 8.5, false, GRIS); pdf.text(sh.estado, W - M - 2, y + 5.5, { align: 'right' }); y += 11;
      let x = M;
      sh.niveles.forEach(nv => {
        texto('', 9, true); const bw = Math.max(13, pdf.getTextWidth(nv.nom) + (nv.n ? 10 : 6));
        if (x + bw > W - M) { x = M; y += 10; }
        color('setFillColor', nv.ok ? VERDE : [238, 243, 248]); color('setDrawColor', nv.n ? ROJO : nv.ok ? VERDE_O : [201, 211, 222]); pdf.setLineWidth(nv.n ? 0.5 : 0.3);
        pdf.roundedRect(x, y, bw, 7.5, 1.5, 1.5, 'FD');
        texto('', 9, true, nv.ok ? [27, 94, 32] : AZUL); pdf.text(nv.nom, x + 3, y + 5.2);
        if (nv.n) { color('setFillColor', ROJO); pdf.circle(x + bw - 3.6, y + 3.75, 2.6, 'F'); texto('', 7.5, true, [255, 255, 255]); pdf.text(String(nv.n), x + bw - 3.6, y + 4.8, { align: 'center' }); }
        x += bw + 2.5;
      });
      y += 13;
      if (sh.filas.length) { tabla(COLS_RES, sh.filas, R.titulo); y += 4; }
    });
  }

  // croquis de la caldera en hoja completa
  if (c.croquis) { nueva(c.croquis.titulo); hojaImagen(c.croquis.img, c.croquis.img.d.startsWith('data:image/png') ? 'PNG' : 'JPEG'); }

  // por nivel: grilla en hoja completa y la tabla de sus indicaciones en la hoja siguiente
  const CW = (ANCHO - 6) / 2, CH = 74, varias = c.secciones.length > 1;
  for (const sec of c.secciones) {
  for (const nv of sec.niveles) {
    nueva(nv.titulo); hojaImagen(nv.img, 'PNG');
    nueva('Indicaciones · ' + nv.titulo); tabla(COLS_NIV, nv.filas, 'Indicaciones · ' + nv.titulo);
  }

  // detalle: foto general + foto de detalle + observaciones
  const tDet = 'Detalle de indicaciones' + (varias ? ' · ' + sec.titulo : '');
  if (sec.fichas.length) nueva(tDet);
  sec.fichas.forEach((f, i) => {
    texto('', 9.5); const obs = pdf.splitTextToSize(f.obs || 'Sin observaciones.', ANCHO - 4);
    const alto = 10 + 6 + CH + 7 + 6 + obs.length * 4.4 + 6;
    if (i && y + alto > FIN) nueva(tDet);
    color('setFillColor', SUAVE); pdf.rect(M, y, ANCHO, 9, 'F');
    texto(f.titulo, 12.5, true); pdf.text(f.titulo, M + 3, y + 6.2); y += 14;
    texto(f.ubic, 9.5); pdf.text(f.ubic, M + 2, y); y += 4;
    [['general', 'Foto general'], ['detalle', 'Foto de detalle']].forEach(([k, rot], j) => {
      const x0 = M + j * (CW + 6), im = f[k];
      if (im) {
        const e = Math.min(CW / im.w, CH / im.h), iw = im.w * e, ih = im.h * e;
        pdf.addImage(im.d, 'JPEG', x0 + (CW - iw) / 2, y + (CH - ih) / 2, iw, ih, undefined, 'FAST');
      } else {
        color('setFillColor', SUAVE); pdf.rect(x0, y, CW, CH, 'F');
        texto('', 9.5, false, GRIS); pdf.text(`Sin ${rot.toLowerCase()}`, x0 + CW / 2, y + CH / 2, { align: 'center' });
      }
      texto(rot, 9, true, AZUL); pdf.text(rot, x0 + CW / 2, y + CH + 5, { align: 'center' });
    });
    y += CH + 11;
    texto('Observaciones', 10, true, AZUL); pdf.text('Observaciones', M + 2, y); y += 5;
    texto('', 9.5); pdf.text(obs, M + 2, y); y += obs.length * 4.4 + 3;
    color('setDrawColor', [201, 211, 222]); pdf.setLineWidth(0.3); pdf.line(M, y, W - M, y); y += 6;
  });
  }
  pie();
  return pdf.output('blob');
}

// ---------- Word (.docx) ----------
const xml = s => String(s ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const hex = a => a.map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
const EMU = 36000; // por mm

function run(t, { b, sz = 20, col } = {}) {
  return `<w:r><w:rPr>${b ? '<w:b/>' : ''}${col ? `<w:color w:val="${hex(col)}"/>` : ''}<w:sz w:val="${sz}"/></w:rPr><w:t xml:space="preserve">${xml(t)}</w:t></w:r>`;
}
function par(runs, { al, sh, antes = 0, despues = 80, borde } = {}) {
  return `<w:p><w:pPr><w:spacing w:before="${antes}" w:after="${despues}"/>${al ? `<w:jc w:val="${al}"/>` : ''}${sh ? `<w:shd w:val="clear" w:color="auto" w:fill="${hex(sh)}"/>` : ''}${borde ? `<w:pBdr><w:bottom w:val="single" w:sz="10" w:space="4" w:color="${hex(AZUL)}"/></w:pBdr>` : ''}</w:pPr>${runs}</w:p>`;
}
const salto = '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';

export async function informeWord(c) {
  const { default: JSZip } = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
  const z = new JSZip(), rels = [];
  let nImg = 0;
  const imagen = (im, wmm, hmm) => {
    const e = Math.min(wmm / im.w, hmm / im.h), cx = Math.round(im.w * e * EMU), cy = Math.round(im.h * e * EMU);
    const ext = im.d.startsWith('data:image/png') ? 'png' : 'jpeg', id = ++nImg, rid = 'rImg' + id;
    z.file(`word/media/img${id}.${ext}`, im.d.split(',')[1], { base64: true });
    rels.push(`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/img${id}.${ext}"/>`);
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="Imagen ${id}"/>
<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="img${id}.${ext}"/><pic:cNvPicPr/></pic:nvPicPr>
<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>
<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  };
  const twip = mm => Math.round(mm * 56.7);
  const logos = c.logos || [], cab = t => {
    const izq = par(run(t, { b: true, sz: 32, col: AZUL }), { despues: 0 }) + par(run(c.subtitulo, { sz: 18, col: GRIS }), { despues: 0 });
    if (!logos.length) return par(run(t, { b: true, sz: 32, col: AZUL }), { despues: 0 }) + par(run(c.subtitulo, { sz: 18, col: GRIS }), { borde: true, despues: 200 });
    const der = par(logos.map((l, i) => (i ? run('  ', {}) : '') + imagen(l, 30, 12)).join(''), { al: 'right', despues: 0 });
    return `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/><w:bottom w:val="single" w:sz="10" w:color="${hex(AZUL)}"/></w:tblBorders><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr>
<w:tblGrid><w:gridCol w:w="${twip(110)}"/><w:gridCol w:w="${twip(72)}"/></w:tblGrid><w:tr><w:tc><w:tcPr><w:tcW w:w="${twip(110)}" w:type="dxa"/><w:vAlign w:val="bottom"/></w:tcPr>${izq}</w:tc><w:tc><w:tcPr><w:tcW w:w="${twip(72)}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${der}</w:tc></w:tr></w:tbl>${par('', { despues: 120 })}`;
  };

  let b = cab(c.titulo);
  if (!c.soloResumen) b += par(run(c.resumen, { sz: 21 })) + par(run(c.conteo, { b: true, sz: 20 }), { despues: 160 });
  const celda = (t, w, enc, ci) => `<w:tc><w:tcPr><w:tcW w:w="${twip(w)}" w:type="dxa"/>${enc || ci ? `<w:shd w:val="clear" w:color="auto" w:fill="${hex(enc ? CELESTE : ci.fondo)}"/>` : ''}</w:tcPr>${par(run(t, { b: enc || !!ci, sz: 17, col: ci?.letra }), { despues: 0 })}</w:tc>`;
  const tabla = (cols, filas) => filas.length ? `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:insideH w:val="single" w:sz="4" w:color="D5DDE6"/><w:bottom w:val="single" w:sz="4" w:color="D5DDE6"/></w:tblBorders><w:tblCellMar><w:left w:w="60" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tblCellMar></w:tblPr>
<w:tblGrid>${cols.map(([, w]) => `<w:gridCol w:w="${twip(w)}"/>`).join('')}</w:tblGrid>
<w:tr><w:trPr><w:tblHeader/></w:trPr>${cols.map(([t, w]) => celda(t, w, true)).join('')}</w:tr>
${filas.map(f => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${f.map((v, i) => celda(v, cols[i][1], false, colorInd(cols, i, v))).join('')}</w:tr>`).join('')}</w:tbl>` : par(run('Sin indicaciones registradas.'));
  if (!c.soloResumen) b += tabla(COLS, c.filas);

  if (c.resumenCal) {
    const R = c.resumenCal, tw = 182 / R.tiles.length;
    b += c.soloResumen ? par(run(R.titulo, { b: true, sz: 24, col: AZUL }), { despues: 100 }) : salto + cab(R.titulo);
    b += `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:insideV w:val="single" w:sz="4" w:color="FFFFFF"/></w:tblBorders></w:tblPr><w:tblGrid>${R.tiles.map(() => `<w:gridCol w:w="${twip(tw)}"/>`).join('')}</w:tblGrid><w:tr>${R.tiles.map(([v, t]) =>
      `<w:tc><w:tcPr><w:tcW w:w="${twip(tw)}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${hex(SUAVE)}"/></w:tcPr>${par(run(String(v), { b: true, sz: 30, col: AZUL }), { al: 'center', antes: 80, despues: 0 })}${par(run(t, { sz: 15, col: GRIS }), { al: 'center', despues: 80 })}</w:tc>`).join('')}</w:tr></w:tbl>`;
    b += par(run('Verde: nivel inspeccionado · entre paréntesis: hallazgos en el nivel', { sz: 16, col: GRIS }), { antes: 80 });
    R.shs.forEach(sh => {
      b += par(run(sh.nombre, { b: true, sz: 21, col: AZUL }) + run('    ' + sh.estado, { sz: 16, col: GRIS }), { sh: SUAVE, antes: 160, despues: 60 });
      const cw = Math.min(24, 182 / sh.niveles.length);
      b += `<w:tbl><w:tblPr><w:tblBorders><w:insideV w:val="single" w:sz="12" w:color="FFFFFF"/></w:tblBorders></w:tblPr><w:tblGrid>${sh.niveles.map(() => `<w:gridCol w:w="${twip(cw)}"/>`).join('')}</w:tblGrid><w:tr>${sh.niveles.map(nv =>
        `<w:tc><w:tcPr><w:tcW w:w="${twip(cw)}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${hex(nv.ok ? VERDE : [238, 243, 248])}"/></w:tcPr>${par(run(nv.nom, { b: true, sz: 17, col: nv.ok ? [27, 94, 32] : AZUL }) + (nv.n ? run(` (${nv.n})`, { b: true, sz: 17, col: ROJO }) : ''), { al: 'center', antes: 40, despues: 40 })}</w:tc>`).join('')}</w:tr></w:tbl>`;
      if (sh.filas.length) b += par('', { despues: 40 }) + tabla(COLS_RES, sh.filas);
    });
  }

  if (c.croquis) b += salto + cab(c.croquis.titulo) + par(imagen(c.croquis.img, 182, 232), { al: 'center' });
  const CW = 87, CH = 72, varias = c.secciones.length > 1;
  for (const sec of c.secciones) {
  for (const nv of sec.niveles) {
    b += salto + cab(nv.titulo) + par(imagen(nv.img, 182, 232), { al: 'center' });
    b += salto + cab('Indicaciones · ' + nv.titulo) + tabla(COLS_NIV, nv.filas);
  }

  if (sec.fichas.length) b += salto + cab('Detalle de indicaciones' + (varias ? ' · ' + sec.titulo : ''));
  sec.fichas.forEach((f, i) => {
    const foto = (k, rot) => f[k]
      ? `<w:tc><w:tcPr><w:tcW w:w="${twip(CW + 4)}" w:type="dxa"/></w:tcPr>${par(imagen(f[k], CW, CH), { al: 'center', despues: 40 })}${par(run(rot, { b: true, sz: 18, col: AZUL }), { al: 'center' })}</w:tc>`
      : `<w:tc><w:tcPr><w:tcW w:w="${twip(CW + 4)}" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="${hex(SUAVE)}"/><w:vAlign w:val="center"/></w:tcPr>${par(run(`Sin ${rot.toLowerCase()}`, { sz: 18, col: GRIS }), { al: 'center', despues: 0 })}</w:tc>`;
    b += `<w:p><w:pPr><w:keepNext/><w:spacing w:before="${i ? 240 : 0}" w:after="60"/><w:shd w:val="clear" w:color="auto" w:fill="${hex(SUAVE)}"/></w:pPr>${run(f.titulo, { b: true, sz: 25 })}</w:p>`;
    b += `<w:p><w:pPr><w:keepNext/><w:spacing w:after="80"/></w:pPr>${run(f.ubic, { sz: 19 })}</w:p>`;
    b += `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:tblBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders></w:tblPr>
<w:tblGrid><w:gridCol w:w="${twip(CW + 4)}"/><w:gridCol w:w="${twip(CW + 4)}"/></w:tblGrid><w:tr><w:trPr><w:cantSplit/><w:trHeight w:val="${twip(CH + 10)}"/></w:trPr>${foto('general', 'Foto general')}${foto('detalle', 'Foto de detalle')}</w:tr></w:tbl>`;
    b += par(run('Observaciones', { b: true, sz: 20, col: AZUL }), { antes: 80, despues: 40 });
    b += par(run(f.obs || 'Sin observaciones.', { sz: 19 }), { despues: 120, borde: true });
  });
  }

  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
  z.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${b}
<w:sectPr><w:footerReference w:type="default" r:id="rPie"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="794" w:right="794" w:bottom="907" w:left="794" w:header="397" w:footer="454" w:gutter="0"/></w:sectPr></w:body></w:document>`);
  z.file('word/footer1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr ${NS}><w:p><w:pPr><w:jc w:val="right"/></w:pPr>${run(c.pie + ' · hoja ', { sz: 16, col: GRIS })}<w:r><w:rPr><w:color w:val="${hex(GRIS)}"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:color w:val="${hex(GRIS)}"/><w:sz w:val="16"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:color w:val="${hex(GRIS)}"/><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>${run('1', { sz: 16, col: GRIS })}<w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`);
  z.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="20"/><w:lang w:val="es-CL"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`);
  z.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rEst" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rPie" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>${rels.join('')}</Relationships>`);
  z.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rDoc" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  z.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>`);
  return z.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}
