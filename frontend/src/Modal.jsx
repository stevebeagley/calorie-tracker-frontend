// Modal.jsx
import './Modal.css';

function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()} // prevent modal close on inner click
      >
        {children}
      </div>
    </div>
  );
}

export default Modal;
