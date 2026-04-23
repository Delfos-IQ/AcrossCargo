import React from 'react';
import { useAppContext } from '../../context/AppContext.jsx';
import Layout from '../../components/Layout.jsx';
import Footer from '../../components/Footer.jsx';

export default function BookingsPage() {
  const {
    bookings, agentProfiles, flightSchedules,
    awbStockMasters, shipperProfiles, consigneeProfiles,
  } = useAppContext();

  const stats = [
    { label: 'Total Bookings',   value: bookings?.length          ?? '—', accent: 'blue'   },
    { label: 'Agentes',          value: agentProfiles?.length     ?? '—', accent: 'indigo' },
    { label: 'Vuelos',           value: flightSchedules?.length   ?? '—', accent: 'green'  },
    { label: 'Stock AWB',        value: awbStockMasters?.length   ?? '—', accent: 'amber'  },
  ];

  return (
    <Layout>
      <div className="page-wrapper">
        <div className="page-header">
          <div>
            <h1 className="page-title">Bookings</h1>
            <p className="page-subtitle">Gestión de reservas y emisión de AWBs</p>
          </div>
          <button className="button button-primary" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 16, height: 16 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Booking
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
          {stats.map(({ label, value, accent }) => (
            <div key={label} className="stat-card">
              <div className={'stat-card-icon ' + accent}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: 22, height: 22 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div>
                <div className="stat-card-value">{value}</div>
                <div className="stat-card-label">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder contenido Fase 3 */}
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-6)' }}>
            <div className="empty-state-icon" style={{ fontSize: '3rem', opacity: 0.4, margin: '0 auto var(--space-4)' }}>📦</div>
            <div style={{ fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: 'var(--space-2)' }}>
              Formulario de Booking
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-400)', maxWidth: 400, margin: '0 auto' }}>
              El formulario de creación y la tabla de bookings se implementarán en la siguiente fase
              con el nuevo diseño y todas las funcionalidades de AWB, tarifas y cargos.
            </div>
            <div className="badge badge-blue" style={{ marginTop: 'var(--space-4)', display: 'inline-flex' }}>
              Próximamente — Fase 4
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
