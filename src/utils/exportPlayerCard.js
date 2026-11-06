// ── Generador de Ficha Coleccionable de Guerrero (Trading Card RPG) ──
// Renderiza una tarjeta de alta definición en Canvas (1200x1200 / 4K) para compartir en redes sociales

import { calculateAttributes } from '../engine/attributeCalculator';
import { getLocal4kPhoto } from './localPhotoStorage';

function loadCardImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generatePlayerCardBlob(player = {}, teamLabel = 'Rugby Orcos Negros Club', options = {}) {
  const is4k = options.quality === '4k' || options.resolution === '4k';
  const scale = is4k ? 2 : 1;
  const width = 1200 * scale;
  const height = 1200 * scale;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Blob(['mock-card-blob'], { type: 'image/png' });

  if (scale !== 1) {
    ctx.scale(scale, scale);
  }

  // Background Gradient
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#0D100E');
  bg.addColorStop(0.4, '#1D201E');
  bg.addColorStop(0.8, '#141715');
  bg.addColorStop(1, '#070A08');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Carbon decorative lines
  ctx.save();
  ctx.strokeStyle = 'rgba(46, 229, 122, 0.07)';
  ctx.lineWidth = 3;
  for (let i = -width; i < width * 2; i += 80) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + height, height);
    ctx.stroke();
  }
  ctx.restore();

  // Outer border & gold inner frame
  ctx.save();
  ctx.strokeStyle = 'rgba(46, 229, 122, 0.6)';
  ctx.lineWidth = 10;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  ctx.strokeStyle = 'rgba(255, 215, 64, 0.7)';
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, width - 72, height - 72);
  ctx.restore();

  // Header Title
  ctx.fillStyle = '#0a6e2e';
  ctx.fillRect(50, 50, width - 100, 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(teamLabel.toUpperCase(), 75, 90);

  ctx.fillStyle = '#E8B931';
  ctx.font = '900 20px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('FICHA OFICIAL DE GUERRERO', width - 75, 88);

  // Left Column: Player Portrait Area
  const pBoxX = 70;
  const pBoxY = 140;
  const pBoxW = 420;
  const pBoxH = 500;

  ctx.save();
  ctx.fillStyle = 'rgba(23, 26, 24, 0.8)';
  ctx.strokeStyle = 'rgba(46, 229, 122, 0.5)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(pBoxX, pBoxY, pBoxW, pBoxH, 20);
  ctx.fill();
  ctx.stroke();

  // Jersey Number Badge (Top-left of portrait)
  ctx.fillStyle = '#2EE57A';
  ctx.beginPath();
  ctx.arc(pBoxX + 65, pBoxY + 65, 45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#070A08';
  ctx.font = '900 42px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(player.camiseta || '—'), pBoxX + 65, pBoxY + 80);

  // Center Avatar Circle inside portrait box
  const avatarCenterX = pBoxX + pBoxW / 2;
  const avatarCenterY = pBoxY + pBoxH / 2 + 10;
  const avatarRadius = 130;

  // Carga de foto: Prioridad 1: 4K local en IndexedDB, Prioridad 2: photo_url en nube
  let photoSrc = null;
  let revokePhotoUrl = null;
  try {
    const localBlob = await getLocal4kPhoto(player.id);
    if (localBlob) {
      photoSrc = URL.createObjectURL(localBlob);
      revokePhotoUrl = photoSrc;
    }
  } catch {
    // Modo seguro
  }
  if (!photoSrc && player.photo_url) {
    photoSrc = player.photo_url;
  }

  const playerImg = await loadCardImage(photoSrc);

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  if (playerImg) {
    const minDim = Math.min(playerImg.width, playerImg.height);
    const sx = (playerImg.width - minDim) / 2;
    const sy = (playerImg.height - minDim) / 2;
    ctx.drawImage(
      playerImg,
      sx, sy, minDim, minDim,
      avatarCenterX - avatarRadius, avatarCenterY - avatarRadius,
      avatarRadius * 2, avatarRadius * 2
    );
  } else {
    ctx.fillStyle = 'rgba(46, 229, 122, 0.15)';
    ctx.fillRect(avatarCenterX - avatarRadius, avatarCenterY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 110px "Outfit", Arial, sans-serif';
    ctx.textAlign = 'center';
    const initial = (player.name || 'O').charAt(0).toUpperCase();
    ctx.fillText(initial, avatarCenterX, avatarCenterY + 40);
  }
  ctx.restore();

  if (revokePhotoUrl) {
    try {
      URL.revokeObjectURL(revokePhotoUrl);
    } catch {
      // Ignora error de revoke
    }
  }

  // Borde neón exterior del avatar
  ctx.save();
  ctx.strokeStyle = '#2EE57A';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Position Banner across bottom of portrait
  ctx.fillStyle = '#0a6e2e';
  ctx.fillRect(pBoxX + 20, pBoxY + pBoxH - 65, pBoxW - 40, 45);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 19px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((player.posicion || 'JUGADOR').toUpperCase(), pBoxX + pBoxW / 2, pBoxY + pBoxH - 36);
  ctx.restore();

  // Right Column: Player Identity & RPG Attributes
  const rightX = 530;
  const fullName = `${player.name || ''} ${player.last_name || ''}`.trim() || 'Guerrero Orcos';

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'left';
  const displayTitle = fullName.length > 20 ? fullName.slice(0, 19) + '...' : fullName;
  ctx.fillText(displayTitle, rightX, 200);

  if (player.apodo) {
    ctx.fillStyle = '#E8B931';
    ctx.font = 'italic 700 28px "Outfit", Arial, sans-serif';
    ctx.fillText(`"${player.apodo}"`, rightX, 245);
  }

  // Meta pills: Status & Category
  const division = (player.teamCategory || 'Masculina Mayor').replace('orcos_', '').replace(/_/g, ' ').toUpperCase();
  ctx.save();
  ctx.fillStyle = 'rgba(46, 229, 122, 0.2)';
  ctx.strokeStyle = '#2EE57A';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(rightX, 275, 280, 36, 18);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2EE57A';
  ctx.font = '800 15px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(division, rightX + 140, 299);
  ctx.restore();

  // Attribute Bars Section
  const calculated = calculateAttributes(player);
  const playerAttrs = player.attributes || {};
  const forceVal = player.fuerza || playerAttrs.force || calculated.force || 75;
  const tackleVal = player.placaje || playerAttrs.tackle || calculated.tackle || 75;
  const staminaVal = player.resistencia || playerAttrs.stamina || calculated.stamina || 70;
  const speedVal = player.velocidad || playerAttrs.speed || calculated.speed || 70;
  const techniqueVal = player.pase || playerAttrs.technique || calculated.technique || 72;
  const overallVal = player.ovr || calculated.overall || Math.round((forceVal + tackleVal + staminaVal + speedVal + techniqueVal) / 5);

  ctx.fillStyle = '#E8B931';
  ctx.font = '900 22px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ESTADÍSTICAS & ATRIBUTOS DE COMBATE', rightX, 360);

  // Overall OVR Pill
  ctx.save();
  ctx.fillStyle = 'rgba(46, 229, 122, 0.25)';
  ctx.strokeStyle = '#2EE57A';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(rightX + 440, 336, 100, 32, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2EE57A';
  ctx.font = '900 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`OVR ${overallVal}`, rightX + 490, 358);
  ctx.restore();

  const attributes = [
    { label: 'Fuerza & Scrums', val: forceVal, color: '#2EE57A' },
    { label: 'Tackles & Contacto', val: tackleVal, color: '#2EE57A' },
    { label: 'Resistencia Aeróbica', val: staminaVal, color: '#E8B931' },
    { label: 'Velocidad & Evasión', val: speedVal, color: '#E8B931' },
    { label: 'Manejo de Balón & Pases', val: techniqueVal, color: '#38bdf8' },
  ];

  let attrY = 405;
  const barMaxW = 540;

  attributes.forEach(attr => {
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 16px "Outfit", Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(attr.label, rightX, attrY);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${attr.val}%`, rightX + barMaxW, attrY);

    // Track background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(rightX, attrY + 8, barMaxW, 14, 7);
    ctx.fill();

    // Active bar
    const filledW = Math.min(barMaxW, (attr.val / 100) * barMaxW);
    ctx.fillStyle = attr.color;
    ctx.beginPath();
    ctx.roundRect(rightX, attrY + 8, filledW, 14, 7);
    ctx.fill();

    attrY += 50;
  });

  // Lower Section: Makgora Rank & Honor Banner
  const botBoxY = 680;
  const botBoxH = 430;

  ctx.save();
  ctx.fillStyle = 'rgba(19, 22, 20, 0.9)';
  ctx.strokeStyle = 'rgba(255, 215, 64, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(70, botBoxY, width - 140, botBoxH, 20);
  ctx.fill();
  ctx.stroke();

  // 3 Mini Cards in Lower Section
  const colW = (width - 200) / 3;

  // Col 1: Partidos y Trayectoria
  ctx.fillStyle = '#E8B931';
  ctx.font = '900 20px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HISTORIAL CLÁSICO', 70 + colW / 2 + 15, botBoxY + 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 64px "Outfit", Arial, sans-serif';
  ctx.fillText(String(player.partidos_jugados || player.partidos || 12), 70 + colW / 2 + 15, botBoxY + 140);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 16px "Outfit", Arial, sans-serif';
  ctx.fillText('Partidos Disputados', 70 + colW / 2 + 15, botBoxY + 180);

  // Col 2: Nivel Makgora RPG
  ctx.fillStyle = '#2EE57A';
  ctx.font = '900 20px "Outfit", Arial, sans-serif';
  ctx.fillText('RANGO MAKGORA', 70 + colW * 1.5 + 15, botBoxY + 50);

  ctx.fillStyle = '#2EE57A';
  ctx.font = '900 64px "Outfit", Arial, sans-serif';
  ctx.fillText(String(player.makgora_rank || 'NIV 4'), 70 + colW * 1.5 + 15, botBoxY + 140);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 16px "Outfit", Arial, sans-serif';
  ctx.fillText('Rango de Combate', 70 + colW * 1.5 + 15, botBoxY + 180);

  // Col 3: Estado de Honor
  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 20px "Outfit", Arial, sans-serif';
  ctx.fillText('ESTADO EN CLUB', 70 + colW * 2.5 + 15, botBoxY + 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px "Outfit", Arial, sans-serif';
  ctx.fillText((player.estado || 'ACTIVO').toUpperCase(), 70 + colW * 2.5 + 15, botBoxY + 135);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 16px "Outfit", Arial, sans-serif';
  ctx.fillText('Ficha Habilitada', 70 + colW * 2.5 + 15, botBoxY + 180);

  // Lower quote / motto
  ctx.fillStyle = '#2EE57A';
  ctx.font = 'italic 700 24px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('«FUERZA, HONOR Y TERCER TIEMPO»', width / 2, botBoxY + 300);

  ctx.fillStyle = '#64748b';
  ctx.font = '600 16px monospace';
  ctx.fillText(`ID GUERRERO: ORC-${player.id || '001'} · TEMPORADA 2026 OFICIAL`, width / 2, botBoxY + 345);
  ctx.restore();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

export async function copyOrDownloadPlayerCard(player, teamLabel, options = {}) {
  const blob = await generatePlayerCardBlob(player, teamLabel, options);
  if (!blob) throw new Error('No se pudo generar la ficha');

  const safeName = (player.name || 'Guerrero').replace(/\s+/g, '_');
  const suffix = (options.quality === '4k' || options.resolution === '4k') ? '_4K' : '';
  const filename = `Ficha_Orcos_${safeName}${suffix}.png`;

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
