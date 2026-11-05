// ── Utilidad de Respuesta Háptica Móvil (Vibración) ──
// Proporciona retroalimentación táctil en teléfonos Android e iOS (PWA/Capacitor)
// al anotar Tries, sonar el silbato arbitral o sancionar tarjetas.

export function isHapticsSupported() {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Ejecuta un patrón de vibración si el dispositivo móvil lo soporta.
 * @param {number|number[]} pattern
 */
export function triggerVibration(pattern) {
  if (!isHapticsSupported()) return false;
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

/**
 * Vibración festiva y potente al anotar un Try (5 pts).
 */
export function vibrateTry() {
  return triggerVibration([120, 60, 120, 60, 250]);
}

/**
 * Vibración rítmica al pitar el silbato arbitral.
 */
export function vibrateWhistle() {
  return triggerVibration([80, 40, 80]);
}

/**
 * Vibración prolongada de alerta al sacar Tarjeta Amarilla o Roja.
 */
export function vibrateCard() {
  return triggerVibration([300]);
}

/**
 * Vibración suave para confirmación de clics y acciones exitosas.
 */
export function vibrateSuccess() {
  return triggerVibration([40, 40, 40]);
}

/**
 * Toque háptico sutil para botones interactivos.
 */
export function vibrateTap() {
  return triggerVibration([25]);
}
