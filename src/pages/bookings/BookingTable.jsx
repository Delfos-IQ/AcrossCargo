import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { formatDate } from '../../utils/dates.js';

export default function BookingTable({ onEdit }) {
  const { bookings, agentProfiles } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = useMemo(() => {
    return (bookings || []).filter(b => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (b.awb || '').toLowerCase().includes(q) ||
        (b.shipperName || '').toLowerCase().includes(q) ||
        (b.consigneeName || '').toLowerCase().includes(q) ||
        (b.origin || '').toLowerCase().includes(q) ||
        (b.destination || '').toLowerCase().includes(q);
      const matchAgent = !filterAgent || b.selectedAgentProfileId === filterAgent;
      const matchStatus = !filterStatus || b.bookingStatus === filterStatus;
      return matchSearch && matchAgent && matchStatus;
    });
  }, [bookings, search, filterAgent, filterStatus]);

  const agentName = (id) => agentProfiles?.find(a => a.id === id)?.agentName || '—';

  const statusBadge = (status) => {
    const map = { 'KK': 'green', 'NN': 'amber', 'WL': 'amber', 'XX': 'red', 'HX': 'red' };
    return <span className={'badge badge-' + (map[status] || 'gray')}>{status || '—'}</span>;
  };

  return (
    <div>
      {/* Filtros */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="card-body">
          <div className="filter-row">
            <div className="form-group" style={{ flex: 2, minWidth: 200 }}>
              <label className="form-label">Buscar</label>
              <input
                className="form-input"
                placeholder="AWB, shipper, consignee, ruta…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Agente</label>
              <select className="form-select" value={filterAgent} onChange={e => setFilterAgent(e.target.value)}>
                <option value="">Todos</option>
                {(agentProfiles || []).map(a => <option key={a.id} value={a.id}>{a.agentName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Todos</option>
                {['KK','NN','WL','XX','HX'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {(search || filterAgent || filterStatus) && (
              <button className="button button-ghost button-sm" onClick={() => { setSearch(''); setFilterAgent(''); setFilterStatus(''); }}>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contador */}
      <div style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-500)' }}>
        {filtered.length} booking{filtered.length !== 1 ? 's' : ''}
        {(search || filterAgent || filterStatus) ? ' encontrados' : ' en total'}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="empty-state-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="empty-state-text">Sin resultados</div>
              <div className="empty-state-sub">No hay bookings que coincidan con los filtros.</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>AWB</th>
                <th>Fecha</th>
                <th>Agente</th>
                <th>Ruta</th>
                <th>Shipper</th>
                <th>Pcs</th>
                <th>Peso (kg)</th>
                <th>Estado</th>
                <th className="text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr key={b.id || i}>
                  <td data-label="AWB" className="font-mono" style={{ fontWeight: 600 }}>{b.awb || '—'}</td>
                  <td data-label="Fecha">{formatDate(b.createdAt)}</td>
                  <td data-label="Agente">{agentName(b.selectedAgentProfileId)}</td>
                  <td data-label="Ruta">
                    <span className="badge badge-gray">{b.origin || '?'} → {b.destination || '?'}</span>
                  </td>
                  <td data-label="Shipper" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.shipperName || '—'}
                  </td>
                  <td data-label="Pcs">{b.pieces || '—'}</td>
                  <td data-label="Peso">{b.weightKg || '—'}</td>
                  <td data-label="Estado">{statusBadge(b.bookingStatus)}</td>
                  <td data-label="Total" className="text-right" style={{ fontWeight: 600 }}>
                    {b.currency} {(parseFloat(b.totalCalculatedCharges) || 0).toFixed(2)}
                  </td>
                  <td>
                    {onEdit && (
                      <button
                        className="button button-ghost button-sm"
                        onClick={() => onEdit(b)}
                        title="Editar booking"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: 14, height: 14 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
