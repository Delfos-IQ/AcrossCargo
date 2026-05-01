import React from 'react';

/**
 * Modal que muestra el mensaje FFR en formato IATA Cargo-IMP.
 * Props:
 *  - ffrText: string — el mensaje generado
 *  - ffrCopied: bool — estado del botón "Copied"
 *  - setFfrCopied: fn — setter del estado
 *  - onClose: fn — cierra el modal
 */
export default function FfrModal({ ffrText, ffrCopied, setFfrCopied, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'var(--space-4)',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%', maxWidth: 640,
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>📋 FFR Message</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginTop: 2 }}>
              IATA Cargo-IMP format
            </div>
          </div>
          <button type="button" className="button button-ghost button-sm"
            onClick={onClose} style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Body — monospaced FFR text */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4) var(--space-5)' }}>
          <pre style={{
            fontFamily: "'Courier New', monospace",
            fontSize: '0.85rem',
            lineHeight: 1.7,
            color: '#e2e8f0',
            background: '#141322',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-4)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            margin: 0,
          }}>{ffrText}</pre>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end',
          padding: 'var(--space-4) var(--space-5)',
          borderTop: '1px solid var(--color-border)',
        }}>
          <button type="button" className="button button-ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="button button-primary"
            onClick={() => {
              navigator.clipboard.writeText(ffrText).then(() => {
                setFfrCopied(true);
                setTimeout(() => setFfrCopied(false), 2000);
              });
            }}>
            {ffrCopied ? '✓ Copied!' : '📋 Copy FFR'}
          </button>
        </div>
      </div>
    </div>
  );
}
