import { useEffect } from 'react';
import { CircleAlert, X } from 'lucide-react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onClose, 4000);
    return () => clearTimeout(id);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div className="toast" role="alert">
      <CircleAlert size={18} />
      <span>{message}</span>
      <button className="icon-btn" onClick={onClose} aria-label="Dismiss"><X size={16} /></button>
    </div>
  );
}
