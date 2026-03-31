import type { ReactNode } from 'react';

export interface PlaceholderCardProps {
  title: string;
  description: string;
  footer?: ReactNode;
}

export function PlaceholderCard({ title, description, footer }: PlaceholderCardProps) {
  return (
    <section
      aria-label={title}
      style={{
        border: '1px solid #d4d4d8',
        borderRadius: '1rem',
        padding: '1.5rem',
        background: '#ffffff',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        display: 'grid',
        gap: '0.75rem',
        maxWidth: '36rem',
      }}
    >
      <span
        style={{
          width: 'fit-content',
          padding: '0.35rem 0.65rem',
          borderRadius: '999px',
          background: '#ecfeff',
          color: '#155e75',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}
      >
        Bootstrap técnico
      </span>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.875rem', color: '#0f172a' }}>{title}</h1>
        <p style={{ margin: '0.5rem 0 0', color: '#334155', lineHeight: 1.6 }}>{description}</p>
      </div>
      {footer ? <div>{footer}</div> : null}
    </section>
  );
}
