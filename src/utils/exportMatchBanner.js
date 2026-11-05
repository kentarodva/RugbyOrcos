// ── Generador de Placa de Marcador HD y Resumen WhatsApp en Vivo ──

/**
 * Genera el texto formateado con emojis para compartir el marcador en vivo por WhatsApp
 */
export function buildMatchWhatsAppText({ liveMatch = {}, liveEvents = [], score = { orcos: 0, opponent: 0 }, status = 'live', currentMinute = 0 }) {
  const opponentName = liveMatch?.opponent_name || 'Rival';
  const tournament = liveMatch?.tournament || 'Torneo Oficial';
  const division = liveMatch?.division || 'Masculina Mayor';

  const statusLabel = status === 'live'
    ? `🔴 EN VIVO — Minuto ${currentMinute}'`
    : status === 'paused'
      ? `⏸️ PAUSADO / ENTRETIEMPO (${currentMinute}')`
      : '✅ FINALIZADO';

  const SCORING_EMOJIS = {
    try: '🏉 TRY (+5)',
    conversion: '🎯 CONVERSIÓN (+2)',
    penalty: '🥅 PENAL (+3)',
    drop_goal: '⚡ DROP GOAL (+3)',
  };

  const orcosEvents = (liveEvents || [])
    .filter(ev => ev.team === 'orcos')
    .map(ev => `  • ${ev.minute || '—'}' ${SCORING_EMOJIS[ev.event_type] || ev.event_type}: ${ev.player_name || 'Guerrero'}`)
    .join('\n');

  const banner = [
    `📢 *RUGBY ORCOS NEGROS CLUB*`,
    `🏆 *${tournament.toUpperCase()}* · ${division}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `⏱️ *ESTADO:* ${statusLabel}`,
    ``,
    `⚔️ *MARCADOR EN VIVO:*`,
    `🟢 *ORCOS NEGROS:* ${score.orcos}`,
    `⚪ *${opponentName.toUpperCase()}:* ${score.opponent}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    orcosEvents ? `📌 *Puntos Orcos:*\n${orcosEvents}\n━━━━━━━━━━━━━━━━━━━━━━` : null,
    `🔥 *¡Fuerza, Honor y Tercer Tiempo!* 🖤💚`,
  ].filter(Boolean).join('\n');

  return banner;
}

/**
 * Genera un Blob PNG de 1200x630 con la Placa Gráfica de Transmisión Oficial
 */
export async function generateMatchScoreBannerBlob({
  liveMatch = {},
  liveEvents = [],
  score = { orcos: 0, opponent: 0 },
  status = 'live',
  currentMinute = 0,
}) {
  const width = 1200;
  const height = 630;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  // Background gradient: carbon & emerald ambient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#060d13');
  bgGrad.addColorStop(0.5, '#0b1924');
  bgGrad.addColorStop(1, '#050a0f');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Decorative field markings / grid lines
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 230, 118, 0.08)';
  ctx.lineWidth = 2;
  for (let x = 100; x < width; x += 150) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  ctx.restore();

  // Outer border with neon glow
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 230, 118, 0.4)';
  ctx.lineWidth = 6;
  ctx.strokeRect(16, 16, width - 32, height - 32);
  ctx.strokeStyle = 'rgba(255, 215, 64, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, width - 48, height - 48);
  ctx.restore();

  // Header Bar
  ctx.fillStyle = '#0a6e2e';
  ctx.fillRect(40, 40, width - 80, 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('RUGBY ORCOS NEGROS CLUB · TRANSMISIÓN OFICIAL', 60, 73);

  const opponentName = (liveMatch?.opponent_name || 'RIVAL').toUpperCase();
  const tournament = (liveMatch?.tournament || 'TORNEO OFICIAL').toUpperCase();

  ctx.fillStyle = '#ffd740';
  ctx.font = '700 16px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(tournament, width - 60, 72);

  // Status Pill in Center
  const statusText = status === 'live'
    ? `🔴 EN VIVO · MINUTO ${currentMinute}'`
    : status === 'paused'
      ? `⏸️ ENTRETIEMPO (${currentMinute}')`
      : '✅ FINALIZADO';

  ctx.save();
  ctx.fillStyle = status === 'live' ? '#ff1744' : status === 'paused' ? '#f59e0b' : '#10b981';
  ctx.beginPath();
  ctx.roundRect((width / 2) - 150, 110, 300, 38, 19);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 17px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(statusText, width / 2, 135);
  ctx.restore();

  // Scoreboard Container
  const boxY = 170;
  const boxH = 300;

  // Left Card: Orcos
  ctx.save();
  ctx.fillStyle = 'rgba(10, 35, 20, 0.7)';
  ctx.strokeStyle = 'rgba(0, 230, 118, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(60, boxY, 440, boxH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#00e676';
  ctx.font = '900 32px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ORCOS NEGROS', 280, boxY + 65);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '700 15px Arial, sans-serif';
  ctx.fillText('LOCAL / CLUB', 280, boxY + 95);

  ctx.fillStyle = '#00e676';
  ctx.font = '900 135px "Outfit", Arial, sans-serif';
  ctx.shadowColor = 'rgba(0, 230, 118, 0.6)';
  ctx.shadowBlur = 25;
  ctx.fillText(String(score.orcos ?? 0), 280, boxY + 240);
  ctx.restore();

  // Middle VS
  ctx.save();
  ctx.fillStyle = '#ffd740';
  ctx.font = '900 48px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(255, 215, 64, 0.5)';
  ctx.shadowBlur = 15;
  ctx.fillText('VS', width / 2, boxY + 165);
  ctx.restore();

  // Right Card: Opponent
  ctx.save();
  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(width - 500, boxY, 440, boxH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 30px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'center';
  const displayOpponent = opponentName.length > 18 ? opponentName.slice(0, 16) + '...' : opponentName;
  ctx.fillText(displayOpponent, width - 280, boxY + 65);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 15px Arial, sans-serif';
  ctx.fillText('VISITANTE / RIVAL', width - 280, boxY + 95);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '900 135px "Outfit", Arial, sans-serif';
  ctx.fillText(String(score.opponent ?? 0), width - 280, boxY + 240);
  ctx.restore();

  // Bottom Ticker / Try Scorers
  ctx.save();
  ctx.fillStyle = 'rgba(7, 15, 24, 0.9)';
  ctx.strokeStyle = 'rgba(0, 230, 118, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(60, 495, width - 120, 85, 12);
  ctx.fill();
  ctx.stroke();

  const recentTries = (liveEvents || [])
    .filter(ev => ev.team === 'orcos' && (ev.event_type === 'try' || ev.event_type === 'penalty'))
    .slice(-3)
    .map(ev => `${ev.minute}' ${ev.event_type.toUpperCase()}: ${ev.player_name || 'Guerrero'}`)
    .join('  |  ');

  ctx.fillStyle = '#00e676';
  ctx.font = '900 16px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ANOTACIONES DESTACADAS:', 80, 532);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 15px Arial, sans-serif';
  const tickerText = recentTries || 'Sin incidencias mayores registradas · Partido en disputa activa';
  ctx.fillText(tickerText, 80, 558);

  ctx.fillStyle = '#ffd740';
  ctx.font = 'italic 700 14px "Outfit", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Fuerza, Honor y Tercer Tiempo 🏉', width - 80, 545);
  ctx.restore();

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * Descarga el banner como PNG e intenta copiarlo al portapapeles
 */
export async function copyOrDownloadMatchBanner(params) {
  const blob = await generateMatchScoreBannerBlob(params);
  if (!blob) throw new Error('No se pudo generar la imagen del marcador');

  const opponent = (params.liveMatch?.opponent_name || 'Rival').replace(/\s+/g, '_');
  const filename = `Marcador_Orcos_vs_${opponent}_min${params.currentMinute || 0}.png`;

  // Always trigger download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  // Try clipboard
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
