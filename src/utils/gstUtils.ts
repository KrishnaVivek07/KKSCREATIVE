// Indian GST calculation utilities and amount in words converter

export interface GstCalculationResult {
  taxableAmount: number;
  taxType: 'CGST_SGST' | 'IGST' | 'EXEMPT';
  taxRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalGst: number;
  grandTotal: number;
}

export const COMMON_GST_SLABS = [
  { rate: 18, label: '18% GST (Standard R&D / Engineering / Electronics)', default: true },
  { rate: 12, label: '12% GST (Embedded Hardware / Machinery / Enclosures)' },
  { rate: 5, label: '5% GST (Solar / Essential Electronic Components)' },
  { rate: 28, label: '28% GST (Automotive / High-power Industrial)' },
  { rate: 0, label: '0% GST (Exempt / SEZ / Export Supplies)' },
];

export const COMMON_HSN_CODES = [
  { code: '8542', label: '8542 - Microcontrollers, ICs & Processors' },
  { code: '8504', label: '8504 - Power Supplies, SMPS & Adapters' },
  { code: '9031', label: '9031 - Sensors, Test & Measurement Instruments' },
  { code: '8536', label: '8536 - Relays, Connectors & Terminals' },
  { code: '8529', label: '8529 - Wireless, RF, Bluetooth & LoRa Modules' },
  { code: '998313', label: '998313 - Embedded Systems & IoT Software Services (SAC)' },
  { code: '998314', label: '998314 - Hardware Engineering & Prototyping Services (SAC)' },
  { code: '998719', label: '998719 - Maintenance & Bench Assembly Labour (SAC)' },
];

export function calculateGst(
  subtotal: number,
  discount: number,
  taxRate: number,
  taxType: 'CGST_SGST' | 'IGST' | 'EXEMPT'
): GstCalculationResult {
  const taxable = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

  if (taxType === 'EXEMPT' || taxRate <= 0) {
    return {
      taxableAmount: taxable,
      taxType: 'EXEMPT',
      taxRate: 0,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      totalGst: 0,
      grandTotal: taxable,
    };
  }

  if (taxType === 'CGST_SGST') {
    const halfRate = taxRate / 2;
    // Genuine rounding to 2 decimal places as required by Indian GST Act
    const cgst = Math.round(((taxable * halfRate) / 100) * 100) / 100;
    const sgst = Math.round(((taxable * halfRate) / 100) * 100) / 100;
    const totalGst = Math.round((cgst + sgst) * 100) / 100;
    const grandTotal = Math.round((taxable + totalGst) * 100) / 100;

    return {
      taxableAmount: taxable,
      taxType: 'CGST_SGST',
      taxRate,
      cgstRate: halfRate,
      cgstAmount: cgst,
      sgstRate: halfRate,
      sgstAmount: sgst,
      igstRate: 0,
      igstAmount: 0,
      totalGst,
      grandTotal,
    };
  }

  // IGST
  const igst = Math.round(((taxable * taxRate) / 100) * 100) / 100;
  const grandTotal = Math.round((taxable + igst) * 100) / 100;

  return {
    taxableAmount: taxable,
    taxType: 'IGST',
    taxRate,
    cgstRate: 0,
    cgstAmount: 0,
    sgstRate: 0,
    sgstAmount: 0,
    igstRate: taxRate,
    igstAmount: igst,
    totalGst: igst,
    grandTotal,
  };
}

// Convert amount to Indian currency words format (Rupees ... Only)
export function numberToWordsIndian(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const wholeNum = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - wholeNum) * 100);

  function inWords(n: number): string {
    let str = '';
    if (n > 9999999) {
      str += inWords(Math.floor(n / 10000000)) + 'Crore ';
      n %= 10000000;
    }
    if (n > 99999) {
      str += inWords(Math.floor(n / 100000)) + 'Lakh ';
      n %= 100000;
    }
    if (n > 999) {
      str += inWords(Math.floor(n / 1000)) + 'Thousand ';
      n %= 1000;
    }
    if (n > 99) {
      str += inWords(Math.floor(n / 100)) + 'Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)];
        if (n % 10) str += ' ' + a[n % 10];
      }
    }
    return str;
  }

  let words = inWords(wholeNum).trim();
  if (words) {
    words = words + ' Rupees';
  } else {
    words = 'Zero Rupees';
  }

  if (paise > 0) {
    words += ' and ' + inWords(paise).trim() + ' Paise';
  }

  return words + ' Only';
}
