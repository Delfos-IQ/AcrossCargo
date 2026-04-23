import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection.js';

const AppContext = createContext(null);

/**
 * Proveedor global de la aplicación.
 * Gestiona autenticación y los listeners en tiempo real de Firestore.
 * Los componentes hijos consumen este contexto con useAppContext().
 */
export const AppProvider = ({ children }) => {
  const { currentUser, currentUserProfile, isLoading: authLoading, login, logout } = useAuth();

  // Solo cargamos datos si hay un usuario autenticado
  const enabled = !!currentUser;

  const { data: bookings }          = useFirestoreCollection(enabled ? 'bookings'              : null, 'createdAt', 'desc');
  const { data: agentProfiles }     = useFirestoreCollection(enabled ? 'agentProfiles'         : null);
  const { data: shipperProfiles }   = useFirestoreCollection(enabled ? 'shipperProfiles'       : null);
  const { data: consigneeProfiles } = useFirestoreCollection(enabled ? 'consigneeProfiles'     : null);
  const { data: ghaProfiles }       = useFirestoreCollection(enabled ? 'ghaProfiles'           : null);
  const { data: flightSchedules }   = useFirestoreCollection(enabled ? 'flightSchedules'       : null);
  const { data: rateTableEntries }  = useFirestoreCollection(enabled ? 'rateTableEntries'      : null);
  const { data: awbStockMasters }   = useFirestoreCollection(enabled ? 'awbStockMasters'       : null);
  const { data: awbStockAllocations } = useFirestoreCollection(enabled ? 'awbStockAllocations' : null);
  const { data: userProfiles }      = useFirestoreCollection(enabled ? 'userProfiles'          : null);
  const { data: iataAirportCodes }  = useFirestoreCollection(enabled ? 'managedIataAirportCodes' : null);

  const value = {
    // Auth
    currentUser,
    currentUserProfile,
    isLoading: authLoading,
    login,
    logout,
    // Datos en tiempo real
    bookings,
    agentProfiles,
    shipperProfiles,
    consigneeProfiles,
    ghaProfiles,
    flightSchedules,
    rateTableEntries,
    awbStockMasters,
    awbStockAllocations,
    userProfiles,
    iataAirportCodes,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
};
