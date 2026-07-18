'use client';

export default function Modal({ open, onClose, title, subtitle, children, actions, wide }) {
  return (
    <div
      className={`mbg ${open ? 'on' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <div className="mhandle" />
        {title ? <div className="mtitle">{title}</div> : null}
        {subtitle ? <div className="msub">{subtitle}</div> : null}
        {children}
        {actions ? <div className="macts">{actions}</div> : null}
      </div>
    </div>
  );
}
