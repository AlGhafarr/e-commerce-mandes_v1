import crypto from 'crypto';

/**
 * Generate Angka Acak (Contoh: 481256)
 */
export const generateOTP = (length: number = 6): string => {  
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// ... sisanya (generateSecureToken, generateOrderID) tetap sama ...
export const generateSecureToken = (bytes: number = 32): string => {
  return crypto.randomBytes(bytes).toString('hex');
};

export const generateOrderID = (): string => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `INV-${date}-${random}`;
};