export const iataNatureOfGoodsData = [
  { code: "AVI", description: "Live Animals" },
  { code: "PER", description: "Perishable Goods" },
  { code: "DGR", description: "Dangerous Goods" },
  { code: "VAL", description: "Valuable Cargo" },
  { code: "GEN", description: "General Cargo" },
  { code: "HUM", description: "Human Remains" },
  { code: "COL", description: "Coldbox / Temperature Controlled Goods" },
  { code: "FRO", description: "Frozen Goods" },
  { code: "EAT", description: "Edible Articles" },
  { code: "HEA", description: "Health and Medical Supplies" },
  { code: "EEL", description: "Electronic Equipment" },
  { code: "DIP", description: "Diplomatic Cargo" },
  { code: "PES", description: "Personal Effects" },
  { code: "TEX", description: "Textiles" },
  { code: "SPL", description: "Special Cargo" },
  { code: "MIL", description: "Military Cargo" },
  { code: "OTH", description: "Other (Specify)" },
].sort((a, b) => a.description.localeCompare(b.description));

export const iataOtherChargeCodes = [
  { code: "MYC", description: "Fuel Surcharge (Carrier)", isSurcharge: true },
  { code: "SCC", description: "Security Surcharge (Carrier)", isSurcharge: true },
  { code: "MOC", description: "Fuel Surcharge (Other Party)", isSurcharge: true },
  { code: "SOC", description: "Security Surcharge (Other Party)", isSurcharge: true },
  { code: "WSC", description: "War Surcharge (Carrier)", isSurcharge: true },
  { code: "WOC", description: "War Surcharge (Other Party)", isSurcharge: true },
  { code: "CUS", description: "Customs Clearance Fee", isSurcharge: false },
  { code: "TAX", description: "Taxes", isSurcharge: false },
  { code: "HND", description: "Handling Fee", isSurcharge: false },
  { code: "INS", description: "Insurance", isSurcharge: false },
  { code: "PKG", description: "Packing Charge", isSurcharge: false },
  { code: "DGR", description: "Dangerous Goods Surcharge", isSurcharge: true },
  { code: "CCF", description: "Cash Collection Fee", isSurcharge: false },
  { code: "TRM", description: "Terminal Handling Charge", isSurcharge: true },
  { code: "WGT", description: "Weight Charge", isSurcharge: false },
  { code: "VAL", description: "Valuation Charge", isSurcharge: false },
  { code: "DOC", description: "Documentation Fee", isSurcharge: false },
  { code: "OTH", description: "Other (Specify)", isSurcharge: false },
].sort((a, b) => a.code.localeCompare(b.code));

export const paymentTypes = ['PPD', 'COL', 'PPA', 'CCA'];

export const bookingStatusOptions = [
  { code: "NN", description: "Waitlisted / Requesting" },
  { code: "KK", description: "Confirmed" },
  { code: "RQ", description: "Requested (Awaiting Confirmation)" },
  { code: "XX", description: "Cancelled" },
  { code: "HL", description: "Have AWB / On Hold" },
];
