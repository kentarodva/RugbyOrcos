export function getAgeDistribution(players) {
  const buckets = { '14-17': 0, '18-22': 0, '23-27': 0, '28-32': 0, '33-40': 0, '40+': 0 };
  for (const p of players) {
    const a = p._meta?.age ?? p.age;
    if (!a) continue;
    if (a < 18) buckets['14-17']++;
    else if (a < 23) buckets['18-22']++;
    else if (a < 28) buckets['23-27']++;
    else if (a < 33) buckets['28-32']++;
    else if (a < 40) buckets['33-40']++;
    else buckets['40+']++;
  }
  return Object.entries(buckets).map(([label, value]) => ({ label, value }));
}

export function getCategoryDistribution(players) {
  const m = {};
  for (const p of players) {
    const c = (p.teamCategory || 'sin_categoria').replace('orcos_', '');
    m[c] = (m[c] || 0) + 1;
  }
  return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export function getStatusDistribution(players) {
  const m = {};
  for (const p of players) m[p.estado || 'activo'] = (m[p.estado || 'activo'] || 0) + 1;
  return Object.entries(m).map(([label, value]) => ({ label, value }));
}

export function getExperienceDistribution(players, currentYear = 2026) {
  const buckets = { '0-1 año': 0, '2-3 años': 0, '4-5 años': 0, '6-10 años': 0, '10+ años': 0 };
  for (const p of players) {
    const sy = p._meta?.startYear;
    if (!sy) continue;
    const exp = currentYear - sy;
    if (exp <= 1) buckets['0-1 año']++;
    else if (exp <= 3) buckets['2-3 años']++;
    else if (exp <= 5) buckets['4-5 años']++;
    else if (exp <= 10) buckets['6-10 años']++;
    else buckets['10+ años']++;
  }
  return Object.entries(buckets).map(([label, value]) => ({ label, value }));
}

export function getPositionDistribution(players) {
  const m = {};
  for (const p of players) {
    const pos = p.posicion || 'Sin posición';
    m[pos] = (m[pos] || 0) + 1;
  }
  return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
}

export function getAgeByPositionMatrix(players) {
  const ageKeys = ['14-17', '18-22', '23-27', '28-32', '33-40', '40+'];
  const m = {};
  for (const p of players) {
    const pos = p.posicion || 'Sin posición';
    const a = p._meta?.age ?? p.age;
    if (!a) continue;
    let range;
    if (a < 18) range = '14-17';
    else if (a < 23) range = '18-22';
    else if (a < 28) range = '23-27';
    else if (a < 33) range = '28-32';
    else if (a < 40) range = '33-40';
    else range = '40+';
    if (!m[pos]) m[pos] = {};
    m[pos][range] = (m[pos][range] || 0) + 1;
  }
  const positions = Object.keys(m).sort((a, b) => {
    const sumA = ageKeys.reduce((s, k) => s + (m[a][k] || 0), 0);
    const sumB = ageKeys.reduce((s, k) => s + (m[b][k] || 0), 0);
    return sumB - sumA;
  });
  return { rows: m, keys: ageKeys, positions };
}

export function getPhysicalAveragesByCategory(players) {
  const m = {};
  for (const p of players) {
    const c = (p.teamCategory || 'otros').replace('orcos_', '');
    if (!m[c]) m[c] = { weights: [], heights: [] };
    if (p.weight) m[c].weights.push(p.weight);
    if (p.height) m[c].heights.push(p.height);
  }
  const avg = arr => arr.length > 0 ? parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1)) : 0;
  const allW = players.map(p => p.weight).filter(Boolean);
  const allH = players.map(p => p.height).filter(Boolean);
  return {
    weightData: Object.entries(m).map(([label, d]) => ({ label, value: avg(d.weights), count: d.weights.length })).filter(d => d.value > 0),
    heightData: Object.entries(m).map(([label, d]) => ({ label, value: avg(d.heights), count: d.heights.length })).filter(d => d.value > 0),
    overallW: avg(allW), overallH: avg(allH), nW: allW.length, nH: allH.length,
  };
}

export function getPhysicalByPosition(players) {
  const m = {};
  for (const p of players) {
    const pos = p.posicion || 'Sin posición';
    if (!m[pos]) m[pos] = { weights: [], heights: [], count: 0 };
    if (p.weight) m[pos].weights.push(p.weight);
    if (p.height) m[pos].heights.push(p.height);
    m[pos].count++;
  }
  const avg = arr => arr.length > 0 ? parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1)) : '-';
  return Object.entries(m)
    .map(([label, d]) => ({ label, weight: avg(d.weights), height: avg(d.heights), n: d.count }))
    .filter(d => d.n >= 2)
    .sort((a, b) => b.n - a.n);
}

export function getIMCByCategory(players) {
  const m = {};
  for (const p of players) {
    if (!p.weight || !p.height) continue;
    const c = (p.teamCategory || 'otros').replace('orcos_', '');
    const bmi = p.weight / (p.height * p.height);
    if (!m[c]) m[c] = [];
    m[c].push(bmi);
  }
  const avg = arr => arr.length > 0 ? parseFloat((arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1)) : 0;
  return Object.entries(m).map(([label, d]) => ({ label, value: avg(d), count: d.length })).filter(d => d.value > 0);
}

export function getWeightBuckets(players) {
  const b = { '<60kg': 0, '60-70kg': 0, '70-80kg': 0, '80-90kg': 0, '90-100kg': 0, '100+kg': 0 };
  for (const p of players) {
    const w = p.weight;
    if (!w) continue;
    if (w < 60) b['<60kg']++;
    else if (w < 70) b['60-70kg']++;
    else if (w < 80) b['70-80kg']++;
    else if (w < 90) b['80-90kg']++;
    else if (w < 100) b['90-100kg']++;
    else b['100+kg']++;
  }
  return Object.entries(b).map(([label, value]) => ({ label, value }));
}

export function getHeightBuckets(players) {
  const b = { '<1.60m': 0, '1.60-1.70m': 0, '1.70-1.80m': 0, '1.80-1.90m': 0, '1.90+m': 0 };
  for (const p of players) {
    const h = p.height;
    if (!h) continue;
    if (h < 1.6) b['<1.60m']++;
    else if (h < 1.7) b['1.60-1.70m']++;
    else if (h < 1.8) b['1.70-1.80m']++;
    else if (h < 1.9) b['1.80-1.90m']++;
    else b['1.90+m']++;
  }
  return Object.entries(b).map(([label, value]) => ({ label, value }));
}

export function getIMCClassification(players) {
  const buckets = { 'Bajo peso (<18.5)': 0, Normal: 0, Sobrepeso: 0, Obesidad: 0 };
  let total = 0;
  for (const p of players) {
    if (!p.weight || !p.height) continue;
    total++;
    const bmi = p.weight / (p.height * p.height);
    if (bmi < 18.5) buckets['Bajo peso (<18.5)']++;
    else if (bmi < 25) buckets.Normal++;
    else if (bmi < 30) buckets.Sobrepeso++;
    else buckets.Obesidad++;
  }
  return Object.entries(buckets).map(([label, value]) => ({ label, value, pct: total > 0 ? Math.round((value / total) * 100) : 0 }));
}

export function getHealthSummary(players) {
  return {
    total: players.length,
    withF: players.filter(p => p.had_fractures).length,
    withA: players.filter(p => p.allergies).length,
    withC: players.filter(p => p.medical_conditions).length,
  };
}

export function getFracturesByCategory(players) {
  const m = {};
  for (const p of players) {
    const c = (p.teamCategory || 'otros').replace('orcos_', '');
    if (!m[c]) m[c] = { total: 0, fractures: 0 };
    m[c].total++;
    if (p.had_fractures) m[c].fractures++;
  }
  return Object.entries(m).filter(([, d]) => d.total > 0).map(([label, d]) => ({ label, value: d.fractures, pct: Math.round((d.fractures / d.total) * 100), total: d.total }));
}

export function getDataCoverage(players) {
  const t = players.length;
  return [
    { label: 'Teléfono', count: players.filter(p => !!p.contacto?.phone).length, total: t },
    { label: 'Contacto emergencia', count: players.filter(p => !!p.emergency_contact_name || !!p.emergency_contact_phone).length, total: t },
    { label: 'Peso', count: players.filter(p => !!p.weight).length, total: t },
    { label: 'Altura', count: players.filter(p => !!p.height).length, total: t },
    { label: 'EPS', count: players.filter(p => !!p.health_insurance).length, total: t },
  ];
}

export function getEPSDistribution(players) {
  const m = {};
  for (const p of players) {
    const eps = p.health_insurance || 'Sin EPS';
    m[eps] = (m[eps] || 0) + 1;
  }
  return Object.entries(m).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
}

export function getUpcomingBirthdays(players, limit = 5) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return players.filter(p => p.birth_date).map(p => {
    const bd = new Date(p.birth_date + 'T00:00:00');
    const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    if (next < today) next.setFullYear(next.getFullYear() + 1);
    const days = Math.round((next - today) / (1000 * 60 * 60 * 24));
    const age = (p._meta?.age ?? 0) + (days === 0 ? 0 : 1);
    return { ...p, nextBD: next, days, nextAge: age };
  }).sort((a, b) => a.days - b.days).slice(0, limit);
}
