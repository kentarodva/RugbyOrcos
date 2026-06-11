const CATEGORY_MAP = {
  'masculino mayores': 'orcos_masculina_mayor',
  'femenino mayores': 'orcos_femenina_mayor',
  'juvenil masculino': 'orcos_juveniles_masculina',
  'juvenil femenino': 'orcos_juveniles_femenina',
};

const EPS_MAP = {
  'mutual ser': 'Mutual Ser',
  'mutualser': 'Mutual Ser',
  'mutual': 'Mutual Ser',
  'salud total': 'Salud Total',
  'nueva eps': 'Nueva EPS',
  'familiar de colombia': 'Familiar de Colombia',
  'familiar colombia': 'Familiar de Colombia',
  'familiar': 'Familiar de Colombia',
  'co familiar de colombia': 'Familiar de Colombia',
  'eps familiar colombia': 'Familiar de Colombia',
  'coosalud': 'Coosalud',
  'cosalud': 'Coosalud',
  'caja copi': 'Cajacopi',
  'caja copis': 'Cajacopi',
  'cajacopi': 'Cajacopi',
  'sanitas': 'Sanitas',
  'fomag': 'FOMAG',
};

const DOC_TYPE_MAP = {
  'cédula de ciudadanía': 'CC',
  'cedula de ciudadania': 'CC',
  'tarjeta de identidad': 'TI',
  'otro': 'OTRO',
};

const ROL_MAP = {
  'titular': 'Titular',
  'suplente': 'Suplente',
  'entrenador': 'Entrenador',
  'capitan': 'Capitan',
  'subcapitan': 'Subcapitan',
};

export function normalizeCategory(raw) {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return CATEGORY_MAP[key] || null;
}

export function normalizeDocType(raw) {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return DOC_TYPE_MAP[key] || raw.trim();
}

export function normalizeEPS(raw) {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return EPS_MAP[key] || raw.trim();
}

export function parseDate(raw) {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/"/g, '');
  const parts = cleaned.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const year = y.length === 2 ? 2000 + parseInt(y) : parseInt(y);
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

export function parseNumber(raw) {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/["']/g, '').replace(/,/g, '.').toLowerCase();
  const num = parseFloat(cleaned.replace(/kg|m|cm|kgs?/g, '').trim());
  return isNaN(num) ? null : num;
}

export function parseBool(raw) {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === 'sí' || v === 'si' || v === 'yes' || v === 'true') return true;
  if (v === 'no' || v === 'false') return false;
  return null;
}

export function parseAge(raw) {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase().replace('años', '').replace('año', '').replace('a\xf1os', '').trim();
  const num = parseInt(cleaned);
  return isNaN(num) ? null : num;
}

export function parseStartYear(raw) {
  if (!raw) return null;
  const cleaned = raw.trim().toLowerCase();
  const num = parseInt(cleaned);
  if (!isNaN(num) && num >= 2000 && num <= 2030) return num;
  const dateMatch = cleaned.match(/(\d{4})/);
  if (dateMatch) {
    const y = parseInt(dateMatch[1]);
    if (y >= 2000 && y <= 2030) return y;
  }
  return null;
}

export function normalizeRol(raw) {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/^[^a-záéíóúñü]*/, '');
  return ROL_MAP[key] || null;
}

export function cleanPhone(raw) {
  if (!raw) return null;
    return raw.trim().replace(/[\s()+-]/g, '');
}

export function parseCSVRow(row, makgoraTeams) {
  let [, , firstName, lastName, docType, docNum, birthDate, age, phone, nickname,
    initCat, startYear, currentCat, internalTeam, weight, height, hadFracture, fractureDetail,
    allergies, diseases, eps, contactName, contactPhone] = row;

  const documentNumber = docNum ? docNum.trim().replace(/["'.\s]/g, '') : null;
  if (!documentNumber || !firstName || !lastName) return { _skip: 'datos_incompletos', _name: `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim() || 'Desconocido' };

  const teamCategory = normalizeCategory(currentCat);
  if (!teamCategory) return { _skip: 'sin_categoria', _name: `${(firstName || '').trim()} ${(lastName || '').trim()}`.trim() };

  if (contactName && contactPhone) {
    const cleanForCheck = (v) => v.trim().replace(/[\s()+-]/g, '');
    const nameLooksPhone = /^\d{7,15}$/.test(cleanForCheck(contactName));
    const phoneLooksName = /[a-zA-ZáéíóúñüÁÉÍÓÚÑ]{3,}/.test(contactPhone);
    if (nameLooksPhone && phoneLooksName) {
      const tmp = contactName; contactName = contactPhone; contactPhone = tmp;
    }
  }

  let makgoraTeamId = null;
  if (internalTeam && makgoraTeams?.length > 0) {
    const rawName = internalTeam.trim().toLowerCase();
    const found = makgoraTeams.find(t =>
      t.name.toLowerCase() === rawName ||
      (t.rpg_name && t.rpg_name.toLowerCase().startsWith(rawName))
    );
    if (found) makgoraTeamId = found.id;
  }

  return {
    id: crypto.randomUUID(),
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    nickname: nickname ? nickname.trim() : null,
    document_type: normalizeDocType(docType),
    document_number: documentNumber,
    birth_date: parseDate(birthDate),
    age: parseAge(age),
    phone: cleanPhone(phone),
    team_category: teamCategory,
    initial_category: normalizeCategory(initCat),
    start_year: parseStartYear(startYear),
    internal_team: internalTeam ? internalTeam.trim() : null,
    makgora_team_id: makgoraTeamId,
    weight_kg: parseNumber(weight),
    height_m: (() => { const h = parseNumber(height); return h != null && h > 3 ? h / 100 : h })(),
    had_fractures: parseBool(hadFracture) || false,
    fracture_details: fractureDetail ? fractureDetail.trim() : null,
    allergies: allergies && !['no', '-', ''].includes(allergies.trim().toLowerCase()) ? allergies.trim() : null,
    medical_conditions: diseases && !['no', '-', ''].includes(diseases.trim().toLowerCase()) ? diseases.trim() : null,
    health_insurance: normalizeEPS(eps),
    emergency_contact_name: contactName ? contactName.trim() : null,
    emergency_contact_phone: contactPhone ? cleanPhone(contactPhone) : null,
    commitment_accepted: true,
    source: 'csv_import',
    status: 'activo',
    attr_force: 50,
    attr_speed: 50,
    attr_stamina: 50,
    attr_technique: 50,
  };
}

export function parseCSV(text, makgoraTeams) {
  const rawLines = text.split(/\r?\n/);
  const joinedLines = [];
  let current = '';
  let inQuotes = false;
  for (const line of rawLines) {
    const quoteCount = (line.match(/"/g) || []).length;
    current = current ? current + '\n' + line : line;
    if (quoteCount % 2 === 1) inQuotes = !inQuotes;
    if (!inQuotes) { joinedLines.push(current); current = ''; }
  }
  if (current) joinedLines.push(current);

  const nonEmpty = joinedLines.filter(l => l.trim());
  if (nonEmpty.length < 2) return [];

  const rows = nonEmpty.slice(1).map(line => {
    const cols = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQ = !inQ;
      } else if (ch === ',' && !inQ) {
        cols.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    return cols;
  });

  const seenDoc = new Set();
  const seenNameBirth = new Set();
  const players = [];
  const skipped = [];

  for (const row of rows) {
    const result = parseCSVRow(row, makgoraTeams);
    if (!result || result._skip) {
      if (result?._skip) {
        skipped.push({ name: result._name || 'Desconocido', reason: result._skip });
      } else {
        skipped.push({ name: 'Fila inválida', reason: 'datos_incompletos' });
      }
      continue;
    }
    const docKey = `${result.document_type}_${result.document_number}`;
    if (seenDoc.has(docKey)) {
      skipped.push({ name: `${result.first_name} ${result.last_name}`, reason: 'duplicado_documento' });
      continue;
    }
    seenDoc.add(docKey);
    const nameKey = `${result.first_name}|${result.last_name}|${result.birth_date}`;
    if (seenNameBirth.has(nameKey)) {
      skipped.push({ name: `${result.first_name} ${result.last_name}`, reason: 'duplicado_nombre' });
      continue;
    }
    seenNameBirth.add(nameKey);
    players.push(result);
  }

  return { players, skipped };
}
