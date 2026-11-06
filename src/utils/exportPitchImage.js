import { POS_ABREVIATIONS } from '../components/CanchaTactica/constants';

function drawArrowhead(ctx, fromX, fromY, toX, toY, radius, color) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - radius * Math.cos(angle - Math.PI / 6), toY - radius * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - radius * Math.cos(angle + Math.PI / 6), toY - radius * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Renders a TV-broadcast style 1600x980 PNG Blob of the current Tactical Pitch + Lineup + Phase Explanation.
 */
export async function generateTacticalPitchImageBlob({
  title = 'Pizarra Táctica XV',
  subtitle = 'Rugby Orcos Club Manager',
  fieldPositions = [],
  prevFieldPositions = [],
  lineup = {},
  teamPlayers = [],
  showRivals = false,
  rivalPositions = [],
  prevRivalPositions = [],
  showBall = true,
  ballPosition = { x: 46, y: 45 },
  passFrom = null,
  gainLineX = null,
  highlightZone = null,
  activePhaseInfo = null,
  tacticalNotes = '',
}) {
  const W = 1600;
  const H = 980;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 1. Background
  ctx.fillStyle = '#0A0D0B';
  ctx.fillRect(0, 0, W, H);

  // 2. Top TV Broadcast Header
  ctx.fillStyle = '#151816';
  ctx.fillRect(0, 0, W, 76);
  ctx.fillStyle = '#2EE57A';
  ctx.fillRect(0, 73, W, 3);

  ctx.fillStyle = '#2EE57A';
  ctx.font = '900 22px Outfit, Inter, sans-serif';
  ctx.fillText('🏉 RUGBY ORCOS TV — PIZARRA TÁCTICA OFICIAL', 36, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 18px Inter, sans-serif';
  ctx.fillText(title, 36, 61);

  ctx.fillStyle = '#E8B931';
  ctx.font = '700 15px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(subtitle, W - 36, 46);
  ctx.textAlign = 'left';

  // 3. Pitch Geometry
  const pitchX = 36;
  const pitchY = 96;
  const pitchW = 1090;
  const pitchH = 710;

  // Turf stripes
  const stripes = 20;
  const stripeW = pitchW / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#212422' : '#1A1D1B';
    ctx.fillRect(pitchX + i * stripeW, pitchY, stripeW + 1, pitchH);
  }

  // Pitch border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 3;
  ctx.strokeRect(pitchX, pitchY, pitchW, pitchH);

  // Pitch markings (Horizontal percentages: 8%, 26%, 42%, 50%, 58%, 74%, 92%)
  const lines = [
    { pct: 8, label: 'ENSAYO', dashed: false, width: 2.5 },
    { pct: 26, label: '22M', dashed: true, width: 1.5 },
    { pct: 42, label: '10M', dashed: true, width: 1.5 },
    { pct: 50, label: 'MITAD', dashed: false, width: 3 },
    { pct: 58, label: '10M', dashed: true, width: 1.5 },
    { pct: 74, label: '22M', dashed: true, width: 1.5 },
    { pct: 92, label: 'ENSAYO', dashed: false, width: 2.5 },
  ];

  lines.forEach(l => {
    const lx = pitchX + (l.pct / 100) * pitchW;
    ctx.save();
    ctx.strokeStyle = l.pct === 50 ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)';
    ctx.lineWidth = l.width;
    if (l.dashed) ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(lx, pitchY);
    ctx.lineTo(lx, pitchY + pitchH);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = l.pct === 50 ? '#2EE57A' : 'rgba(255,255,255,0.7)';
    ctx.font = '800 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(l.label, lx, pitchY + 18);
    ctx.fillText(l.label, lx, pitchY + pitchH - 8);
  });
  ctx.textAlign = 'left';

  const toPx = (pt) => ({
    x: pitchX + ((pt?.x ?? 50) / 100) * pitchW,
    y: pitchY + ((pt?.y ?? 50) / 100) * pitchH,
  });

  // 4. Broadcast Gain Line
  if (gainLineX != null) {
    const gx = pitchX + (gainLineX / 100) * pitchW;
    ctx.save();
    ctx.strokeStyle = 'rgba(64, 196, 255, 0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 8]);
    ctx.beginPath();
    ctx.moveTo(gx, pitchY);
    ctx.lineTo(gx, pitchY + pitchH);
    ctx.stroke();
    ctx.restore();
  }

  // 5. Broadcast Highlight Zone
  if (highlightZone) {
    const hz = toPx(highlightZone);
    const rx = ((highlightZone.r || 8) / 100) * pitchW;
    const ry = rx * 1.1;
    ctx.save();
    ctx.fillStyle = 'rgba(46, 229, 122, 0.16)';
    ctx.strokeStyle = '#2EE57A';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.ellipse(hz.x, hz.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    if (highlightZone.label) {
      ctx.fillStyle = '#2EE57A';
      ctx.font = '900 13px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🎯 ${highlightZone.label}`, hz.x, hz.y - ry - 8);
      ctx.textAlign = 'left';
    }
  }

  // 6. Rival Movement Vectors
  if (showRivals && prevRivalPositions?.length > 0) {
    rivalPositions.forEach(curr => {
      const prev = prevRivalPositions.find(p => p.id === curr.id);
      if (prev) {
        const p1 = toPx(prev);
        const p2 = toPx(curr);
        if (Math.hypot(p2.x - p1.x, p2.y - p1.y) > 22) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 92, 77, 0.75)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 5]);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();
          drawArrowhead(ctx, p1.x, p1.y, p2.x, p2.y, 10, '#FF5C4D');
        }
      }
    });
  }

  // 7. Allied Movement Vectors
  if (prevFieldPositions?.length > 0) {
    fieldPositions.forEach(curr => {
      const prev = prevFieldPositions.find(p => p.id === curr.id);
      if (prev) {
        const p1 = toPx(prev);
        const p2 = toPx(curr);
        if (Math.hypot(p2.x - p1.x, p2.y - p1.y) > 22) {
          const color = curr.id <= 8 ? '#E8B931' : '#2EE57A';
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();
          drawArrowhead(ctx, p1.x, p1.y, p2.x, p2.y, 12, color);
        }
      }
    });
  }

  // 8. Pass Trajectory Curve
  if (passFrom && ballPosition) {
    const p1 = toPx(passFrom);
    const p2 = toPx(ballPosition);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    if (Math.hypot(dx, dy) > 15) {
      const midX = (p1.x + p2.x) / 2 - dy * 0.18;
      const midY = (p1.y + p2.y) / 2 + dx * 0.18;
      ctx.save();
      ctx.strokeStyle = '#E8B931';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 7]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
      ctx.stroke();
      ctx.restore();
      drawArrowhead(ctx, midX, midY, p2.x, p2.y, 13, '#E8B931');
    }
  }

  // 9. Rival Nodes
  if (showRivals) {
    rivalPositions.forEach(r => {
      const pt = toPx(r);
      ctx.save();
      ctx.fillStyle = '#991b1b';
      ctx.strokeStyle = '#fca5a5';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`R${r.num || String(r.id).replace('R', '')}`, pt.x, pt.y);
      ctx.restore();
    });
  }

  // 10. Allied Nodes
  fieldPositions.forEach(pos => {
    const pt = toPx(pos);
    const playerId = lineup[pos.id];
    const player = teamPlayers.find(p => p.id === playerId);
    const isForward = pos.id <= 8;
    const borderColor = isForward ? '#E8B931' : '#2EE57A';

    ctx.save();
    ctx.fillStyle = '#131614';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = borderColor;
    ctx.font = '900 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(POS_ABREVIATIONS[pos.id] || String(pos.id), pt.x, pt.y - 2);

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 9px Inter, sans-serif';
    ctx.fillText(`#${pos.id}`, pt.x, pt.y + 10);

    // Name tag below circle
    const label = player ? (player.apodo || player.name.split(' ').slice(0, 2).join(' ')) : pos.name.split(' ')[0];
    ctx.font = '700 11px Inter, sans-serif';
    const textW = Math.min(96, ctx.measureText(label).width + 12);
    ctx.fillStyle = 'rgba(11, 14, 12, 0.88)';
    ctx.fillRect(pt.x - textW / 2, pt.y + 23, textW, 17);
    ctx.fillStyle = player ? '#ffffff' : '#94a3b8';
    ctx.fillText(label.slice(0, 14), pt.x, pt.y + 32);
    ctx.restore();
  });

  // 11. Rugby Ball
  if (showBall && ballPosition) {
    const bPt = toPx(ballPosition);
    ctx.save();
    ctx.fillStyle = 'rgba(255, 215, 64, 0.28)';
    ctx.beginPath();
    ctx.arc(bPt.x, bPt.y, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(bPt.x, bPt.y);
    ctx.rotate(-0.42);
    ctx.fillStyle = '#ffd54f';
    ctx.strokeStyle = '#1a1200';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // 12. Right Broadcast Sidebar (XV Titular & Reservas)
  const sideX = 1148;
  const sideY = 96;
  const sideW = 416;
  const sideH = 710;

  ctx.fillStyle = '#151816';
  ctx.strokeStyle = 'rgba(46, 229, 122, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.fillRect(sideX, sideY, sideW, sideH);
  ctx.strokeRect(sideX, sideY, sideW, sideH);

  ctx.fillStyle = '#2EE57A';
  ctx.font = '900 16px Outfit, Inter, sans-serif';
  ctx.fillText('ALINEACIÓN XV TITULAR', sideX + 18, sideY + 30);

  for (let slot = 1; slot <= 15; slot++) {
    const rowY = sideY + 58 + (slot - 1) * 32;
    const pId = lineup[slot];
    const p = teamPlayers.find(x => x.id === pId);
    const isForward = slot <= 8;

    ctx.fillStyle = isForward ? 'rgba(232, 185, 49, 0.14)' : 'rgba(46, 229, 122, 0.12)';
    ctx.fillRect(sideX + 16, rowY - 14, 34, 22);

    ctx.fillStyle = isForward ? '#E8B931' : '#2EE57A';
    ctx.font = '800 12px monospace';
    ctx.fillText(`#${slot}`, sideX + 22, rowY + 1);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '700 12px Inter, sans-serif';
    ctx.fillText(POS_ABREVIATIONS[slot] || '', sideX + 58, rowY + 1);

    ctx.fillStyle = p ? '#ffffff' : '#64748b';
    ctx.font = p ? '700 13px Inter, sans-serif' : '500 12px Inter, sans-serif';
    const pName = p ? `${p.name}${p.apodo ? ` "${p.apodo}"` : ''}` : 'Sin asignar';
    ctx.fillText(pName.slice(0, 32), sideX + 104, rowY + 1);
  }

  // Reservas summary
  const benchAssigned = [];
  for (let slot = 16; slot <= 23; slot++) {
    const pId = lineup[slot];
    const p = teamPlayers.find(x => x.id === pId);
    if (p) benchAssigned.push(`#${slot} ${p.apodo || p.name.split(' ')[0]}`);
  }
  ctx.fillStyle = '#E8B931';
  ctx.font = '800 13px Outfit, Inter, sans-serif';
  ctx.fillText('IMPACTO / RESERVAS (16-23):', sideX + 18, sideY + 558);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 12px Inter, sans-serif';
  const benchText = benchAssigned.length > 0 ? benchAssigned.join(' · ') : 'Sin suplentes asignados';
  ctx.fillText(benchText.slice(0, 52), sideX + 18, sideY + 580);
  if (benchText.length > 52) {
    ctx.fillText(benchText.slice(52, 104), sideX + 18, sideY + 600);
  }

  // Legend
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 11px Inter, sans-serif';
  ctx.fillText('🟡 Forwards (1-8)   🟢 Backs (9-15)   🔴 Rival   🏉 Balón', sideX + 18, sideY + 688);

  // 13. Bottom TV Lower-Third Explanation Box
  const botY = 824;
  const botH = 132;
  ctx.fillStyle = '#151816';
  ctx.strokeStyle = '#2EE57A';
  ctx.lineWidth = 2;
  ctx.fillRect(pitchX, botY, W - pitchX * 2, botH);
  ctx.strokeRect(pitchX, botY, W - pitchX * 2, botH);

  const boxTitle = activePhaseInfo
    ? `📺 EXPLICACIÓN DE JUGADA — FASE ${activePhaseInfo.index + 1}/${activePhaseInfo.total}: ${activePhaseInfo.title}`
    : '📋 NOTAS TÁCTICAS Y PLAN DE JUEGO';
  const boxBody = activePhaseInfo?.description || tacticalNotes || 'Mantener estructura ofensiva, ganar la línea de ventaja y apoyar al portador del balón.';

  ctx.fillStyle = '#2EE57A';
  ctx.font = '900 15px Outfit, Inter, sans-serif';
  ctx.fillText(boxTitle, pitchX + 20, botY + 32);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 14px Inter, sans-serif';
  const words = String(boxBody).split(' ');
  let line = '';
  let lineY = botY + 62;
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    if (ctx.measureText(testLine).width > W - pitchX * 2 - 44) {
      ctx.fillText(line, pitchX + 20, lineY);
      line = words[i] + ' ';
      lineY += 22;
      if (lineY > botY + botH - 12) break;
    } else {
      line = testLine;
    }
  }
  if (line && lineY <= botY + botH - 12) {
    ctx.fillText(line, pitchX + 20, lineY);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}

/**
 * Copies the tactical pitch PNG image directly to clipboard (for pasting in WhatsApp)
 * and also downloads the PNG file as backup.
 */
export async function copyOrDownloadTacticalImage(options) {
  const blob = await generateTacticalPitchImageBlob(options);
  if (!blob) return { copied: false, downloaded: false };

  let copied = false;
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new window.ClipboardItem({ 'image/png': blob }),
      ]);
      copied = true;
    }
  } catch {
    copied = false;
  }

  // Always trigger download so mobile/desktop user also has the PNG file ready
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeTitle = String(options.title || 'Pizarra_XV').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.href = url;
  a.download = `Orcos_${safeTitle}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { copied, downloaded: true };
}

/**
 * Builds formatted WhatsApp text for the XV Titular + Suplentes + Play explanation.
 */
export function buildLineupWhatsAppText({ title = 'XV Inicial', lineup = {}, teamPlayers = [], tacticalNotes = '', activePhaseInfo = null }) {
  const lines = [
    `🏉 *RUGBY ORCOS — ${String(title).toUpperCase()}*`,
    ``,
    `⚔️ *PACK DE FORWARDS (1–8):*`,
  ];

  for (let i = 1; i <= 8; i++) {
    const p = teamPlayers.find(x => x.id === lineup[i]);
    lines.push(`${i}. *${POS_ABREVIATIONS[i]}:* ${p ? `${p.name}${p.apodo ? ` ("${p.apodo}")` : ''}` : '_Por definir_'}`);
  }

  lines.push(``, `⚡ *LÍNEA DE BACKS (9–15):*`);
  for (let i = 9; i <= 15; i++) {
    const p = teamPlayers.find(x => x.id === lineup[i]);
    lines.push(`${i}. *${POS_ABREVIATIONS[i]}:* ${p ? `${p.name}${p.apodo ? ` ("${p.apodo}")` : ''}` : '_Por definir_'}`);
  }

  const bench = [];
  for (let i = 16; i <= 23; i++) {
    const p = teamPlayers.find(x => x.id === lineup[i]);
    if (p) bench.push(`${i}. ${p.name}`);
  }
  if (bench.length > 0) {
    lines.push(``, `🛡️ *IMPACTO / SUPLENTES:*`, ...bench);
  }

  if (activePhaseInfo) {
    lines.push(``, `📺 *Jugada (${activePhaseInfo.title}):* ${activePhaseInfo.description}`);
  } else if (tacticalNotes) {
    lines.push(``, `📋 *Plan Táctico:* ${tacticalNotes}`);
  }

  return lines.join('\n');
}
