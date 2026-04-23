/**
 * Utilidades para gestión de números AWB (Air Waybill).
 * Incluye validación de dígito de control, secuencias y cálculo de rangos.
 */

export const generateUniqueId = () => {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const parseAwbSerial = (serial) => {
  if (serial.length !== 8 || !/^\d{8}$/.test(serial)) return null;
  return {
    static4:   serial.substring(0, 4),
    counter3:  serial.substring(4, 7),
    lastDigit: serial.substring(7, 8),
  };
};

export const formatAwbSerial = (static4, counter3, lastDigit) =>
  `${static4.padStart(4, '0')}${counter3.padStart(3, '0')}${lastDigit}`;

export const isValidAwbSerialWithCheckDigit = (serial) => {
  if (serial.length !== 8 || !/^\d{8}$/.test(serial)) return false;
  const baseSerial  = serial.substring(0, 7);
  const checkDigit  = parseInt(serial.substring(7, 8), 10);
  if (isNaN(checkDigit)) return false;
  const numericBase = parseInt(baseSerial, 10);
  if (isNaN(numericBase)) return false;
  return (numericBase % 7) === checkDigit;
};

export const getNextAwbSerial = (currentSerial) => {
  const parts = parseAwbSerial(currentSerial);
  if (!parts) return null;
  let sNum = parseInt(parts.static4, 10);
  let cNum = parseInt(parts.counter3, 10);
  cNum++;
  if (cNum > 999) {
    cNum = 0;
    sNum++;
    if (sNum > 9999) {
      console.warn('AWB Static4 exceeded 9999. Resetting to 0000.');
      sNum = 0;
    }
  }
  const sevenDigitSerialValue  = sNum * 1000 + cNum;
  const calculatedCheckDigit   = sevenDigitSerialValue % 7;
  return formatAwbSerial(
    String(sNum).padStart(4, '0'),
    String(cNum).padStart(3, '0'),
    String(calculatedCheckDigit),
  );
};

export const calculateEndSerial = (startSerial, quantity) => {
  if (!startSerial || startSerial.length !== 8 || quantity <= 0 || !parseAwbSerial(startSerial)) return '';
  if (quantity === 1) return startSerial;
  let current = startSerial;
  for (let i = 1; i < quantity; i++) {
    const next = getNextAwbSerial(current);
    if (!next || next === current) return 'Error: Sequence Stuck';
    current = next;
  }
  return current;
};

export const isSerialLTE = (serialA, serialB) => {
  const numA = parseInt(serialA.substring(0, 7), 10);
  const numB = parseInt(serialB.substring(0, 7), 10);
  return numA <= numB;
};

export const calculateAwbCount = (startSerial, endSerial) => {
  if (
    !startSerial || startSerial.length !== 8 ||
    !endSerial   || endSerial.length   !== 8 ||
    !parseAwbSerial(startSerial) || !parseAwbSerial(endSerial)
  ) return 0;
  if (!isSerialLTE(startSerial, endSerial)) return 0;
  if (startSerial === endSerial) return 1;

  let current = startSerial;
  let count   = 1;
  const maxIterations = 200000;

  for (let i = 0; i < maxIterations; i++) {
    if (current === endSerial) return count;
    const next = getNextAwbSerial(current);
    if (!next || next === current) {
      console.error('AWB sequence stuck.', { current, next });
      return 0;
    }
    current = next;
    count++;
    if (!isSerialLTE(current, endSerial) && current !== endSerial) {
      console.warn('Overshot end serial.', { startSerial, endSerial, current });
      return 0;
    }
  }
  console.warn(`calculateAwbCount reached maxIterations between ${startSerial} and ${endSerial}`);
  return 0;
};
