import React, { useState } from 'react';
import SendPushModal from './SendPushModal';

export default function NotificationsButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn-outline"
        style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
        title="Enviar notificación push"
      >
        Enviar Notificación
      </button>
      {showModal && <SendPushModal onClose={() => setShowModal(false)} />}
    </>
  );
}
