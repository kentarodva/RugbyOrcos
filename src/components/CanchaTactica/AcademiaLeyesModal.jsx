import React, { useState } from 'react';
import { BookOpen, HelpCircle, Award, X, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
import { RUGBY_LAWS_LESSONS, WORLD_RUGBY_CERTIFICATIONS, ACADEMY_QUIZ_QUESTIONS } from '../../data/rugbyLawsAcademy';
import {
  OrcosRugbyBallIcon,
  OrcosTackleShieldIcon,
  OrcosBattleAxeHPostsIcon,
  OrcosWhistleIcon,
  OrcosCardIcon
} from '../common/OrcosIcons';
import { useToast } from '../../context/ToastContext';
import { vibrateSuccess } from '../../utils/haptics';

export function AcademiaLeyesModal({ onClose, onAwardXp }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('leyes'); // 'leyes' | 'quiz' | 'certificados'
  const [selectedLesson, setSelectedLesson] = useState(RUGBY_LAWS_LESSONS[0]);

  // Quiz state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  const handleSelectOption = (idx) => {
    if (showAnswerFeedback) return;
    setSelectedAnswer(idx);
    setShowAnswerFeedback(true);
    const q = ACADEMY_QUIZ_QUESTIONS[currentQIndex];
    if (idx === q.correctIndex) {
      setScore(s => s + 1);
      vibrateSuccess();
    }
  };

  const handleNextQuestion = () => {
    if (currentQIndex + 1 < ACADEMY_QUIZ_QUESTIONS.length) {
      setCurrentQIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowAnswerFeedback(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQIndex(0);
    setSelectedAnswer(null);
    setShowAnswerFeedback(false);
    setScore(0);
    setQuizFinished(false);
  };

  const handleClaimXp = () => {
    if (xpAwarded) return;
    if (onAwardXp) {
      onAwardXp(100);
    }
    setXpAwarded(true);
    vibrateSuccess();
    showToast('¡Has ganado +100 XP de Honor Makgora por aprobar el examen de Leyes!', 'success');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1050 }}>
      <div
        className="modal-content glass-panel animated-slide"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '820px', width: '95%', maxHeight: '92vh', overflowY: 'auto', padding: '24px' }}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid rgba(46, 229, 122,0.2)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(46, 229, 122, 0.15)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(46, 229, 122,0.3)' }}>
              <OrcosBattleAxeHPostsIcon size={28} color="#2EE57A" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#ffffff' }}>
                Academia de Rugby & Leyes FCR
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                World Rugby Passport · Corozal, Sucre & Federación Colombiana de Rugby
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Pestañas de Navegación */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('leyes')}
            className={activeTab === 'leyes' ? 'btn-neon' : 'btn-outline'}
            style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <BookOpen size={15} />
            <span>📖 Leyes & Faltas Didácticas</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={activeTab === 'quiz' ? 'btn-neon' : 'btn-outline'}
            style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <HelpCircle size={15} />
            <span>📝 Examen de Leyes (+100 XP)</span>
          </button>

          <button
            onClick={() => setActiveTab('certificados')}
            className={activeTab === 'certificados' ? 'btn-neon' : 'btn-outline'}
            style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Award size={15} />
            <span>📜 Certificaciones World Rugby</span>
          </button>
        </div>

        {/* 1. PESTAÑA: LEYES & FALTAS DIDÁCTICAS */}
        {activeTab === 'leyes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            {/* Lista lateral de lecciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Faltas e Infracciones Clave:
              </span>
              {RUGBY_LAWS_LESSONS.map(lesson => {
                const isSelected = selectedLesson.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(46, 229, 122, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #2EE57A' : '1px solid rgba(255, 255, 255, 0.07)',
                      color: isSelected ? '#2EE57A' : '#e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? 800 : 600,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>{lesson.lawNumber} - {lesson.title.split('(')[0]}</span>
                    <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: `${lesson.color}25`, color: lesson.color, border: `1px solid ${lesson.color}50` }}>
                      {lesson.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Detalle didáctico de la lección seleccionada */}
            <div style={{ background: 'rgba(20, 23, 21, 0.8)', border: '1px solid rgba(46, 229, 122, 0.3)', borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: selectedLesson.color, background: `${selectedLesson.color}20`, padding: '3px 8px', borderRadius: '6px', border: `1px solid ${selectedLesson.color}40` }}>
                    {selectedLesson.lawNumber} · {selectedLesson.severity}
                  </span>
                  <h4 style={{ margin: '8px 0 0 0', fontSize: '1.15rem', fontWeight: 900, color: '#ffffff' }}>
                    {selectedLesson.title}
                  </h4>
                </div>
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  {selectedLesson.id === 'tackle_alto' && <OrcosCardIcon type="red" size={28} />}
                  {selectedLesson.id === 'scrum_colapso' && <OrcosTackleShieldIcon size={28} color="#ff9100" />}
                  {selectedLesson.id === 'offside_ruck' && <OrcosWhistleIcon size={28} color="#E8B931" />}
                  {selectedLesson.id === 'knock_on' && <OrcosRugbyBallIcon size={28} color="#38bdf8" />}
                  {selectedLesson.id === 'not_releasing' && <OrcosTackleShieldIcon size={28} color="#2EE57A" />}
                  {selectedLesson.id === 'crossing_pantalla' && <OrcosWhistleIcon size={28} color="#a855f7" />}
                </div>
              </div>

              {/* Infracción */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF5C4D', fontSize: '0.85rem', fontWeight: 800, marginBottom: '4px' }}>
                  <AlertTriangle size={15} />
                  <span>¿Cómo se comete la Infracción?</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {selectedLesson.infractionDesc}
                </p>
                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#E8B931', fontWeight: 700 }}>
                  ⚖️ Sanción Reglamentaria: {selectedLesson.sanction}
                </div>
              </div>

              {/* Técnica Correcta */}
              <div style={{ background: 'rgba(46, 229, 122, 0.08)', border: '1px solid rgba(46, 229, 122, 0.25)', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2EE57A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '4px' }}>
                  <CheckCircle2 size={15} />
                  <span>{selectedLesson.correctTechniqueTitle}</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {selectedLesson.correctTechnique}
                </p>
              </div>

              {/* Nota Regional Sucre / FCR */}
              <div style={{ background: 'rgba(56, 189, 248, 0.06)', borderLeft: '3px solid #38bdf8', padding: '8px 12px', borderRadius: '4px' }}>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  📌 Nota Caribe & FCR: {selectedLesson.fcrNote}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2. PESTAÑA: EXAMEN DE LEYES (QUIZ INTERACTIVO) */}
        {activeTab === 'quiz' && (
          <div style={{ background: 'rgba(20, 23, 21, 0.8)', border: '1px solid rgba(255, 215, 64, 0.3)', borderRadius: '14px', padding: '24px' }}>
            {!quizFinished ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-gold)' }}>
                    Pregunta {currentQIndex + 1} de {ACADEMY_QUIZ_QUESTIONS.length}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    Aciertos: {score}
                  </span>
                </div>

                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '18px', lineHeight: 1.4 }}>
                  {ACADEMY_QUIZ_QUESTIONS[currentQIndex].question}
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                  {ACADEMY_QUIZ_QUESTIONS[currentQIndex].options.map((opt, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === ACADEMY_QUIZ_QUESTIONS[currentQIndex].correctIndex;
                    let bg = 'rgba(255, 255, 255, 0.04)';
                    let border = '1px solid rgba(255, 255, 255, 0.08)';
                    let textCol = '#e2e8f0';

                    if (showAnswerFeedback) {
                      if (isCorrect) {
                        bg = 'rgba(46, 229, 122, 0.2)';
                        border = '1px solid #2EE57A';
                        textCol = '#2EE57A';
                      } else if (isSelected) {
                        bg = 'rgba(255, 92, 77, 0.2)';
                        border = '1px solid #FF5C4D';
                        textCol = '#FF5C4D';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          background: bg,
                          border,
                          color: textCol,
                          cursor: showAnswerFeedback ? 'default' : 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {showAnswerFeedback && (
                  <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px 16px', borderRadius: '8px', marginBottom: '18px', borderLeft: '3px solid #2EE57A' }}>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      <strong style={{ color: '#2EE57A' }}>Explicación Oficial: </strong>
                      {ACADEMY_QUIZ_QUESTIONS[currentQIndex].explanation}
                    </div>
                  </div>
                )}

                {showAnswerFeedback && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={handleNextQuestion} className="btn-neon" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                      {currentQIndex + 1 < ACADEMY_QUIZ_QUESTIONS.length ? 'Siguiente Pregunta ➔' : 'Ver Resultados Finales'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
                  {score >= 4 ? '🏆' : '📚'}
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: score >= 4 ? '#2EE57A' : '#E8B931', marginBottom: '6px' }}>
                  {score >= 4 ? '¡Aprobaste el Examen de Leyes FCR!' : 'Buen intento, ¡continúa repasando las Leyes!'}
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
                  Obtuviste {score} de {ACADEMY_QUIZ_QUESTIONS.length} respuestas correctas.
                </p>

                {score >= 4 && (
                  <div style={{ marginBottom: '20px' }}>
                    <button
                      onClick={handleClaimXp}
                      disabled={xpAwarded}
                      className={xpAwarded ? 'btn-outline' : 'btn-neon'}
                      style={{ padding: '10px 24px', fontSize: '0.9rem' }}
                    >
                      {xpAwarded ? '✅ +100 XP Reclamados en Makgora' : '⭐ Reclamar +100 XP de Honor Makgora'}
                    </button>
                  </div>
                )}

                <button onClick={handleRestartQuiz} className="btn-outline" style={{ padding: '8px 20px', fontSize: '0.82rem' }}>
                  🔄 Repetir Examen
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. PESTAÑA: CERTIFICACIONES WORLD RUGBY PASSPORT */}
        {activeTab === 'certificados' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#38bdf8', fontWeight: 800, fontSize: '0.95rem', marginBottom: '6px' }}>
                <ShieldCheck size={20} />
                <span>Plataforma Oficial World Rugby Passport</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                Todos los deportistas y entrenadores de <strong>Orcos Negros Club</strong> deben contar con su registro y certificados oficiales emitidos por World Rugby y reconocidos por la Federación Colombiana de Rugby (FCR). Los cursos son 100% gratuitos y en línea.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '14px' }}>
              {WORLD_RUGBY_CERTIFICATIONS.map(cert => (
                <div
                  key={cert.id}
                  style={{
                    background: 'rgba(20, 23, 21, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2EE57A', background: 'rgba(46, 229, 122, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                        {cert.badge}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {cert.category}
                      </span>
                    </div>
                    <h5 style={{ margin: '6px 0', fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                      {cert.name}
                    </h5>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.4 }}>
                      {cert.description}
                    </p>
                  </div>

                  <a
                    href={cert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline"
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.78rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                      color: '#38bdf8',
                      borderColor: 'rgba(56, 189, 248, 0.4)'
                    }}
                  >
                    <span>Ir al Curso Oficial</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
