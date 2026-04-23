import React, { useState } from 'react';
import Layout from '../../components/Layout.jsx';
import Footer from '../../components/Footer.jsx';
import BookingForm from './BookingForm.jsx';
import BookingTable from './BookingTable.jsx';

const VIEWS = { LIST: 'list', NEW: 'new' };

export default function BookingsPage() {
  const [view, setView] = useState(VIEWS.LIST);

  return (
    <Layout>
      <div className="page-wrapper">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Bookings</h1>
            <p className="page-subtitle">Gestión de reservas y emisión de AWBs</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              className={'button ' + (view === VIEWS.LIST ? 'button-primary' : 'button-secondary')}
              onClick={() => setView(VIEWS.LIST)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
              Ver bookings
            </button>
            <button
              className={'button ' + (view === VIEWS.NEW ? 'button-primary' : 'button-secondary')}
              onClick={() => setView(VIEWS.NEW)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nuevo booking
            </button>
          </div>
        </div>

        {/* Contenido */}
        {view === VIEWS.LIST && (
          <BookingTable onEdit={(b) => console.log('edit', b)} />
        )}
        {view === VIEWS.NEW && (
          <BookingForm onSuccess={() => setView(VIEWS.LIST)} />
        )}
      </div>
      <Footer />
    </Layout>
  );
}
