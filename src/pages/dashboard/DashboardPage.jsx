import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext.jsx';
import Layout from '../../components/Layout.jsx';
import Footer from '../../components/Footer.jsx';

const NAV_CARDS = [
  {
    id: 'bookings',
    title: 'Create / View Bookings',
    description: 'Crea nuevos bookings, emite AWBs y consulta el historial de reservas de carga.',
    path: '/bookings',
    accent: 'blue',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'billing',
    title: 'Invoicing & Billing',
    description: 'Genera facturas por agente filtrando por rango de fechas y revisa los totales.',
    path: '/billing',
    accent: 'indigo',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m10.5-1.5H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m10.5-10.5h-7.5A2.25 2.25 0 009 8.25v7.5" />
      </svg>
    ),
  },
  {
    id: 'reports',
    title: 'Reporting & Analytics',
    description: 'Informes de ingresos por período, estadísticas de carga y análisis de rendimiento.',
    path: '/reports',
    accent: 'green',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

const accentStyles = {
  blue:   { bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' },
  indigo: { bg: 'var(--color-indigo-100)',  color: 'var(--color-indigo-700)'  },
  green:  { bg: 'var(--color-success-bg)',  color: 'var(--color-success-text)'},
  amber:  { bg: 'var(--color-warning-bg)',  color: 'var(--color-warning-text)'},
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { bookings, agentProfiles, flightSchedules, awbStockMasters } = useAppContext();

  const stats = [
    { label: 'Total Bookings',     value: bookings?.length        ?? '—', accent: 'blue'   },
    { label: 'Agentes activos',    value: agentProfiles?.length   ?? '—', accent: 'indigo' },
    { label: 'Vuelos programados', value: flightSchedules?.length ?? '—', accent: 'green'  },
    { label: 'Stock AWB',          value: awbStockMasters?.length ?? '—', accent: 'amber'  },
  ];

  return (
    <Layout>
      <div className="page-wrapper">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Resumen general del sistema de carga</p>
          </div>
        </div>

        <div className="stats-grid" style={{ marginBottom: 'var(--space-8)' }}>
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

        <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: 'var(--color-gray-700)', marginBottom: 'var(--space-4)' }}>
          Módulos del sistema
        </h2>
        <div className="dashboard-grid">
          {NAV_CARDS.map((card) => {
            const style = accentStyles[card.accent] || accentStyles.blue;
            return (
              <div
                key={card.id}
                className="nav-card"
                onClick={() => navigate(card.path)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(card.path)}
                aria-label={'Ir a ' + card.title}
              >
                <div className="nav-card-top">
                  <div className="nav-card-icon-wrap" style={{ backgroundColor: style.bg, color: style.color }}>
                    {card.icon}
                  </div>
                  <div className="nav-card-title">{card.title}</div>
                  <div className="nav-card-desc">{card.description}</div>
                </div>
                <div className="nav-card-footer">
                  Abrir módulo
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 14, height: 14 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </Layout>
  );
}
