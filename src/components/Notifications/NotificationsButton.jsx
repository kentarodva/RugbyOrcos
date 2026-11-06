import React, { useState } from 'react';
import { Send } from 'lucide-react';
import SendPushModal from './SendPushModal';
import { SheetItem } from '../shell/Sheet';

/** The modal lives inside this component, so the host must stay mounted while it is open. */
export default function NotificationsButton({ variant }) {
  const [showModal, setShowModal] = useState(false);
  const open = () => setShowModal(true);

  return (
    <>
      {variant === 'menu' ? (
        <SheetItem icon={Send} label="Enviar notificación" onClick={open} />
      ) : (
        <button onClick={open} className="btn-outline btn-sm" title="Enviar notificación push">
          <Send size={16} /> Enviar notificación
        </button>
      )}
      {showModal && <SendPushModal onClose={() => setShowModal(false)} />}
    </>
  );
}
