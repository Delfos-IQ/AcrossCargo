import React from 'react';

/**
 * Modal para enviar el PDF de confirmación de booking por email.
 * Props:
 *  - emailForm: { to, cc, subject, body }
 *  - setEmailForm: fn — setter del formulario
 *  - isSendingEmail: bool
 *  - handleSendEmail: fn — ejecuta el envío
 *  - onClose: fn — cierra el modal
 */
export default function EmailModal({ emailForm, setEmailForm, isSendingEmail, handleSendEmail, onClose }) {
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
        width: '100%', maxWidth: 520,
        display: 'flex', flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>✉ Send Booking PDF by Email</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', marginTop: 2 }}>
              The PDF will be attached automatically and sent directly
            </div>
          </div>
          <button type="button" className="button button-ghost button-sm"
            onClick={onClose} style={{ fontSize: '1.2rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label required">To (email address)</label>
            <input className="form-input" type="email" value={emailForm.to}
              onChange={e => setEmailForm(f => ({ ...f, to: e.target.value }))}
              placeholder="agent@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">CC (optional)</label>
            <input className="form-input" type="email" value={emailForm.cc}
              onChange={e => setEmailForm(f => ({ ...f, cc: e.target.value }))}
              placeholder="copy@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input className="form-input" value={emailForm.subject}
              onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea className="form-textarea" rows={5} value={emailForm.body}
              onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-gray-400)', margin: 0 }}>
            The PDF is generated and attached automatically — no manual steps needed.
          </p>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end',
          padding: 'var(--space-4) var(--space-5)',
          borderTop: '1px solid var(--color-border)',
        }}>
          <button type="button" className="button button-ghost"
            onClick={onClose} disabled={isSendingEmail}>Cancel</button>
          <button type="button" className="button button-primary"
            disabled={!emailForm.to || isSendingEmail}
            onClick={handleSendEmail}>
            {isSendingEmail ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Sending…
              </span>
            ) : '✉ Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
