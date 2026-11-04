import { formatCOP as formatCop } from './inputFormatters';

/**
 * Normalizes a Colombian phone number for wa.me links.
 * Returns e.g. '573001234567' or '' if invalid/empty.
 */
export function normalizeColombianPhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('57') && digits.length >= 12) return digits.slice(0, 12);
  if (digits.length === 10 && digits.startsWith('3')) return `57${digits}`;
  return digits;
}

/**
 * Builds a wa.me URL with pre-filled message.
 * If the player doesn't have a phone number, opens wa.me/?text=... so the user can pick a contact.
 */
export function buildWhatsAppUrl(phone, message) {
  const cleanPhone = normalizeColombianPhone(phone);
  const encoded = encodeURIComponent(message || '');
  return cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
}

/**
 * Builds a friendly payment reminder message for a player.
 */
export function buildDebtReminderText({ playerName, concept, amountDue, amountPaid, deadline }) {
  const due = Number(amountDue || 0);
  const paid = Number(amountPaid || 0);
  const remaining = Math.max(0, due - paid);
  const lines = [
    `🏉 *RUGBY ORCOS — Recordatorio de Tesorería*`,
    `Hola *${playerName || 'Guerrero'}*, te compartimos el estado de tu compromiso en el club:`,
    ``,
    `📌 *Concepto:* ${concept || 'Cuota del Club'}`,
    `💰 *Total asignado:* ${formatCop(due)}`,
    `✅ *Abonado:* ${formatCop(paid)}`,
    `⏳ *Saldo pendiente:* ${formatCop(remaining)}`,
  ];
  if (deadline) {
    lines.push(`📅 *Fecha límite:* ${deadline}`);
  }
  lines.push(``, `¡Gracias por apoyar a la Horda! 💚⚔️`);
  return lines.join('\n');
}

/**
 * Builds a payment receipt text for WhatsApp.
 */
export function buildPaymentReceiptText({ playerName, concept, amountPaidNow, totalPaid, totalDue, notes }) {
  const paidNow = Number(amountPaidNow || 0);
  const accumulated = Number(totalPaid || 0);
  const due = Number(totalDue || 0);
  const remaining = Math.max(0, due - accumulated);
  const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

  const lines = [
    `🧾 *COMPROBANTE DE ABONO — RUGBY ORCOS*`,
    `📅 Fecha: ${today}`,
    `👤 Guerrero: *${playerName || 'Jugador'}*`,
    `📌 Concepto: *${concept || 'Recaudación'}*`,
    ``,
    `💵 *Abono registrado:* ${formatCop(paidNow)}`,
    `📊 *Total abonado:* ${formatCop(accumulated)} / ${formatCop(due)}`,
    remaining === 0
      ? `🏆 *Estado:* ¡PAZ Y SALVO COMPLETO! ✅`
      : `⏳ *Saldo restante:* ${formatCop(remaining)}`,
  ];
  if (notes) {
    lines.push(`📝 Nota: ${notes}`);
  }
  lines.push(``, `¡Gracias por tu compromiso con Rugby Orcos! 🏉💚`);
  return lines.join('\n');
}

/**
 * Builds a full campaign status summary formatted for the Club's WhatsApp Group.
 */
export function buildCampaignGroupSummaryText({ campaign, assignments = [], playerMap = {} }) {
  const totalDue = assignments.reduce((s, a) => s + Number(a.amount_due || 0), 0);
  const totalPaid = assignments.reduce((s, a) => s + Number(a.amount_paid || 0), 0);
  const pct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  const completed = [];
  const partial = [];
  const pending = [];

  assignments.forEach(a => {
    const p = playerMap[a.player_id];
    const name = p?.name || 'Guerrero';
    const paid = Number(a.amount_paid || 0);
    const due = Number(a.amount_due || 0);
    const rem = Math.max(0, due - paid);

    if (paid >= due && due > 0) {
      completed.push(`✅ ${name}`);
    } else if (paid > 0) {
      partial.push(`🟡 ${name} (Abonó ${formatCop(paid)} · Falta ${formatCop(rem)})`);
    } else {
      pending.push(`⏳ ${name} (Pendiente ${formatCop(rem)})`);
    }
  });

  const lines = [
    `📢 *REPORTE DE CAMPAÑA — ${String(campaign.name || '').toUpperCase()}*`,
    `💰 *Recaudado:* ${formatCop(totalPaid)} de ${formatCop(totalDue)} (${pct}%)`,
  ];
  if (campaign.deadline) {
    lines.push(`📅 *Fecha límite:* ${campaign.deadline}`);
  }
  lines.push(``);

  if (completed.length > 0) {
    lines.push(`*AL DÍA (${completed.length}):*`);
    lines.push(...completed);
    lines.push(``);
  }
  if (partial.length > 0) {
    lines.push(`*ABONO PARCIAL (${partial.length}):*`);
    lines.push(...partial);
    lines.push(``);
  }
  if (pending.length > 0) {
    lines.push(`*PENDIENTES (${pending.length}):*`);
    lines.push(...pending);
    lines.push(``);
  }

  lines.push(`🏉 _Generado desde Rugby Orcos Club Manager_`);
  return lines.join('\n');
}

/**
 * Builds a WhatsApp Group Call-Up / Availability list for an upcoming match.
 */
export function buildMatchAvailabilitySummaryText({ future, teamPlayers = [] }) {
  const availMap = future.availabilities || {};
  const going = teamPlayers.filter(p => availMap[p.id] === 'going');
  const maybe = teamPlayers.filter(p => availMap[p.id] === 'maybe');
  const notGoing = teamPlayers.filter(p => availMap[p.id] === 'not_going');
  const unconfirmed = teamPlayers.filter(p => !availMap[p.id] || availMap[p.id] === 'pending');

  const lines = [
    `🏉 *CONVOCATORIA OFICIAL — ORCOS VS ${String(future.opponent || 'RIVAL').toUpperCase()}*`,
    `📅 *Fecha:* ${future.date || 'Por definir'}`,
    `⏰ *Hora:* ${future.time || 'Por definir'}`,
    `📍 *Lugar:* ${future.location || 'Por definir'}`,
    ``,
    `🟢 *CONFIRMADOS (${going.length}):*`,
    ...(going.length > 0
      ? going.map((p, idx) => `${idx + 1}. ${p.name}${p.posicion ? ` (${p.posicion})` : ''}`)
      : ['_Ninguno aún_']),
    ``,
  ];

  if (maybe.length > 0) {
    lines.push(`🟡 *EN DUDA (${maybe.length}):*`);
    lines.push(...maybe.map(p => `• ${p.name}`));
    lines.push(``);
  }

  if (notGoing.length > 0) {
    lines.push(`🔴 *BAJAS (${notGoing.length}):*`);
    lines.push(...notGoing.map(p => `• ${p.name}`));
    lines.push(``);
  }

  if (unconfirmed.length > 0) {
    lines.push(`⚪ *FALTA POR CONFIRMAR (${unconfirmed.length}):*`);
    lines.push(unconfirmed.map(p => p.name).join(', '));
    lines.push(``);
  }

  lines.push(`⚔️ _Confirma tu asistencia en la App de Rugby Orcos_`);
  return lines.join('\n');
}

/**
 * Exports a CSV (Excel-compatible UTF-8 with BOM) for Uniform Manufacturing Orders.
 */
export function exportUniformOrderCSV({ campaign, assignments = [], playerMap = {} }) {
  const escapeCsv = (val) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    'Dorsal',
    'Jugador',
    'Apodo',
    'Posicion',
    'Talla Camiseta',
    'Talla Pantaloneta',
    'Talla Medias',
    'Abonado (COP)',
    'Valor Kit (COP)',
    'Saldo Pendiente (COP)',
    'Estado Pago',
    'Estado Entrega',
  ];

  const deliveryLabels = {
    pending: 'Por pedir',
    ordered: 'En confeccion',
    delivered: 'Entregado',
  };

  const rows = assignments.map(a => {
    const p = playerMap[a.player_id] || {};
    const cloth = p.clothingSizes || p.clothing || {};
    const paid = Number(a.amount_paid || 0);
    const due = Number(a.amount_due || 0);
    const rem = Math.max(0, due - paid);
    const payStatus = paid >= due && due > 0 ? 'Pagado' : paid > 0 ? 'Abono Parcial' : 'Pendiente';
    const delStatus = deliveryLabels[a.delivery_status || 'pending'] || 'Por pedir';

    return [
      p.camiseta ?? '',
      p.name || '—',
      p.apodo || '',
      p.posicion || '',
      cloth.jersey || 'Sin talla',
      cloth.shorts || 'Sin talla',
      cloth.socks || 'Sin talla',
      paid,
      due,
      rem,
      payStatus,
      delStatus,
    ].map(escapeCsv).join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = String(campaign.name || 'Uniformes').replace(/[^a-zA-Z0-9_-]/g, '_');
  link.href = url;
  link.setAttribute('download', `Orden_Confeccion_${safeName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
