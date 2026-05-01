/**
 * Formatea un timestamp de Firestore o string de fecha como YYYY-MM-DD en UTC.
 * Siempre usa UTC para evitar desfases entre zonas horarias.
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  if (typeof dateString.toDate === 'function') {
    return dateString.toDate().toLocaleDateString('en-CA', { timeZone: 'UTC' });
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-CA', { timeZone: 'UTC' });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Formatea una fecha como DDMMM (ej: 22APR). Usa UTC.
 */
export const formatDateDDMMM = (dateString) => {
  if (!dateString) return 'NIL';
  if (typeof dateString.toDate === 'function') {
    dateString = dateString.toDate().toISOString();
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day   = String(date.getUTCDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
    return `${day}${month}`;
  } catch {
    return 'N/A';
  }
};

/**
 * Construye un rango UTC a partir de dos strings YYYY-MM-DD.
 * Devuelve { startDate, endDate } como objetos Date en UTC.
 */
export const buildUTCDateRange = (from, to) => {
  const [sy, sm, sd] = from.split('-').map(Number);
  const [ey, em, ed] = to.split('-').map(Number);
  return {
    startDate: new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0)),
    endDate:   new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999)),
  };
};

/**
 * Filtra un array de bookings por rango de fechas (createdAt).
 * @param {Array}  bookings  - Array de bookings con campo createdAt (Firestore Timestamp)
 * @param {Date}   startDate - Fecha inicio (UTC)
 * @param {Date}   endDate   - Fecha fin (UTC)
 * @returns {Array} Bookings dentro del rango, ordenados por fecha ascendente
 */
export const filterBookingsByDateRange = (bookings, startDate, endDate) => {
  return bookings
    .filter(b => {
      const d = b.createdAt?.toDate();
      return d && d >= startDate && d <= endDate;
    })
    .sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());
};

/**
 * Convierte un objeto Date a string YYYY-MM-DD en UTC.
 */
export const toYyyyMmDd = (date) => {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
