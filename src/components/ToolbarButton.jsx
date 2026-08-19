export default function ToolbarButton({ icon, active, onClick, disabled, title, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`term-btn inline-flex items-center justify-center shrink-0 ${className}`}
      style={{
        padding: '8px 14px',
        fontSize: 13,
        minWidth: 40,
        minHeight: 34,
        lineHeight: 1,
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
