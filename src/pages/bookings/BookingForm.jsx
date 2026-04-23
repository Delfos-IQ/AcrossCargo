import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, doc, query, where, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase.js';
import { useAppContext } from '../../context/AppContext.jsx';
import {
  airlinePrefixData, iataNatureOfGoodsData, iataOtherChargeCodes,
  shcCodeData, paymentTypes, bookingStatusOptions, twoLetterAirlineCodes,
} from '../../data/index.js';
import {
  generateUniqueId, calculateAwbCount, getNextAwbSerial, isSerialLTE,
  calculateVolumeM3, calculateChargeableWeight, getRateForBooking, validateBookingData,
  formatNumberWithSeparators,
} from '../../utils/index.js';
import toast from 'react-hot-toast';

/* ─── Estado inicial del formulario ─── */
const INITIAL_FORM = {
  awbInputPrefix: '', awbInputNumber: '',
  origin: '', destination: '',
  pieces: '', weightKg: '',
  natureOfGoods: '', natureOfGoodsCustom: '',
  selectedShcCode: '',
  flightSegments: [],
  dimensionLines: [],
  selectedShipperProfileId: '', shipperName: '', shipperStreet: '',
  shipperCity: '', shipperZip: '', shipperCountry: '', shipperContact: '',
  selectedConsigneeProfileId: '', consigneeName: '', consigneeStreet: '',
  consigneeCity: '', consigneeZip: '', consigneeCountry: '', consigneeContact: '',
  selectedAgentProfileId: '', agentNameDisplay: '', agentCassDisplay: '',
  agentIdInput: '', agentAddressDisplay: '', agentCityForFFR: '',
  currency: 'EUR', ratePerKg: '0.00', isRateOverridden: false,
  otherCharges: [],
  paymentType: 'PPD', ffrReference: '', handlingInformation: '',
  osiGhaText: 'GHA: ', ffrRemarks: '', bookingStatus: 'NN', isFlown: false,
};

/* ─── Componente principal ─── */
export default function BookingForm({ onSuccess }) {
  const {
    currentUserProfile, agentProfiles, shipperProfiles, consigneeProfiles,
    flightSchedules, iataAirportCodes, awbStockAllocations, rateTableEntries,
  } = useAppContext();

  const [form, setForm] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Derived display values ── */
  const [displayChargeableWeightKg, setDisplayChargeableWeightKg] = useState('0.0');
  const [displayVolumeM3, setDisplayVolumeM3] = useState('0.000');
  const [displayFreightCharges, setDisplayFreightCharges] = useState('0.00');
  const [displayTotalCharges, setDisplayTotalCharges] = useState('0.00');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target?.value ?? e }));

  /* ── Cálculos automáticos ── */
  useEffect(() => {
    const vol = calculateVolumeM3(form.dimensionLines);
    const chg = calculateChargeableWeight(parseFloat(form.weightKg) || 0, vol);
    setDisplayVolumeM3(vol.toFixed(3));
    setDisplayChargeableWeightKg(chg.toFixed(1));

    const rateTable = rateTableEntries?.filter(r => r.agentProfileId === form.selectedAgentProfileId) || [];
    const rate = form.isRateOverridden
      ? parseFloat(form.ratePerKg) || 0
      : getRateForBooking(form.origin, form.destination, form.currency, chg, rateTable);

    if (!form.isRateOverridden) setForm(f => ({ ...f, ratePerKg: rate.toFixed(2) }));

    const freight = chg * (parseFloat(form.isRateOverridden ? form.ratePerKg : rate) || 0);
    setDisplayFreightCharges(freight.toFixed(2));

    const otherTotal = (form.otherCharges || []).reduce((s, c) => s + (parseFloat(c.chargeAmount) || 0), 0);
    setDisplayTotalCharges((freight + otherTotal).toFixed(2));
  }, [form.weightKg, form.dimensionLines, form.origin, form.destination, form.currency,
      form.ratePerKg, form.isRateOverridden, form.otherCharges, form.selectedAgentProfileId, rateTableEntries]);

  /* ── Seleccionar agente → auto-asignar AWB ── */
  const handleAgentSelect = useCallback((agentId) => {
    const profile = agentProfiles?.find(p => p.id === agentId);
    if (!profile) {
      setForm(f => ({ ...f, selectedAgentProfileId: '', agentNameDisplay: '', agentCassDisplay: '', agentIdInput: '', agentAddressDisplay: '', agentCityForFFR: '', awbInputPrefix: '', awbInputNumber: '' }));
      return;
    }
    const updates = {
      selectedAgentProfileId: agentId,
      agentNameDisplay: profile.agentName,
      agentCassDisplay: profile.agentIataCassNumber || '',
      agentIdInput: profile.agentId || '',
      agentAddressDisplay: profile.agentAddress || '',
      agentCityForFFR: profile.agentCity || '',
    };
    // Auto-assign next available AWB
    const allocs = (awbStockAllocations || [])
      .filter(a => a.agentProfileId === agentId)
      .sort((a, b) => a.startNumber.localeCompare(b.startNumber));
    let found = false;
    for (const alloc of allocs) {
      let serial = alloc.startNumber;
      const max = calculateAwbCount(alloc.startNumber, alloc.endNumber);
      for (let i = 0; i < max; i++) {
        if (!(alloc.usedAwbs || []).includes(serial)) {
          updates.awbInputPrefix = alloc.prefix;
          updates.awbInputNumber = serial;
          found = true;
          break;
        }
        const next = getNextAwbSerial(serial);
        if (!next) break;
        serial = next;
      }
      if (found) break;
    }
    if (!found) {
      updates.awbInputPrefix = '';
      updates.awbInputNumber = '';
      setFormError(`No hay AWBs disponibles en stock para el agente ${profile.agentName}.`);
    }
    setForm(f => ({ ...f, ...updates }));
  }, [agentProfiles, awbStockAllocations]);

  /* ── Seleccionar shipper ── */
  const handleShipperSelect = (id) => {
    const p = shipperProfiles?.find(s => s.id === id);
    if (!p) { setForm(f => ({ ...f, selectedShipperProfileId: '' })); return; }
    setForm(f => ({
      ...f,
      selectedShipperProfileId: id,
      shipperName: p.shipperName || '', shipperStreet: p.shipperStreet || '',
      shipperCity: p.shipperCity || '', shipperZip: p.shipperZip || '',
      shipperCountry: p.shipperCountry || '', shipperContact: p.shipperPhone || '',
    }));
  };

  /* ── Seleccionar consignee ── */
  const handleConsigneeSelect = (id) => {
    const p = consigneeProfiles?.find(c => c.id === id);
    if (!p) { setForm(f => ({ ...f, selectedConsigneeProfileId: '' })); return; }
    setForm(f => ({
      ...f,
      selectedConsigneeProfileId: id,
      consigneeName: p.consigneeName || '', consigneeStreet: p.consigneeStreet || '',
      consigneeCity: p.consigneeCity || '', consigneeZip: p.consigneeZip || '',
      consigneeCountry: p.consigneeCountry || '', consigneeContact: p.consigneePhone || '',
    }));
  };

  /* ── Flight segments ── */
  const addFlight = () => setForm(f => ({
    ...f, flightSegments: [...f.flightSegments, { id: generateUniqueId(), flightScheduleId: '', flightNumber: '', departureDate: '', segmentOrigin: '', segmentDestination: '', carrierCode: '' }]
  }));
  const removeFlight = (id) => setForm(f => ({ ...f, flightSegments: f.flightSegments.filter(s => s.id !== id) }));
  const updateFlight = (id, field, value) => setForm(f => ({
    ...f, flightSegments: f.flightSegments.map(s => {
      if (s.id !== id) return s;
      if (field === 'flightScheduleId') {
        const sched = flightSchedules?.find(fs => fs.id === value);
        return sched
          ? { ...s, flightScheduleId: value, flightNumber: sched.flightNumber, segmentOrigin: sched.origin, segmentDestination: sched.destination, carrierCode: sched.carrierCode }
          : { ...s, flightScheduleId: '', flightNumber: '', segmentOrigin: '', segmentDestination: '', carrierCode: '' };
      }
      return { ...s, [field]: value };
    })
  }));

  /* ── Dimension lines ── */
  const addDim = () => setForm(f => ({ ...f, dimensionLines: [...f.dimensionLines, { id: generateUniqueId(), pieces: '', length: '', width: '', height: '' }] }));
  const removeDim = (id) => setForm(f => ({ ...f, dimensionLines: f.dimensionLines.filter(d => d.id !== id) }));
  const updateDim = (id, field, value) => setForm(f => ({ ...f, dimensionLines: f.dimensionLines.map(d => d.id === id ? { ...d, [field]: value } : d) }));

  /* ── Other charges ── */
  const addCharge = () => setForm(f => ({ ...f, otherCharges: [...f.otherCharges, { id: generateUniqueId(), chargeCode: '', chargeDescription: '', chargeAmount: '' }] }));
  const removeCharge = (id) => setForm(f => ({ ...f, otherCharges: f.otherCharges.filter(c => c.id !== id) }));
  const updateCharge = (id, field, value) => setForm(f => ({
    ...f, otherCharges: f.otherCharges.map(c => {
      if (c.id !== id) return c;
      const updated = { ...c, [field]: value };
      if (field === 'chargeCode') {
        const pre = iataOtherChargeCodes.find(x => x.code === value);
        updated.chargeDescription = pre ? pre.description : '';
      }
      return updated;
    })
  }));

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setFormError(null);

    const finalNog = form.natureOfGoods === 'OTH' ? form.natureOfGoodsCustom?.trim() : form.natureOfGoods;
    if (!finalNog) { setFormError('Indica la naturaleza de la mercancía.'); return; }

    const data = {
      awbInputPrefix: form.awbInputPrefix,
      awbInputNumber: form.awbInputNumber,
      awb: `${form.awbInputPrefix}-${form.awbInputNumber}`,
      origin: form.origin, destination: form.destination,
      pieces: form.pieces, weightKg: form.weightKg,
      chargeableWeightKg: displayChargeableWeightKg,
      volumeM3: displayVolumeM3,
      natureOfGoods: finalNog, selectedShcCode: form.selectedShcCode,
      flightSegments: form.flightSegments, dimensionLines: form.dimensionLines,
      selectedShipperProfileId: form.selectedShipperProfileId,
      shipperName: form.shipperName, shipperStreet: form.shipperStreet,
      shipperCity: form.shipperCity, shipperZip: form.shipperZip,
      shipperCountry: form.shipperCountry, shipperContact: form.shipperContact,
      selectedConsigneeProfileId: form.selectedConsigneeProfileId,
      consigneeName: form.consigneeName, consigneeStreet: form.consigneeStreet,
      consigneeCity: form.consigneeCity, consigneeZip: form.consigneeZip,
      consigneeCountry: form.consigneeCountry, consigneeContact: form.consigneeContact,
      selectedAgentProfileId: form.selectedAgentProfileId,
      agent_details_name: form.agentNameDisplay,
      agentIataCassNumber: form.agentCassDisplay,
      agent_id: form.agentIdInput,
      agentAddress: form.agentAddressDisplay,
      agentCity: form.agentCityForFFR,
      currency: form.currency, ratePerKg: form.ratePerKg,
      isRateOverridden: form.isRateOverridden,
      freightCharges: displayFreightCharges,
      otherCharges: form.otherCharges,
      totalCalculatedCharges: displayTotalCharges,
      paymentType: form.paymentType,
      ffrReference: form.ffrReference,
      handlingInformation: form.handlingInformation,
      osiGhaText: form.osiGhaText,
      ffrRemarks: form.ffrRemarks,
      bookingStatus: form.bookingStatus,
      isFlown: form.isFlown,
      createdAt: serverTimestamp(),
      createdBy: currentUserProfile?.email || 'unknown',
    };

    const validationError = validateBookingData(data);
    if (validationError) { setFormError(validationError); return; }

    setIsSubmitting(true);
    try {
      const allocQuery = query(
        collection(db, 'awbStockAllocations'),
        where('prefix', '==', data.awbInputPrefix),
        where('agentProfileId', '==', data.selectedAgentProfileId)
      );
      const allocSnap = await getDocs(allocQuery);
      let allocId = null, currentUsedAwbs = [];
      allocSnap.forEach(d => {
        const a = d.data();
        if (isSerialLTE(a.startNumber, data.awbInputNumber) && isSerialLTE(data.awbInputNumber, a.endNumber)) {
          allocId = d.id;
          currentUsedAwbs = a.usedAwbs || [];
        }
      });
      if (!allocId) throw new Error('No se encontró una asignación AWB válida para este agente.');

      await runTransaction(db, async (tx) => {
        const awbUsageRef = doc(db, 'awbUsage', data.awb);
        const awbUsageDoc = await tx.get(awbUsageRef);
        if (awbUsageDoc.exists()) throw new Error(`El AWB ${data.awb} ya ha sido utilizado.`);
        const updatedUsed = [...currentUsedAwbs];
        if (!updatedUsed.includes(data.awbInputNumber)) updatedUsed.push(data.awbInputNumber);
        const newRef = doc(collection(db, 'bookings'));
        tx.set(newRef, data);
        tx.update(doc(db, 'awbStockAllocations', allocId), { usedAwbs: updatedUsed });
        tx.set(awbUsageRef, { bookingId: newRef.id });
      });

      toast.success('Booking creado correctamente.');
      setForm(INITIAL_FORM);
      setFormError(null);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      setFormError(err.message);
      toast.error('Error al crear el booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Airports list ── */
  const airports = useMemo(() => {
    const managed = (iataAirportCodes || []).map(a => ({ code: a.code, label: `${a.code} — ${a.cityName || a.code}` }));
    if (managed.length) return managed;
    return [];
  }, [iataAirportCodes]);

  const S = { // section style
    marginBottom: 'var(--space-6)',
  };

  return (
    <form onSubmit={handleSubmit}>
      {formError && (
        <div style={{
          background: 'var(--color-danger-bg)', border: '1px solid var(--color-danger-border)',
          color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          fontSize: 'var(--font-size-sm)',
        }}>
          {formError}
        </div>
      )}

      {/* ── 1. AWB & AGENTE ── */}
      <div className="card" style={S}>
        <div className="card-header"><span className="card-title">AWB & Agente</span></div>
        <div className="card-body">
          <div className="form-grid form-grid-3">
            <div className="form-group">
              <label className="form-label required">Agente</label>
              <select className="form-select" value={form.selectedAgentProfileId} onChange={e => handleAgentSelect(e.target.value)}>
                <option value="">Seleccionar agente…</option>
                {(agentProfiles || []).map(a => <option key={a.id} value={a.id}>{a.agentName}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label required">Prefijo AWB</label>
              <input className="form-input font-mono" value={form.awbInputPrefix} onChange={set('awbInputPrefix')} placeholder="180" />
            </div>
            <div className="form-group">
              <label className="form-label required">Número AWB</label>
              <input className="form-input font-mono" value={form.awbInputNumber} onChange={set('awbInputNumber')} placeholder="00000000" />
            </div>
          </div>
          {form.agentNameDisplay && (
            <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <span className="badge badge-blue">{form.agentNameDisplay}</span>
              {form.agentCassDisplay && <span className="badge badge-gray">CASS: {form.agentCassDisplay}</span>}
              {form.agentAddressDisplay && <span className="badge badge-gray">{form.agentAddressDisplay}</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. RUTA ── */}
      <div className="card" style={S}>
        <div className="card-header"><span className="card-title">Ruta</span></div>
        <div className="card-body">
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label required">Origen (IATA)</label>
              {airports.length > 0 ? (
                <select className="form-select" value={form.origin} onChange={set('origin')}>
                  <option value="">Seleccionar origen…</option>
                  {airports.map(a => <option key={a.code} value={a.code}>{a.label}</option>)}
                </select>
              ) : (
                <input className="form-input" value={form.origin} onChange={set('origin')} placeholder="MAD" maxLength={3} style={{ textTransform: 'uppercase' }} />
              )}
            </div>
            <div className="form-group">
              <label className="form-label required">Destino (IATA)</label>
              {airports.length > 0 ? (
                <select className="form-select" value={form.destination} onChange={set('destination')}>
                  <option value="">Seleccionar destino…</option>
                  {airports.map(a => <option key={a.code} value={a.code}>{a.label}</option>)}
                </select>
              ) : (
                <input className="form-input" value={form.destination} onChange={set('destination')} placeholder="JFK" maxLength={3} style={{ textTransform: 'uppercase' }} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. MERCANCÍA ── */}
      <div className="card" style={S}>
        <div className="card-header"><span className="card-title">Mercancía</span></div>
        <div className="card-body">
          <div className="form-grid form-grid-4">
            <div className="form-group">
              <label className="form-label required">Bultos (pcs)</label>
              <input type="number" className="form-input" value={form.pieces} onChange={set('pieces')} placeholder="0" min="1" />
            </div>
            <div className="form-group">
              <label className="form-label required">Peso real (kg)</label>
              <input type="number" className="form-input" value={form.weightKg} onChange={set('weightKg')} placeholder="0.0" step="0.1" />
            </div>
            <div className="form-group">
              <label className="form-label">Volumen (m³)</label>
              <input className="form-input" value={displayVolumeM3} readOnly style={{ background: 'var(--color-gray-50)', color: 'var(--color-gray-500)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Peso cobrable (kg)</label>
              <input className="form-input" value={displayChargeableWeightKg} readOnly style={{ background: 'var(--color-gray-50)', color: 'var(--color-gray-500)' }} />
            </div>
          </div>
          <div className="form-grid form-grid-2" style={{ marginTop: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label required">Naturaleza de la mercancía</label>
              <select className="form-select" value={iataNatureOfGoodsData.some(n => n.description === form.natureOfGoods) ? iataNatureOfGoodsData.find(n => n.description === form.natureOfGoods)?.code : (form.natureOfGoods ? 'OTH' : '')}
                onChange={e => {
                  const item = iataNatureOfGoodsData.find(n => n.code === e.target.value);
                  setForm(f => ({ ...f, natureOfGoods: item ? item.description : 'OTH', natureOfGoodsCustom: '' }));
                }}>
                <option value="">Seleccionar…</option>
                {iataNatureOfGoodsData.map(n => <option key={n.code} value={n.code}>{n.description}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Código SHC</label>
              <select className="form-select" value={form.selectedShcCode} onChange={set('selectedShcCode')}>
                <option value="">Sin SHC</option>
                {shcCodeData.map(s => <option key={s.code} value={s.code}>{s.code} — {s.description}</option>)}
              </select>
            </div>
          </div>
          {(form.natureOfGoods === 'OTH' || !iataNatureOfGoodsData.some(n => n.description === form.natureOfGoods)) && form.natureOfGoods && (
            <div className="form-group" style={{ marginTop: 'var(--space-3)' }}>
              <label className="form-label required">Especificar mercancía</label>
              <input className="form-input" value={form.natureOfGoodsCustom} onChange={set('natureOfGoodsCustom')} placeholder="Describe la mercancía…" />
            </div>
          )}
        </div>
      </div>

      {/* ── 4. DIMENSIONES ── */}
      <div className="card" style={S}>
        <div className="card-header">
          <span className="card-title">Dimensiones</span>
          <button type="button" className="button button-secondary button-sm" onClick={addDim}>+ Añadir línea</button>
        </div>
        <div className="card-body">
          {form.dimensionLines.length === 0 ? (
            <p style={{ color: 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)' }}>Sin dimensiones añadidas. El volumen se calculará automáticamente.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {form.dimensionLines.map((d, i) => (
                <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 'var(--space-2)', alignItems: 'center' }}>
                  <input className="form-input" value={d.pieces} onChange={e => updateDim(d.id, 'pieces', e.target.value)} placeholder="Bultos" type="number" min="1" />
                  <input className="form-input" value={d.length} onChange={e => updateDim(d.id, 'length', e.target.value)} placeholder="Largo (cm)" type="number" />
                  <input className="form-input" value={d.width} onChange={e => updateDim(d.id, 'width', e.target.value)} placeholder="Ancho (cm)" type="number" />
                  <input className="form-input" value={d.height} onChange={e => updateDim(d.id, 'height', e.target.value)} placeholder="Alto (cm)" type="number" />
                  <button type="button" className="button button-danger button-sm button-icon" onClick={() => removeDim(d.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 5. VUELOS ── */}
      <div className="card" style={S}>
        <div className="card-header">
          <span className="card-title">Segmentos de vuelo</span>
          <button type="button" className="button button-secondary button-sm" onClick={addFlight}>+ Añadir vuelo</button>
        </div>
        <div className="card-body">
          {form.flightSegments.length === 0 ? (
            <p style={{ color: 'var(--color-gray-400)', fontSize: 'var(--font-size-sm)' }}>Sin vuelos añadidos.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {form.flightSegments.map((seg, i) => (
                <div key={seg.id} style={{ background: 'var(--color-gray-50)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-size-xs)', color: 'var(--color-gray-600)' }}>SEGMENTO {i + 1}</span>
                    <button type="button" className="button button-danger button-sm" onClick={() => removeFlight(seg.id)}>Eliminar</button>
                  </div>
                  <div className="form-grid form-grid-3">
                    <div className="form-group">
                      <label className="form-label">Vuelo programado</label>
                      <select className="form-select" value={seg.flightScheduleId} onChange={e => updateFlight(seg.id, 'flightScheduleId', e.target.value)}>
                        <option value="">Manual…</option>
                        {(flightSchedules || []).map(fs => <option key={fs.id} value={fs.id}>{fs.flightNumber} — {fs.origin}→{fs.destination}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Número de vuelo</label>
                      <input className="form-input" value={seg.flightNumber} onChange={e => updateFlight(seg.id, 'flightNumber', e.target.value.toUpperCase())} placeholder="IB6251" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Fecha salida</label>
                      <input type="date" className="form-input" value={seg.departureDate} onChange={e => updateFlight(seg.id, 'departureDate', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Origen</label>
                      <input className="form-input" value={seg.segmentOrigin} onChange={e => updateFlight(seg.id, 'segmentOrigin', e.target.value.toUpperCase())} placeholder="MAD" maxLength={3} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Destino</label>
                      <input className="form-input" value={seg.segmentDestination} onChange={e => updateFlight(seg.id, 'segmentDestination', e.target.value.toUpperCase())} placeholder="JFK" maxLength={3} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Carrier</label>
                      <input className="form-input" value={seg.carrierCode} onChange={e => updateFlight(seg.id, 'carrierCode', e.target.value.toUpperCase())} placeholder="IB" maxLength={2} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 6. SHIPPER ── */}
      <div className="card" style={S}>
        <div className="card-header"><span className="card-title">Shipper (Expedidor)</span></div>
        <div className="card-body">
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">Cargar desde perfil</label>
            <select className="form-select" value={form.selectedShipperProfileId} onChange={e => handleShipperSelect(e.target.value)}>
              <option value="">Entrada manual…</option>
              {(shipperProfiles || []).map(s => <option key={s.id} value={s.id}>{s.shipperName}</option>)}
            </select>
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label required">Nombre</label>
              <input className="form-input" value={form.shipperName} onChange={set('shipperName')} />
            </div>
            <div className="form-group">
              <label className="form-label">Contacto</label>
              <input className="form-input" value={form.shipperContact} onChange={set('shipperContact')} />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input className="form-input" value={form.shipperStreet} onChange={set('shipperStreet')} />
            </div>
            <div className="form-group">
              <label className="form-label">Ciudad</label>
              <input className="form-input" value={form.shipperCity} onChange={set('shipperCity')} />
            </div>
            <div className="form-group">
              <label className="form-label">CP</label>
              <input className="form-input" value={form.shipperZip} onChange={set('shipperZip')} />
            </div>
            <div className="form-group">
              <label className="form-label">País</label>
              <input className="form-input" value={form.shipperCountry} onChange={set('shipperCountry')} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 7. CONSIGNEE ── */}
      <div className="card" style={S}>
        <div className="card-header"><span className="card-title">Consignee (Destinatario)</span></div>
        <div className="card-body">
          <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="form-label">Cargar desde perfil</label>
            <select className="form-select" value={form.selectedConsigneeProfileId} onChange={e => handleConsigneeSelect(e.target.value)}>
              <option value="">Entrada manual…</option>
              {(consigneeProfiles || []).map(c => <option key={c.id} value={c.id}>{c.consigneeName}</option>)}
            </select>
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label required">Nombre</label>
              <input className="form-input" value={form.consigneeName} onChange={set('consigneeName')} />
            </div>
            <div className="form-group">
              <label className="form-label">Contacto</label>
              <input className="form-input" value={form.consigneeContact} onChange={set('consigneeContact')} />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección</label>
              <input className="form-input" value={form.consigneeStreet} onChange={set('consigneeStreet')} />
            </div>
            <div className="form-group">
              <label className="form-label">Ciudad</label>
              <input className="form-input" value={form.consigneeCity} onChange={set('consigneeCity')} />
            </div>
            <div className="form-group">
              <label className="form-label">CP</label>
              <input className="form-input" value={form.consigneeZip} onChange={set('consigneeZip')} />
            </div>
            <div className="form-group">
              <label className="form-label">País</label>
              <input className="form-input" value={form.consigneeCountry} onChange={set('consigneeCountry')} />
            </div>
          </div>
        </div>
      </div>

      {/* ── 8. TARIFAS & CARGOS ── */}
      <div className="card" style={S}>
        <div className="card-header"><span className="card-title">Tarifas & Cargos</span></div>
        <div className="card-body">
          <div className="form-grid form-grid-4" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Divisa</label>
              <select className="form-select" value={form.currency} onChange={set('currency')}>
                {['EUR','USD','GBP','CHF','AED','SAR'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tarifa/kg</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input type="number" className="form-input" value={form.ratePerKg} onChange={e => setForm(f => ({ ...f, ratePerKg: e.target.value, isRateOverridden: true }))} step="0.01" />
                {form.isRateOverridden && (
                  <button type="button" className="button button-ghost button-sm" title="Restablecer tarifa automática" onClick={() => setForm(f => ({ ...f, isRateOverridden: false }))}>↺</button>
                )}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Flete</label>
              <input className="form-input" value={`${form.currency} ${displayFreightCharges}`} readOnly style={{ background: 'var(--color-gray-50)', fontWeight: 600 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Total</label>
              <input className="form-input" value={`${form.currency} ${displayTotalCharges}`} readOnly style={{ background: 'var(--color-primary-50)', fontWeight: 700, color: 'var(--color-primary-700)' }} />
            </div>
          </div>

          {/* Other charges */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-700)' }}>Otros cargos</span>
              <button type="button" className="button button-secondary button-sm" onClick={addCharge}>+ Añadir cargo</button>
            </div>
            {form.otherCharges.map(c => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr auto', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                <select className="form-select" value={c.chargeCode} onChange={e => updateCharge(c.id, 'chargeCode', e.target.value)}>
                  <option value="">Código…</option>
                  {iataOtherChargeCodes.map(x => <option key={x.code} value={x.code}>{x.code}</option>)}
                </select>
                <input className="form-input" value={c.chargeDescription} onChange={e => updateCharge(c.id, 'chargeDescription', e.target.value)} placeholder="Descripción" />
                <input type="number" className="form-input" value={c.chargeAmount} onChange={e => updateCharge(c.id, 'chargeAmount', e.target.value)} placeholder="0.00" step="0.01" />
                <button type="button" className="button button-danger button-sm button-icon" onClick={() => removeCharge(c.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 9. INFO ADICIONAL ── */}
      <div className="card" style={S}>
        <div className="card-header"><span className="card-title">Información adicional</span></div>
        <div className="card-body">
          <div className="form-grid form-grid-3" style={{ marginBottom: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Tipo de pago</label>
              <select className="form-select" value={form.paymentType} onChange={set('paymentType')}>
                {paymentTypes.map(p => <option key={p.code} value={p.code}>{p.code} — {p.description}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Estado del booking</label>
              <select className="form-select" value={form.bookingStatus} onChange={set('bookingStatus')}>
                {bookingStatusOptions.map(s => <option key={s.code} value={s.code}>{s.code} — {s.description}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Referencia FFR</label>
              <input className="form-input" value={form.ffrReference} onChange={set('ffrReference')} />
            </div>
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Instrucciones de manejo</label>
              <textarea className="form-textarea" value={form.handlingInformation} onChange={set('handlingInformation')} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label">OSI / GHA</label>
              <textarea className="form-textarea" value={form.osiGhaText} onChange={set('osiGhaText')} rows={2} />
            </div>
            <div className="form-group">
              <label className="form-label">Observaciones FFR</label>
              <textarea className="form-textarea" value={form.ffrRemarks} onChange={set('ffrRemarks')} rows={2} />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', paddingTop: 'var(--space-6)' }}>
              <input type="checkbox" id="isFlown" checked={form.isFlown} onChange={e => setForm(f => ({ ...f, isFlown: e.target.checked }))} style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label htmlFor="isFlown" style={{ fontWeight: 500, color: 'var(--color-gray-700)', cursor: 'pointer' }}>Mercancía volada (isFlown)</label>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUBMIT ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', paddingBottom: 'var(--space-8)' }}>
        <button type="button" className="button button-secondary" onClick={() => { setForm(INITIAL_FORM); setFormError(null); }}>
          Limpiar formulario
        </button>
        <button type="submit" className="button button-primary button-lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Guardando…
            </span>
          ) : 'Crear Booking'}
        </button>
      </div>
    </form>
  );
}
