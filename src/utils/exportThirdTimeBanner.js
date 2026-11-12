import { localDateKey } from './agendaItems';
// ── Generador de Placa Oficial de Tercer Tiempo & MVP de la Batalla ──
// Renderiza en Canvas 2D una tarjeta de honor de alta definición (1200x675px)
// celebrando la hermandad entre Orcos Negros y el equipo rival visitante.

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Genera el Blob PNG de la placa de Tercer Tiempo & MVP.
 */
export async function generateThirdTimeBannerBlob(match = {}, thirdTime = {}) {
  const width = 1200;
  const height = 675;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new Blob(['canvas-mock-blob'], { type: 'image/png' });
  }

  // Fondo degradado carbón / verde orco
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#0D100E');
  bg.addColorStop(0.5, '#191C1A');
  bg.addColorStop(1, '#0A0D0B');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Marco exterior
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 215, 64, 0.7)';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  ctx.strokeStyle = 'rgba(46, 229, 122, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, width - 64, height - 64);
  ctx.restore();

  // Cabecera
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RUGBY ORCOS NEGROS CLUB · TERCER TIEMPO OFICIAL', width / 2, 70);

  ctx.fillStyle = '#E8B931';
  ctx.font = '900 36px "Outfit", Arial, sans-serif';
  ctx.fillText('HOMENAJE A LOS MEJORES GUERREROS DE LA BATALLA', width / 2, 115);

  // Línea de enfrentamiento y marcador
  const rivalName = (match.rival || match.opponent || thirdTime.rival_name || 'RIVAL VISITANTE').toUpperCase();
  const orcosScore = match.score_orcos ?? match.score_us ?? 0;
  const rivalScore = match.score_rival ?? match.score_them ?? 0;

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 18px "Outfit", Arial, sans-serif';
  ctx.fillText(`ORCOS NEGROS (${orcosScore})  VS  ${rivalName} (${rivalScore})`, width / 2, 155);

  // Dos Tarjetas de MVP: Izquierda (Orcos) y Derecha (Rival)
  const cardW = 480;
  const cardH = 340;
  const cardY = 180;

  // 1. Tarjeta Orcos (Izquierda)
  const x1 = 90;
  ctx.save();
  ctx.fillStyle = 'rgba(46, 229, 122, 0.08)';
  ctx.strokeStyle = '#2EE57A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x1, cardY, cardW, cardH, 16);
  ctx.fill();
  ctx.stroke();

  // Badge MVP
  ctx.fillStyle = '#2EE57A';
  ctx.fillRect(x1 + 20, cardY + 20, 160, 32);
  ctx.fillStyle = '#070A08';
  ctx.font = '900 14px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MVP ORCOS NEGROS', x1 + 100, cardY + 41);

  const orcosMvpName = thirdTime.orcos_mvp_name || 'Guerrero Destacado';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(orcosMvpName, x1 + 25, cardY + 95);

  ctx.fillStyle = '#2EE57A';
  ctx.font = '700 16px "Outfit", Arial, sans-serif';
  ctx.fillText(`Camiseta #${thirdTime.orcos_mvp_number || '—'} · ${thirdTime.orcos_mvp_pos || 'Titular'}`, x1 + 25, cardY + 125);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'italic 500 16px "Outfit", Arial, sans-serif';
  const orcosNote = thirdTime.orcos_mvp_note || 'Liderazgo en el contacto, tackles dominantes y espíritu de equipo.';
  ctx.fillText(orcosNote.length > 50 ? orcosNote.slice(0, 48) + '...' : orcosNote, x1 + 25, cardY + 165);

  // Avatar / Foto MVP Orcos
  const orcosImg = await loadImage(thirdTime.orcos_mvp_photo);
  const avatarCenterX = x1 + cardW - 90;
  const avatarCenterY = cardY + 80;
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, 55, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (orcosImg) {
    ctx.drawImage(orcosImg, avatarCenterX - 55, avatarCenterY - 55, 110, 110);
  } else {
    ctx.fillStyle = '#1F2220';
    ctx.fillRect(avatarCenterX - 55, avatarCenterY - 55, 110, 110);
    ctx.fillStyle = '#2EE57A';
    ctx.font = '900 36px "Outfit", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚔️', avatarCenterX, avatarCenterY + 12);
  }
  ctx.restore();

  // Honor Makgora Badge
  ctx.fillStyle = '#E8B931';
  ctx.font = '800 15px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('⭐ +150 XP de Honor Makgora Otorgados', x1 + 25, cardY + cardH - 30);
  ctx.restore();

  // 2. Tarjeta Rival (Derecha)
  const x2 = 630;
  ctx.save();
  ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x2, cardY, cardW, cardH, 16);
  ctx.fill();
  ctx.stroke();

  // Badge MVP Rival
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(x2 + 20, cardY + 20, 160, 32);
  ctx.fillStyle = '#070A08';
  ctx.font = '900 14px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MVP RIVAL DE HONOR', x2 + 100, cardY + 41);

  const rivalMvpName = thirdTime.rival_mvp_name || 'Guerrero Visitante';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(rivalMvpName, x2 + 25, cardY + 95);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 16px "Outfit", Arial, sans-serif';
  ctx.fillText(`${rivalName} · Camiseta #${thirdTime.rival_mvp_number || '—'}`, x2 + 25, cardY + 125);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'italic 500 16px "Outfit", Arial, sans-serif';
  const rivalNote = thirdTime.rival_mvp_note || 'Gran entrega deportiva, juego limpio y caballerosidad en el campo.';
  ctx.fillText(rivalNote.length > 50 ? rivalNote.slice(0, 48) + '...' : rivalNote, x2 + 25, cardY + 165);

  // Avatar / Foto MVP Rival
  const rivalImg = await loadImage(thirdTime.rival_mvp_photo);
  const rivalCenterX = x2 + cardW - 90;
  const rivalCenterY = cardY + 80;
  ctx.save();
  ctx.beginPath();
  ctx.arc(rivalCenterX, rivalCenterY, 55, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (rivalImg) {
    ctx.drawImage(rivalImg, rivalCenterX - 55, rivalCenterY - 55, 110, 110);
  } else {
    ctx.fillStyle = '#082f49';
    ctx.fillRect(rivalCenterX - 55, rivalCenterY - 55, 110, 110);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '900 36px "Outfit", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏉', rivalCenterX, rivalCenterY + 12);
  }
  ctx.restore();

  // Distintivo de Hermandad
  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 15px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🤝 Distinción Oficial de Caballerosidad Orcos', x2 + 25, cardY + cardH - 30);
  ctx.restore();

  // Pie de Página
  ctx.fillStyle = '#E8B931';
  ctx.font = 'italic 700 20px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('«Rivales en la cancha, hermanos en el Tercer Tiempo»', width / 2, height - 60);

  ctx.fillStyle = '#64748b';
  ctx.font = '600 14px monospace';
  ctx.fillText(`FECHA OFICIAL: ${match.date || localDateKey()} · TEMPORADA OFICIAL`, width / 2, height - 35);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * Genera el texto formateado de Tercer Tiempo para enviar por WhatsApp al capitán rival.
 */
export function generateThirdTimeWhatsAppText(match = {}, thirdTime = {}) {
  const rival = (match.rival || match.opponent || thirdTime.rival_name || 'Rival').trim();
  const orcosScore = match.score_orcos ?? match.score_us ?? 0;
  const rivalScore = match.score_rival ?? match.score_them ?? 0;

  return `🍻 *RUGBY ORCOS NEGROS CLUB — HOMENAJE TERCER TIEMPO* 🍻
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏉 *Resultado:* Orcos Negros (${orcosScore}) vs ${rival} (${rivalScore})
📍 *Cancha:* ${match.location || 'Campo de Juego Oficial'}

⚔️ *MVP Orcos Negros:* ${thirdTime.orcos_mvp_name || 'Guerrero Destacado'} (#${thirdTime.orcos_mvp_number || '—'})
🤝 *MVP Rival Destacado:* ${thirdTime.rival_mvp_name || 'Guerrero Rival'} (#${thirdTime.rival_mvp_number || '—'})

✨ _En nombre de toda la manada de Orcos Negros, felicitamos a ${thirdTime.rival_mvp_name || 'su equipo'} y a todo el club ${rival} por la garra, el respeto y la caballerosidad demostrada en la cancha y en el Tercer Tiempo._

💪 *«Rivales en la cancha, hermanos en el Tercer Tiempo»*`;
}

/**
 * Descarga o copia la placa de Tercer Tiempo.
 */
export async function copyOrDownloadThirdTimeBanner(match, thirdTime) {
  const blob = await generateThirdTimeBannerBlob(match, thirdTime);
  if (!blob) throw new Error('No se pudo generar el banner de Tercer Tiempo');

  const safeRival = (match.rival || 'Rival').replace(/\s+/g, '_');
  const filename = `Tercer_Tiempo_Orcos_vs_${safeRival}.png`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  let copied = false;
  if (navigator.clipboard && window.ClipboardItem) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      copied = true;
    } catch {
      copied = false;
    }
  }

  return { copied, filename };
}
