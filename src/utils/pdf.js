/**
 * PDF generation utilities using jsPDF + jsPDF-AutoTable (loaded via CDN).
 * These functions rely on window.jspdf being available.
 */
import { airlinePrefixData } from '../data/airlines.js';
import { formatNumberWithSeparators } from './numbers.js';
import { formatDateDDMMM } from './dates.js';

const formatDateStr = (val) => {
  if (!val) return 'N/A';
  if (typeof val === 'string' && val.includes('-')) {
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  }
  try {
    const d = val?.toDate ? val.toDate() : new Date(val);
    if (isNaN(d)) return 'N/A';
    return d.toLocaleDateString('en-GB');
  } catch { return 'N/A'; }
};


/* ──────────────────────────────────────────────────────────────
   BOOKING CONFIRMATION PDF
─────────────────────────────────────────────────────────────── */
export const generateBookingConfirmationPdf = (booking, flightSchedules = [], iataAirportCodes = [], { preview = false, returnBase64 = false } = {}) => {
  const { jsPDF } = window.jspdf;
  const pdoc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const getAirport = (code) => {
    const a = iataAirportCodes.find(ap => ap.code === code);
    return a ? `${a.code} (${a.name || a.city || code})` : code || 'N/A';
  };

  let y = 15;
  const lineGap = 5;
  const sectionGap = 6;
  const LEFT = 15;
  const RIGHT = pdoc.internal.pageSize.getWidth() - 15;
  const MID = 80;

  const checkPage = () => {
    if (y > 270) { pdoc.addPage(); y = 20; }
  };

  const drawSection = (title, rows) => {
    checkPage();
    pdoc.setFontSize(10);
    pdoc.setFont('helvetica', 'bold');
    pdoc.setFillColor(243, 244, 246);
    pdoc.rect(LEFT, y - 4, RIGHT - LEFT, 6, 'F');
    pdoc.text(title.toUpperCase(), LEFT + 2, y);
    y += lineGap;
    pdoc.setFontSize(8.5);
    pdoc.setFont('helvetica', 'normal');
    rows.forEach(({ label, value }) => {
      checkPage();
      pdoc.setFont('helvetica', 'bold');
      pdoc.text(`${label}:`, LEFT + 3, y);
      pdoc.setFont('helvetica', 'normal');
      const valStr = String(value || 'N/A');
      const lines = pdoc.splitTextToSize(valStr, RIGHT - MID - 5);
      pdoc.text(lines, MID, y);
      y += lineGap * Math.max(1, lines.length);
    });
    y += sectionGap / 2;
  };

  // Title
  pdoc.setFontSize(16);
  pdoc.setFont('helvetica', 'bold');
  pdoc.setTextColor(17, 24, 39);
  pdoc.text('BOOKING CONFIRMATION', pdoc.internal.pageSize.getWidth() / 2, y, { align: 'center' });
  y += 8;

  // Sub-header
  pdoc.setFontSize(9);
  pdoc.setFont('helvetica', 'normal');
  pdoc.setTextColor(107, 114, 128);
  const airline = airlinePrefixData.find(ap => ap.prefix === booking.awbInputPrefix);
  pdoc.text(`AWB: ${booking.awb || 'N/A'}`, LEFT, y);
  pdoc.text(`Date: ${formatDateStr(booking.createdAt)}`, RIGHT, y, { align: 'right' });
  y += 5;
  pdoc.text(`Airline: ${airline ? `${airline.prefix} – ${airline.name}` : booking.awbInputPrefix || 'N/A'}`, LEFT, y);
  y += 8;
  pdoc.setTextColor(17, 24, 39);

  drawSection('Shipment Details', [
    { label: 'Origin', value: getAirport(booking.origin) },
    { label: 'Destination', value: getAirport(booking.destination) },
    { label: 'Pieces', value: booking.pieces },
    { label: 'Gross Weight', value: `${booking.weightKg} kg` },
    { label: 'Chargeable Weight', value: `${booking.chargeableWeightKg || '—'} kg` },
    { label: 'Volume', value: `${booking.volumeM3 || '—'} m³` },
    { label: 'Commodity', value: booking.natureOfGoods },
    { label: 'SHC', value: booking.selectedShcCode },
    { label: 'Status', value: booking.bookingStatus },
  ]);

  // Flight segments table
  if (booking.flightSegments?.length) {
    checkPage();
    pdoc.setFontSize(10);
    pdoc.setFont('helvetica', 'bold');
    pdoc.setFillColor(243, 244, 246);
    pdoc.rect(LEFT, y - 4, RIGHT - LEFT, 6, 'F');
    pdoc.text('FLIGHT ITINERARY', LEFT + 2, y);
    y += 3;

    pdoc.autoTable({
      startY: y,
      head: [['Flight', 'Date', 'Origin', 'Destination', 'STD', 'STA', 'Status']],
      body: booking.flightSegments.map(seg => {
        const fs = flightSchedules.find(s => s.flightNumber?.toUpperCase() === seg.flightNumber?.toUpperCase());
        return [seg.flightNumber || 'NIL', formatDateDDMMM(seg.departureDate), seg.segmentOrigin || '—', seg.segmentDestination || '—', fs?.std || '—', fs?.sta || '—', booking.bookingStatus || '—'];
      }),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      margin: { left: LEFT, right: 15 },
    });
    y = pdoc.lastAutoTable.finalY + sectionGap;
  }

  // Dimensions
  if (booking.dimensionLines?.length) {
    drawSection('Dimensions', booking.dimensionLines.map((d, i) => ({
      label: `Line ${i + 1}`,
      value: `${d.pieces} pcs — ${d.length}×${d.width}×${d.height} cm`,
    })));
  }

  drawSection('Shipper', [
    { label: 'Name', value: booking.shipperName },
    { label: 'Address', value: booking.shipperStreet },
    { label: 'City/Country', value: `${booking.shipperCity || ''}, ${booking.shipperCountry || ''}` },
    { label: 'Contact', value: booking.shipperContact },
  ]);

  drawSection('Consignee', [
    { label: 'Name', value: booking.consigneeName },
    { label: 'Address', value: booking.consigneeStreet },
    { label: 'City/Country', value: `${booking.consigneeCity || ''}, ${booking.consigneeCountry || ''}` },
    { label: 'Contact', value: booking.consigneeContact },
  ]);

  drawSection('Agent', [
    { label: 'Name', value: booking.agent_details_name },
    { label: 'IATA/CASS', value: booking.agentIataCassNumber || booking.agent_id },
    { label: 'Reference', value: booking.ffrReference },
  ]);

  drawSection('Charges', [
    { label: 'Currency', value: booking.currency },
    { label: 'Rate/kg', value: String(booking.ratePerKg) },
    { label: 'Freight', value: String(booking.freightCharges) },
    { label: 'Total', value: String(booking.totalCalculatedCharges) },
    { label: 'Payment Type', value: booking.paymentType },
  ]);

  // OSI / GHA — highlighted block
  if (booking.osiGhaText?.trim()) {
    checkPage();
    pdoc.setFontSize(10);
    pdoc.setFont('helvetica', 'bold');
    pdoc.setFillColor(243, 244, 246);
    pdoc.rect(LEFT, y - 4, RIGHT - LEFT, 6, 'F');
    pdoc.text('OSI / GHA', LEFT + 2, y);
    y += lineGap;

    const osiLines = pdoc.splitTextToSize(booking.osiGhaText.trim(), RIGHT - LEFT - 6);
    const blockH = osiLines.length * lineGap + 4;
    // Yellow highlight background
    pdoc.setFillColor(255, 249, 196);
    pdoc.rect(LEFT, y - 4, RIGHT - LEFT, blockH, 'F');
    // Bold underlined text
    pdoc.setFontSize(9.5);
    pdoc.setFont('helvetica', 'bold');
    pdoc.setTextColor(17, 24, 39);
    osiLines.forEach((line, i) => {
      pdoc.text(line, LEFT + 3, y + i * lineGap);
      // Manual underline
      const tw = pdoc.getTextWidth(line);
      pdoc.setDrawColor(17, 24, 39);
      pdoc.setLineWidth(0.3);
      pdoc.line(LEFT + 3, y + i * lineGap + 0.8, LEFT + 3 + tw, y + i * lineGap + 0.8);
    });
    pdoc.setTextColor(17, 24, 39);
    pdoc.setFont('helvetica', 'normal');
    y += blockH + sectionGap / 2;
  }

  // Handling information
  if (booking.handlingInformation?.trim()) {
    drawSection('Handling Information', [
      { label: 'Instructions', value: booking.handlingInformation },
    ]);
  }

  // Other charges table
  if (booking.otherCharges?.length) {
    checkPage();
    pdoc.autoTable({
      startY: y,
      head: [['Code', 'Description', 'Amount']],
      body: booking.otherCharges.map(oc => [oc.chargeCode, oc.chargeDescription, parseFloat(oc.chargeAmount).toFixed(2)]),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.5 },
      margin: { left: LEFT, right: 15 },
    });
    y = pdoc.lastAutoTable.finalY + sectionGap;
  }

  if (returnBase64) {
    // Returns pure base64 string (no data URI prefix) for email attachment
    return pdoc.output('datauristring').split(',')[1];
  } else if (preview) {
    const url = pdoc.output('bloburl');
    window.open(url, '_blank');
  } else {
    pdoc.save(`Booking_${(booking.awb || 'AWB').replace('-', '')}.pdf`);
  }
};

/* ──────────────────────────────────────────────────────────────
   FLIGHT BOOKING LIST (FBL) PDF
─────────────────────────────────────────────────────────────── */

/** Convert /logo.svg → base64 PNG via canvas (browser only) */
async function loadLogoBase64() {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200; canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 200, 240);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = '/logo.svg';
    } catch { resolve(null); }
  });
}

/**
 * Generate Flight Booking List PDF.
 * @param {Array}  bookings   - Array of booking objects for this flight
 * @param {object} flightInfo - { flightNumber, departureDate, std, origin, destination }
 * @param {string} preparedBy - Name/email of user generating the report
 */
export const generateFblPdf = async (bookings, flightInfo, preparedBy = 'AcrossCargo', { returnBase64 = false } = {}) => {
  if (!bookings?.length) return;
  const { jsPDF } = window.jspdf;

  const { flightNumber, departureDate, std, origin, destination } = flightInfo;

  // Sort bookings by origin then by AWB
  const sorted = [...bookings].sort((a, b) => {
    const segA = (a.flightSegments || []).find(s => s.flightNumber === flightNumber && s.departureDate === departureDate);
    const segB = (b.flightSegments || []).find(s => s.flightNumber === flightNumber && s.departureDate === departureDate);
    const oA = segA?.segmentOrigin || '';
    const oB = segB?.segmentOrigin || '';
    if (oA !== oB) return oA.localeCompare(oB);
    return (a.awb || '').localeCompare(b.awb || '');
  });

  // Load logo
  const logoBase64 = await loadLogoBase64();

  // Formatted date/time for header and filename
  const now = new Date();
  const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const dd2 = String(now.getDate()).padStart(2,'0');
  const mon = MONTHS[now.getMonth()];
  const yy  = String(now.getFullYear()).slice(-2);
  const timeStr = `${hh}${mm}LT`;
  const dateStrHeader = `${dd2}-${mon}-${now.getFullYear()} ${hh}:${mm}`;

  // Departure date formatted as DDMMM
  const depDate = formatDateDDMMM(departureDate); // e.g. "01JUL"

  // Build jsPDF document
  const pdoc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const PW = pdoc.internal.pageSize.getWidth();
  const PH = pdoc.internal.pageSize.getHeight();
  const L = 14, R = PW - 14;
  const totalPages = pdoc.internal.pages.length; // will update after

  // ── Header drawing function (called on each new page) ──
  const drawHeader = (pageNum) => {
    // Logo
    if (logoBase64) {
      pdoc.addImage(logoBase64, 'PNG', L, 4, 18, 22);
    } else {
      pdoc.setFont('helvetica', 'bold');
      pdoc.setFontSize(10);
      pdoc.setTextColor(212, 74, 18);
      pdoc.text('ACROSSCARGO', L, 14);
    }
    // Company name next to logo
    pdoc.setFont('helvetica', 'bold');
    pdoc.setFontSize(7);
    pdoc.setTextColor(27, 39, 102);
    pdoc.text('ACROSSCARGO GSSA', L + 20, 10);
    pdoc.setFont('helvetica', 'normal');
    pdoc.setTextColor(100, 100, 100);
    pdoc.text('General Sales & Service Agent', L + 20, 14);

    // Separator line
    pdoc.setDrawColor(212, 74, 18);
    pdoc.setLineWidth(0.8);
    pdoc.line(L, 27, R, 27);

    // Right side: date, page, prepared by
    pdoc.setFont('helvetica', 'normal');
    pdoc.setFontSize(8);
    pdoc.setTextColor(60, 60, 60);
    pdoc.text(`Date:`, R - 60, 10);
    pdoc.text(`Page :`, R - 60, 15);
    pdoc.text(`Prepared by:`, R - 60, 20);
    pdoc.setFont('helvetica', 'bold');
    pdoc.text(dateStrHeader, R - 30, 10);
    pdoc.text(`${pageNum}/TOTAL`, R - 30, 15); // will be replaced
    pdoc.setFont('helvetica', 'normal');
    pdoc.text(preparedBy.toUpperCase(), R - 30, 20);

    // Title
    let y = 34;
    pdoc.setFont('helvetica', 'bold');
    pdoc.setFontSize(13);
    pdoc.setTextColor(17, 24, 39);
    pdoc.text('FLIGHT BOOKING LIST', L, y);

    // Flight info line
    y += 7;
    pdoc.setFontSize(9);
    pdoc.setFont('helvetica', 'normal');
    pdoc.setTextColor(60, 60, 60);
    const depDateFull = departureDate ? (() => {
      const [yr, mo, dy] = departureDate.split('-');
      return `${dy}-${MONTHS[parseInt(mo)-1]}-${yr}`;
    })() : '—';
    pdoc.text(`${flightNumber} / ${depDateFull}`, L, y);
    pdoc.text(std || '—', L + 55, y);
    pdoc.text(`${origin}-${destination}`, L + 75, y);

    return y + 4; // return y after header
  };

  // ── Column definitions ──
  const COLS = {
    awb:   { x: L,      w: 32, label: 'AWB NO.' },
    pcs:   { x: L+32,   w: 12, label: 'PCS' },
    wgt:   { x: L+44,   w: 18, label: 'WEIGHT' },
    vol:   { x: L+62,   w: 13, label: 'VOL.' },
    desc:  { x: L+75,   w: 34, label: 'DESCRIPTION' },
    other: { x: L+109,  w: 46, label: 'OTHER INFO' },
    shc:   { x: L+155,  w: 14, label: 'SHC' },
    prio:  { x: L+169,  w: 13, label: 'PRIORITY' },
  };

  const drawColumnHeaders = (y) => {
    pdoc.setFontSize(7.5);
    pdoc.setFont('helvetica', 'bold');
    pdoc.setTextColor(17, 24, 39);
    pdoc.setDrawColor(17, 24, 39);
    pdoc.setLineWidth(0.4);
    pdoc.line(L, y + 1, R, y + 1);
    Object.values(COLS).forEach(col => {
      pdoc.text(col.label, col.x, y);
    });
    y += 2;
    pdoc.line(L, y, R, y);
    return y + 3;
  };

  // ── Start first page ──
  let currentPage = 1;
  let y = drawHeader(currentPage);
  y = drawColumnHeaders(y);

  const LINE_H = 4.2;
  const checkPage = (needed = 8) => {
    if (y + needed > PH - 16) {
      pdoc.addPage();
      currentPage++;
      y = drawHeader(currentPage);
      y = drawColumnHeaders(y);
    }
  };

  // ── Group by destination for subtotals ──
  const destGroups = {};
  sorted.forEach(b => {
    const seg = (b.flightSegments || []).find(s => s.flightNumber === flightNumber && s.departureDate === departureDate);
    const dest = seg?.segmentDestination || destination || '—';
    if (!destGroups[dest]) destGroups[dest] = [];
    destGroups[dest].push({ booking: b, seg });
  });

  let grandPcs = 0, grandWgt = 0, grandVol = 0, grandAwbs = 0;

  // ── Render rows ──
  Object.entries(destGroups).forEach(([dest, entries]) => {
    // Destination header
    checkPage(6);
    pdoc.setFont('helvetica', 'bold');
    pdoc.setFontSize(7.5);
    pdoc.setTextColor(17, 24, 39);
    pdoc.text(dest, COLS.awb.x, y);
    y += LINE_H;

    let destPcs = 0, destWgt = 0, destVol = 0;

    entries.forEach(({ booking: b }) => {
      const pcs  = parseInt(b.pieces) || 0;
      const wgt  = parseFloat(b.weightKg) || 0;
      const vol  = parseFloat(b.volumeM3) || 0;
      destPcs += pcs; destWgt += wgt; destVol += vol;
      grandPcs += pcs; grandWgt += wgt; grandVol += vol;
      grandAwbs++;

      // Dimension lines estimate height
      const dimLines = (b.dimensionLines || []).filter(d => d.pieces && d.length);
      const handlingLines = b.handlingInformation?.trim() ? 1 : 0;
      const osiLines = b.osiGhaText?.trim() ? 1 : 0;
      const rowHeight = LINE_H + dimLines.length * (LINE_H - 1) + handlingLines * (LINE_H - 1) + osiLines * (LINE_H - 1);
      checkPage(rowHeight + 2);

      // Main row
      pdoc.setFont('helvetica', 'normal');
      pdoc.setFontSize(7.5);
      pdoc.setTextColor(17, 24, 39);
      pdoc.text(b.awb || '—',                      COLS.awb.x,  y);
      pdoc.text(String(pcs),                         COLS.pcs.x,  y, { align: 'left' });
      pdoc.text(wgt.toFixed(2),                      COLS.wgt.x,  y);
      pdoc.text(vol.toFixed(2),                      COLS.vol.x,  y);

      // Description (truncated)
      const descText = (b.natureOfGoods || '—').substring(0, 18);
      pdoc.text(descText,                            COLS.desc.x, y);

      // Other info: agent + route
      const seg = (b.flightSegments || []).find(s => s.flightNumber === flightNumber && s.departureDate === departureDate);
      const route = seg ? `${seg.segmentOrigin || ''} ${seg.segmentOrigin || ''}-${seg.segmentDestination || ''}` : '';
      const otherText = (b.agent_details_name || '').substring(0, 8) + ' ' + route;
      pdoc.text(otherText.trim().substring(0, 22),   COLS.other.x, y);

      pdoc.text(b.selectedShcCode || '',             COLS.shc.x,  y);
      pdoc.text(b.bookingStatus || 'KK',             COLS.prio.x, y);

      y += LINE_H - 0.5;

      // Dimension lines
      if (dimLines.length > 0) {
        pdoc.setFontSize(6.5);
        pdoc.setTextColor(80, 80, 80);
        dimLines.forEach(d => {
          pdoc.text(`Dims: ${d.pieces} pc / ${d.length} x ${d.width} x ${d.height} CMT`, COLS.other.x, y);
          y += LINE_H - 1.5;
        });
      }

      // Handling / OSI notes
      if (b.handlingInformation?.trim()) {
        pdoc.setFontSize(6.5);
        pdoc.setFont('helvetica', 'italic');
        pdoc.setTextColor(60, 60, 60);
        const hLines = pdoc.splitTextToSize(b.handlingInformation.trim(), R - COLS.awb.x);
        pdoc.text(hLines[0], COLS.awb.x, y);
        y += LINE_H - 1;
        pdoc.setFont('helvetica', 'normal');
        pdoc.setTextColor(17, 24, 39);
      }
      if (b.osiGhaText?.trim()) {
        pdoc.setFontSize(6.5);
        pdoc.setFont('helvetica', 'bold');
        pdoc.setTextColor(80, 60, 0);
        const oLines = pdoc.splitTextToSize(b.osiGhaText.trim(), R - COLS.awb.x);
        pdoc.text(oLines[0], COLS.awb.x, y);
        y += LINE_H - 1;
        pdoc.setFont('helvetica', 'normal');
        pdoc.setTextColor(17, 24, 39);
      }

      y += 0.5;
    });

    // Destination subtotal
    checkPage(8);
    pdoc.setDrawColor(17, 24, 39);
    pdoc.setLineWidth(0.3);
    pdoc.line(L, y, R, y);
    y += 3;
    pdoc.setFont('helvetica', 'bold');
    pdoc.setFontSize(7.5);
    pdoc.text(`${dest} SubTotal:`,          COLS.awb.x,  y);
    pdoc.text(String(destPcs),              COLS.pcs.x,  y);
    pdoc.text(destWgt.toFixed(2),           COLS.wgt.x,  y);
    pdoc.text(destVol.toFixed(2),           COLS.vol.x,  y);
    y += LINE_H + 2;
  });

  // ── Grand total page ──
  checkPage(20);
  pdoc.setDrawColor(17, 24, 39);
  pdoc.setLineWidth(0.5);
  pdoc.line(L, y, R, y);
  y += 4;
  pdoc.setFont('helvetica', 'bold');
  pdoc.setFontSize(8);
  pdoc.text(`${destination} Total:`,        COLS.awb.x,  y);
  pdoc.text(String(grandPcs),              COLS.pcs.x,  y);
  pdoc.text(grandWgt.toFixed(2),           COLS.wgt.x,  y);
  pdoc.text(grandVol.toFixed(2),           COLS.vol.x,  y);
  pdoc.text(`Total No. of AWBs:   ${grandAwbs}`, COLS.other.x, y);

  // ── Fix page numbers (replace TOTAL with real count) ──
  const totalPgs = pdoc.internal.pages.length - 1;
  for (let p = 1; p <= totalPgs; p++) {
    pdoc.setPage(p);
    // Overwrite the placeholder with white rect, then write correct value
    pdoc.setFillColor(255, 255, 255);
    pdoc.rect(R - 30, 11, 22, 5, 'F');
    pdoc.setFont('helvetica', 'bold');
    pdoc.setFontSize(8);
    pdoc.setTextColor(60, 60, 60);
    pdoc.text(`${p}/${totalPgs}`, R - 30, 15);
  }

  // ── Save or return ──
  const origDest = `${origin}${destination}`.replace(/-/g, '');
  const filename = `FBL ${flightNumber}_${depDate} RTE ${origDest} VER.${dd2}${mon}${yy} ${timeStr}.pdf`;
  if (returnBase64) {
    return { base64: pdoc.output('datauristring').split(',')[1], filename };
  }
  pdoc.save(filename);
};

/* ──────────────────────────────────────────────────────────────
   CARGO SALES REPORT PDF  (landscape A4)
─────────────────────────────────────────────────────────────── */
export const generateCargoSalesReportPdf = (reportBookings, dateFrom, dateTo, agentProfiles = [], iataAirportCodes = [], companyInfo = {}) => {
  if (!reportBookings?.length) return;
  const { jsPDF } = window.jspdf;
  const pdoc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });

  const companyName = companyInfo.companyName || 'AcrossCargo';

  const firstBooking = reportBookings[0] || {};
  const getCity = (code) => iataAirportCodes.find(c => c.code === code)?.city || code || 'N/A';
  const station = firstBooking.origin ? `${firstBooking.origin} (${getCity(firstBooking.origin)})` : 'N/A';
  const airline = airlinePrefixData.find(a => a.prefix === firstBooking.awbInputPrefix);
  const carrierText = airline ? `${airline.name} (${firstBooking.awbInputPrefix})` : firstBooking.awbInputPrefix || 'N/A';

  const pageW = pdoc.internal.pageSize.getWidth();

  // Header
  pdoc.setFont('helvetica', 'bold');
  pdoc.setFontSize(20);
  pdoc.setTextColor(30, 58, 138);
  pdoc.text('CARGO SALES REPORT', pageW / 2, 20, { align: 'center' });

  pdoc.setFontSize(9);
  pdoc.setTextColor(75, 85, 99);
  pdoc.setFont('helvetica', 'normal');
  pdoc.text(`Carrier: ${carrierText}`, 20, 30);
  pdoc.text(`Station: ${station}`, 20, 35);
  pdoc.text(`Period: ${formatDateStr(dateFrom)} – ${formatDateStr(dateTo)}`, pageW - 20, 30, { align: 'right' });
  pdoc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageW - 20, 35, { align: 'right' });

  const tableBody = reportBookings.map(b => {
    const agent = agentProfiles.find(a => a.id === b.selectedAgentProfileId);
    const flight = b.flightSegments?.[0] || {};
    const otherTotal = (b.otherCharges || []).reduce((s, c) => s + (parseFloat(c.chargeAmount) || 0), 0);
    return [
      agent?.agentName || 'N/A',
      agent?.agentIataCassNumber || '',
      `${b.awbInputPrefix}-${b.awbInputNumber}`,
      formatDateStr(b.createdAt),
      flight.flightNumber || '',
      formatDateDDMMM(flight.departureDate),
      `${b.origin || ''}-${b.destination || ''}`,
      formatNumberWithSeparators(b.weightKg, 1),
      formatNumberWithSeparators(b.chargeableWeightKg, 1),
      formatNumberWithSeparators(b.ratePerKg, 2),
      formatNumberWithSeparators(b.freightCharges, 2),
      formatNumberWithSeparators(otherTotal, 2),
      formatNumberWithSeparators(b.totalCalculatedCharges, 2),
    ];
  });

  const totGross   = reportBookings.reduce((s, b) => s + (parseFloat(b.weightKg) || 0), 0);
  const totCharge  = reportBookings.reduce((s, b) => s + (parseFloat(b.chargeableWeightKg) || 0), 0);
  const totFreight = reportBookings.reduce((s, b) => s + (parseFloat(b.freightCharges) || 0), 0);
  const totOther   = reportBookings.reduce((s, b) => s + (b.otherCharges || []).reduce((ss, c) => ss + (parseFloat(c.chargeAmount) || 0), 0), 0);
  const totTotal   = reportBookings.reduce((s, b) => s + (parseFloat(b.totalCalculatedCharges) || 0), 0);

  pdoc.autoTable({
    startY: 42,
    head: [['Cargo Agent', 'IATA/CASS', 'AWB No.', 'Date', 'Flight', 'Flt Date', 'Route', 'Gross Wt', 'Chrg Wt', 'Rate', 'Freight', 'Other', 'Total']],
    body: tableBody,
    foot: [[
      { content: 'GRAND TOTAL', colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatNumberWithSeparators(totGross, 1), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatNumberWithSeparators(totCharge, 1), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: '', styles: {} },
      { content: formatNumberWithSeparators(totFreight, 2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatNumberWithSeparators(totOther, 2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatNumberWithSeparators(totTotal, 2), styles: { halign: 'right', fontStyle: 'bold' } },
    ]],
    theme: 'plain',
    styles: { fontSize: 7.5, cellPadding: 1.8, textColor: [55, 65, 81] },
    headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold', lineColor: [209, 213, 219], lineWidth: { bottom: 0.3 } },
    footStyles: { fillColor: [229, 231, 235], textColor: [17, 24, 39], fontStyle: 'bold', lineColor: [156, 163, 175], lineWidth: { top: 0.4 } },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: { 7: { halign: 'right' }, 8: { halign: 'right' }, 9: { halign: 'right' }, 10: { halign: 'right' }, 11: { halign: 'right' }, 12: { halign: 'right' } },
    didDrawPage: (data) => {
      pdoc.setFontSize(8);
      pdoc.setTextColor(180, 180, 180);
      pdoc.text(companyName, data.settings.margin.left, pdoc.internal.pageSize.height - 8);
      pdoc.text(`Page ${data.pageNumber}`, pageW - data.settings.margin.right, pdoc.internal.pageSize.height - 8, { align: 'right' });
    },
  });

  pdoc.save(`Cargo_Sales_Report_${dateFrom}_${dateTo}.pdf`);
};

/* ──────────────────────────────────────────────────────────────
   VERIFACTU QR helper
   Real Decreto 1007/2023 – generates a QR data URL using qrcodejs
─────────────────────────────────────────────────────────────── */
const buildVerifactuUrl = (nif, invoiceNum, dateStr, total) => {
  // dateStr expected as DD/MM/YYYY → convert to DD-MM-YYYY
  const fecha = dateStr.replace(/\//g, '-');
  const importe = parseFloat(total).toFixed(2);
  return `https://www2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=${nif}&numserie=${encodeURIComponent(invoiceNum)}&fecha=${fecha}&importe=${importe}`;
};

const getQrDataUrl = (text) => {
  if (!window.QRCode) return null;
  const container = document.createElement('div');
  container.style.cssText = 'position:absolute;top:-9999px;left:-9999px;visibility:hidden;';
  document.body.appendChild(container);
  try {
    new window.QRCode(container, {
      text,
      width: 160,
      height: 160,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: window.QRCode?.CorrectLevel?.M,
    });
    const canvas = container.querySelector('canvas');
    return canvas ? canvas.toDataURL('image/png') : null;
  } catch {
    return null;
  } finally {
    document.body.removeChild(container);
  }
};

/* ──────────────────────────────────────────────────────────────
   INVOICE PDF  (portrait A4)
─────────────────────────────────────────────────────────────── */
export const generateInvoicePdf = (agent, bookings, dateFrom, dateTo, { ivaRate = 0, bankDetails = {}, companyInfo = {} } = {}) => {
  if (!agent || !bookings?.length) return;
  const { jsPDF } = window.jspdf;
  const pdoc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = pdoc.internal.pageSize.getWidth();
  let y = 20;

  // Company identity from Firestore settings (no hardcoding)
  const companyName    = companyInfo.companyName    || 'AcrossCargo';
  const companyAddress = companyInfo.companyAddress || '';
  const companyCity    = companyInfo.companyCity    || '';
  const companyCif     = companyInfo.companyCif     || '';

  // Title
  pdoc.setFontSize(22);
  pdoc.setFont('helvetica', 'bold');
  pdoc.setTextColor(30, 58, 138);
  pdoc.text('INVOICE', pageW - 20, y, { align: 'right' });

  // Our company
  pdoc.setFontSize(9);
  pdoc.setFont('helvetica', 'normal');
  pdoc.setTextColor(55, 65, 81);
  [companyName, companyAddress, companyCity, companyCif ? `CIF: ${companyCif}` : ''].filter(Boolean).forEach(line => {
    pdoc.text(line, 20, y);
    y += 5;
  });
  y += 8;

  // Bill to + invoice details
  pdoc.setFontSize(10);
  pdoc.setFont('helvetica', 'bold');
  pdoc.setTextColor(17, 24, 39);
  pdoc.text('Bill To:', 20, y);
  pdoc.text('Details:', pageW / 2 + 20, y);
  y += 6;

  pdoc.setFontSize(9);
  const agentLines = [
    agent.agentName || 'N/A',
    ...(agent.agentAddress ? pdoc.splitTextToSize(agent.agentAddress, 75) : []),
    `${agent.agentCity || ''}, ${agent.agentCountryCode || ''}`.trim().replace(/^,\s*/, ''),
  ].filter(Boolean);

  pdoc.setFont('helvetica', 'normal');
  pdoc.text(agentLines, 20, y);

  const invNum = `INV-${agent.agentId || 'X'}-${Date.now()}`;
  const detailsStartY = y;
  [
    ['Invoice #:', invNum],
    ['Date:', new Date().toLocaleDateString('en-GB')],
    ['Period:', `${formatDateStr(dateFrom)} – ${formatDateStr(dateTo)}`],
  ].forEach(([label, val]) => {
    pdoc.setFont('helvetica', 'bold');
    pdoc.text(label, pageW / 2 + 20, y);
    pdoc.setFont('helvetica', 'normal');
    pdoc.text(val, pageW / 2 + 45, y);
    y += 6;
  });

  y = Math.max(detailsStartY + agentLines.length * 5, y) + 10;

  const otherTotal = (b) => (b.otherCharges || []).reduce((s, c) => s + (parseFloat(c.chargeAmount) || 0), 0);
  const tableBody = bookings.map(b => [
    b.awb, formatDateStr(b.createdAt), `${b.origin}-${b.destination}`,
    formatNumberWithSeparators(b.chargeableWeightKg, 1),
    formatNumberWithSeparators(b.freightCharges, 2),
    formatNumberWithSeparators(otherTotal(b), 2),
    formatNumberWithSeparators(b.totalCalculatedCharges, 2),
  ]);

  const totFreight = bookings.reduce((s, b) => s + (parseFloat(b.freightCharges) || 0), 0);
  const totOther   = bookings.reduce((s, b) => s + otherTotal(b), 0);
  const grandTotal = bookings.reduce((s, b) => s + (parseFloat(b.totalCalculatedCharges) || 0), 0);

  pdoc.autoTable({
    startY: y,
    head: [['AWB', 'Date', 'Route', 'Chg.Wt', 'Freight', 'Other', 'Total']],
    body: tableBody,
    foot: [[
      { content: '', colSpan: 4, styles: { fillColor: [229, 231, 235] } },
      { content: formatNumberWithSeparators(totFreight, 2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatNumberWithSeparators(totOther, 2), styles: { halign: 'right', fontStyle: 'bold' } },
      { content: formatNumberWithSeparators(grandTotal, 2), styles: { halign: 'right', fontStyle: 'bold' } },
    ]],
    theme: 'grid',
    headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold', lineColor: [209, 213, 219], lineWidth: 0.2 },
    footStyles: { fillColor: [229, 231, 235], textColor: [17, 24, 39], fontStyle: 'bold', lineColor: [156, 163, 175], lineWidth: { top: 0.4 } },
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [55, 65, 81] },
    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
  });

  y = pdoc.lastAutoTable.finalY + 10;
  const currency = bookings[0]?.currency || 'EUR';
  const ivaAmount  = grandTotal * (ivaRate / 100);
  const totalWithIva = grandTotal + ivaAmount;

  // Totals block (right-aligned)
  pdoc.setFontSize(9);
  pdoc.setFont('helvetica', 'normal');
  pdoc.setTextColor(107, 114, 128);
  pdoc.text('Subtotal:', pageW - 70, y);
  pdoc.text(`${currency} ${formatNumberWithSeparators(grandTotal, 2)}`, pageW - 20, y, { align: 'right' });
  y += 6;

  if (ivaRate > 0) {
    pdoc.text(`IVA ${ivaRate}%:`, pageW - 70, y);
    pdoc.text(`${currency} ${formatNumberWithSeparators(ivaAmount, 2)}`, pageW - 20, y, { align: 'right' });
    y += 6;
    // Divider line
    pdoc.setDrawColor(209, 213, 219);
    pdoc.line(pageW - 80, y - 1, pageW - 20, y - 1);
    y += 3;
  }

  pdoc.setFontSize(13);
  pdoc.setFont('helvetica', 'bold');
  pdoc.setTextColor(17, 24, 39);
  pdoc.text(`TOTAL: ${currency} ${formatNumberWithSeparators(totalWithIva, 2)}`, pageW - 20, y, { align: 'right' });
  y += 14;

  pdoc.setFontSize(9);
  pdoc.setFont('helvetica', 'normal');
  pdoc.setTextColor(107, 114, 128);
  pdoc.text('Payment due within 30 days. Thank you for your business.', 20, y);
  y += 10;

  // Bank transfer details
  const { holder, bank, iban, bic } = bankDetails || {};
  if (iban || bank) {
    pdoc.setDrawColor(209, 213, 219);
    pdoc.line(20, y, pageW - 20, y);
    y += 6;
    pdoc.setFontSize(9);
    pdoc.setFont('helvetica', 'bold');
    pdoc.setTextColor(17, 24, 39);
    pdoc.text('Bank Transfer Details', 20, y);
    y += 5;
    pdoc.setFont('helvetica', 'normal');
    pdoc.setTextColor(55, 65, 81);
    const bankLines = [
      holder && `Account holder: ${holder}`,
      bank   && `Bank: ${bank}`,
      iban   && `IBAN: ${iban}`,
      bic    && `BIC/SWIFT: ${bic}`,
    ].filter(Boolean);
    bankLines.forEach(line => {
      pdoc.text(line, 20, y);
      y += 5;
    });
    y += 4;
  }
  y += 4;

  // ── Verifactu QR (Real Decreto 1007/2023) ──────────────────
  const COMPANY_NIF  = companyCif || '';                  // CIF desde Firestore
  const invoiceDate  = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
  const verifactuUrl = buildVerifactuUrl(COMPANY_NIF, invNum, invoiceDate, grandTotal);
  const qrImg        = getQrDataUrl(verifactuUrl);

  const QR_SIZE = 28; // mm
  if (qrImg) {
    pdoc.addImage(qrImg, 'PNG', 20, y, QR_SIZE, QR_SIZE);
    pdoc.setFontSize(7);
    pdoc.setFont('helvetica', 'bold');
    pdoc.setTextColor(55, 65, 81);
    pdoc.text('Verifactu', 20 + QR_SIZE / 2, y + QR_SIZE + 3, { align: 'center' });
    pdoc.setFont('helvetica', 'normal');
    pdoc.setFontSize(6);
    pdoc.setTextColor(107, 114, 128);
    pdoc.text('Real Decreto 1007/2023', 20 + QR_SIZE / 2, y + QR_SIZE + 6.5, { align: 'center' });
    // Also print the URL in tiny font so inspectors can verify manually
    const urlLines = pdoc.splitTextToSize(verifactuUrl, pageW - 20 - (20 + QR_SIZE + 4));
    pdoc.text(urlLines, 20 + QR_SIZE + 4, y + 4);
  }

  pdoc.save(`Invoice_${(agent.agentName || 'Agent').replace(/\s+/g,'_')}_${dateFrom}_${dateTo}.pdf`);
};
