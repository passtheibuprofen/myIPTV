export default function ToolbarButton({ icon, active, onClick, disabled, title, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`term-btn inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        padding: '9px 14px',
        fontSize: 19.5,
        minWidth: 39,
        minHeight: 39,
        lineHeight: 1,
        fontWeight: 700,
        letterSpacing: '0.5px',
        ...(active ? {
          background: 'var(--color-accent)',
          color: 'var(--color-bg)',
          borderColor: 'var(--color-accent)',
        } : {}),
      }}
    >
      {icon || children}
    </button>
  );
}
