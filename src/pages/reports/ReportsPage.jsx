import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import { buildUTCDateRange, formatDate } from '../../utils/dates.js';
import Layout from '../../components/Layout.jsx';
import Footer from '../../components/Footer.jsx';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { bookings, agentProfiles } = useAppContext();
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [reportData, setReportData] = useState([]);
  const [generated,  setGenerated]  = useState(false);

  const handleGenerate = () => {
    if (!dateFrom || !dateTo) {
      toast.error('Selecciona una fecha de inicio y de fin.');
      return;
    }
    const { startDate, endDate } = buildUTCDateRange(dateFrom, dateTo);
    const filtered = (bookings || []).filter(b => {
      const d = b.createdAt?.toDate();
      return d && d >= startDate && d <= endDate;
    });
    setReportData(filtered);
    setGenerated(true);
    if (!filtered.length) toast('No hay bookings en ese rango de fechas.', { icon: 'ℹ️' });
  };

  const total = reportData.reduce((sum, b) => sum + (parseFloat(b.totalCalculatedCharges) || 0), 0);

  return (
    <Layout>
      <div className="page-wrapper">
        <div className="page-header">
          <div>
            <h1 className="page-title">Reporting & Analytics</h1>
            <p className="page-subtitle">Informe de ingresos por rango de fechas</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <span className="card-title">Revenue Report by Date</span>
          </div>
          <div className="card-body">
            <div className="filter-row">
              <div className="form-group">
                <label htmlFor="dateFrom" className="form-label">Fecha inicio</label>
                <input
                  type="date"
                  id="dateFrom"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="dateTo" className="form-label">Fecha fin</label>
                <input
                  type="date"
                  id="dateTo"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="form-input"
                />
              </div>
              <button onClick={handleGenerate} className="button button-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: 16, height: 16 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                Generar informe
              </button>
            </div>
          </div>
        </div>

        {/* Resultado */}
        {generated && (
          reportData.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="empty-state-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div className="empty-state-text">Sin resultados</div>
                  <div className="empty-state-sub">No hay bookings para el rango de fechas seleccionado.</div>
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
                    <th className="text-right">Ingreso</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((b, i) => (
                    <tr key={b.id || i}>
                      <td data-label="AWB" className="font-mono">{b.awb}</td>
                      <td data-label="Fecha">{formatDate(b.createdAt)}</td>
                      <td data-label="Agente">
                        {agentProfiles?.find(a => a.id === b.selectedAgentProfileId)?.agentName || (
                          <span style={{ color: 'var(--color-gray-400)' }}>N/A</span>
                        )}
                      </td>
                      <td data-label="Ingreso" className="text-right">
                        <span style={{ fontWeight: 600, color: 'var(--color-gray-800)' }}>
                          {(parseFloat(b.totalCalculatedCharges) || 0).toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right">
                      TOTAL — {reportData.length} booking{reportData.length !== 1 ? 's' : ''}
                    </td>
                    <td className="text-right" style={{ fontSize: 'var(--font-size-base)' }}>
                      {total.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        )}
      </div>
      <Footer />
    </Layout>
  );
}
