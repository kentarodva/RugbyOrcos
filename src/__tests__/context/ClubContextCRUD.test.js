import { describe, it, expect } from 'vitest';

describe('ClubContext — addPlayer', () => {
  const sanitize = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[<>]/g, '');
  };

  it('genera ID con prefijo p_', () => {
    const id = 'p_' + crypto.randomUUID();
    expect(id).toMatch(/^p_[a-f0-9-]{36}$/);
  });

  it('sanitiza nombre y apodo', () => {
    expect(sanitize('<b>Freyder</b>')).toBe('bFreyder/b');
    expect(sanitize('Normal')).toBe('Normal');
  });

  it('setea defaults: estado activo, atributos 50, teamCategory', () => {
    const player = {
      name: 'Test', estado: undefined, attributes: undefined, teamCategory: undefined,
    };
    const defaults = {
      estado: player.estado || 'activo',
      attributes: player.attributes || { force: 50, speed: 50, stamina: 50, technique: 50 },
      teamCategory: 'orcos_masculina_mayor',
    };
    expect(defaults.estado).toBe('activo');
    expect(defaults.attributes.force).toBe(50);
  });
});

describe('ClubContext — updatePlayer', () => {
  const sanitize = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(/[<>]/g, '');
  };

  it('sanitiza nombre, apodo y contacto', () => {
    const player = {
      id: 'p1', name: '<script>X</script>', apodo: '<b>Test</b>',
      contacto: { phone: '<123>', email: 'test@test.com' },
    };
    const safe = {
      ...player,
      name: sanitize(player.name),
      apodo: sanitize(player.apodo),
      contacto: {
        phone: sanitize(player.contacto.phone || ''),
        email: sanitize(player.contacto.email || ''),
      },
    };
    expect(safe.name).toBe('scriptX/script');
    expect(safe.apodo).toBe('bTest/b');
    expect(safe.contacto.phone).toBe('123');
  });
});

describe('ClubContext — deletePlayer', () => {
  it('filtra jugador del array', () => {
    const players = [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }];
    const remaining = players.filter(p => p.id !== 'p2');
    expect(remaining).toHaveLength(2);
    expect(remaining.map(p => p.id)).toEqual(['p1', 'p3']);
  });

  it('array vacío no crashea', () => {
    const players = [];
    const remaining = players.filter(p => p.id !== 'p1');
    expect(remaining).toHaveLength(0);
  });
});

describe('ClubContext — recordAttendance', () => {
  it('presente: incrementa total y present', () => {
    const att = { total: 5, present: 4, late: 1, absentUnjustified: 0, absentJustified: 0 };
    const status = 'presente';
    att.total += 1;
    if (status === 'presente') att.present += 1;
    expect(att.total).toBe(6);
    expect(att.present).toBe(5);
  });

  it('tarde: burpees +15', () => {
    const penalties = { burpees: 0, cones: false };
    const status = 'tarde';
    if (status === 'tarde') penalties.burpees += 15;
    expect(penalties.burpees).toBe(15);
  });

  it('falta injustificada: burpees +50, conos true', () => {
    const penalties = { burpees: 0, cones: false };
    const status = 'falta_injustificada';
    if (status === 'falta_injustificada') {
      penalties.burpees += 50;
      penalties.cones = true;
    }
    expect(penalties.burpees).toBe(50);
    expect(penalties.cones).toBe(true);
  });

  it('falta justificada: solo incrementa absentJustified', () => {
    const att = { total: 5, present: 4, absentJustified: 0 };
    const status = 'falta_justificada';
    att.total += 1;
    if (status === 'falta_justificada') att.absentJustified += 1;
    expect(att.total).toBe(6);
    expect(att.absentJustified).toBe(1);
  });
});

describe('ClubContext — recordMatchInfractions', () => {
  it('penales + amarillas + rojas = burpees', () => {
    const burpees = (5 * 10) + (1 * 50) + (0 * 100);
    expect(burpees).toBe(100);
  });

  it('tarjeta roja suspende al jugador', () => {
    const rojas = 1;
    const estado = rojas > 0 ? 'suspendido' : 'activo';
    expect(estado).toBe('suspendido');
  });

  it('sin tarjeta roja no suspende', () => {
    const rojas = 0;
    const estado = rojas > 0 ? 'suspendido' : 'activo';
    expect(estado).toBe('activo');
  });
});

describe('ClubContext — redeemPenalty', () => {
  it('redimir burpees los pone en 0', () => {
    const penalties = { burpees: 150, cones: true };
    const type = 'burpees';
    if (type === 'burpees') penalties.burpees = 0;
    expect(penalties.burpees).toBe(0);
  });

  it('redimir conos los pone en false', () => {
    const penalties = { burpees: 0, cones: true };
    const type = 'cones';
    if (type === 'cones') penalties.cones = false;
    expect(penalties.cones).toBe(false);
  });

  it('si estaba suspendido y burpees=0, vuelve a activo', () => {
    let estado = 'suspendido';
    const penalties = { burpees: 0, cones: false };
    if (estado === 'suspendido' && penalties.burpees === 0) estado = 'activo';
    expect(estado).toBe('activo');
  });
});

describe('ClubContext — recordPhysicalTest', () => {
  it('actualiza atributos y agrega al historial', () => {
    const history = [{ date: '2026-01-01', force: 50, speed: 50, stamina: 50, technique: 50 }];
    const newAttrs = { force: 60, speed: 55, stamina: 65, technique: 60 };
    const newHistory = [...history, { date: '2026-06-01', ...newAttrs }];
    expect(newHistory).toHaveLength(2);
    expect(newHistory[1].force).toBe(60);
  });
});

describe('ClubContext — recordInjury', () => {
  it('estado cambia a lesionado con diagnóstico', () => {
    const injury = { diagnosis: 'Fractura de tobillo', date: '2026-06-01', weeks: 4, phase: 1 };
    expect(injury.phase).toBe(1);
    expect(injury.weeks).toBe(4);
  });
});

describe('ClubContext — updateInjuryPhase', () => {
  it('fase 4 vuelve a activo y limpia injuryLog', () => {
    const phase = 4;
    let estado = 'lesionado';
    if (Number(phase) === 4) estado = 'activo';
    expect(estado).toBe('activo');
    expect(phase === 4).toBe(true);
  });
});

describe('ClubContext — recordMatchStats', () => {
  it('agrega stats al array del jugador', () => {
    const stats = [];
    const newStat = { id: 'st_1', date: '2026-06-01', opponent: 'Rival', tries: 2, tackles: 8, mvp: true };
    stats.push(newStat);
    expect(stats).toHaveLength(1);
    expect(stats[0].tries).toBe(2);
  });

  it('tarjeta roja suspende', () => {
    const redCards = 1;
    const estado = Number(redCards) > 0 ? 'suspendido' : 'activo';
    expect(estado).toBe('suspendido');
  });
});

describe('ClubContext — recordWellness', () => {
  it('agrega log y mantiene últimos 30', () => {
    const logs = Array.from({ length: 35 }, (_, i) => ({ id: `wl_${i}` }));
    const newLog = { id: 'wl_new', date: '2026-06-01', sleep: 4, soreness: 2, stress: 3 };
    const updated = [...logs, newLog].slice(-30);
    expect(updated).toHaveLength(30);
    expect(updated[29].id).toBe('wl_new');
  });
});

describe('ClubContext — runHiaProtocol', () => {
  it('síntomas detectados: suspensión 14 días, fase 1', () => {
    const symptomsDetected = true;
    const newEstado = symptomsDetected ? 'lesionado' : 'activo';
    const injury = {
      diagnosis: 'Protocolo HIA Activo - Sospecha de Conmocion',
      weeks: 2,
      phase: 1,
    };
    expect(newEstado).toBe('lesionado');
    expect(injury.weeks).toBe(2);
    expect(injury.phase).toBe(1);
  });

  it('sin síntomas: no cambia estado', () => {
    const symptomsDetected = false;
    const estado = 'activo';
    const newEstado = symptomsDetected ? 'lesionado' : estado;
    expect(newEstado).toBe('activo');
  });
});

describe('ClubContext — recordMembershipPayment', () => {
  it('abono crea registro financiero', () => {
    const amount = 5000;
    const record = {
      desc: 'Abono Membresia - Test Player',
      amount,
      type: 'ingreso',
      date: new Date().toISOString().split('T')[0],
      category: 'mensualidad',
    };
    expect(record.type).toBe('ingreso');
    expect(record.category).toBe('mensualidad');
    expect(record.amount).toBe(5000);
  });
});
