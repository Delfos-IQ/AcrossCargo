import { useMemo } from 'react';
import { useAppContext } from '../context/AppContext.jsx';

/**
 * Devuelve los bookings filtrados según el rol del usuario:
 * - Admin: todos los bookings
 * - Agente: solo los bookings del propio agente (agent_id === myAgentId)
 */
export const useScopedBookings = () => {
  const { bookings, isAdmin, myAgentId } = useAppContext();

  return useMemo(() => {
    const all = bookings || [];
    return isAdmin ? all : all.filter(b => b.agent_id === myAgentId);
  }, [bookings, isAdmin, myAgentId]);
};
