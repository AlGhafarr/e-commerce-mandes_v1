import axios from 'axios';

/**
 * URL Gateway WA
 * Prioritas: 
 * 1. Dari Environment Variable (Docker/System)
 * 2. Fallback ke host.docker.internal (Standar Docker Linux ke Host)
 */
const WA_GATEWAY_URL = process.env.WA_GATEWAY_URL || 'http://host.docker.internal:6521';

export const whatsappService = {
  /**
   * Mengirim pesan OTP via WA Gateway (dengan Fallback & Mock Mode)
   */
  async sendOTP(phone: string, otpCode: string) {
    // --- 1. MODE BYPASS / MOCK ---
    const FORCE_MOCK = process.env.NODE_ENV === 'development' && false; 

    if (FORCE_MOCK) {
      console.log(`\n========== [MOCK WA MODE] ==========`);
      console.log(`Kepada    : ${phone}`);
      console.log(`Isi Pesan : Kode OTP Anda adalah ${otpCode}`);
      console.log(`====================================\n`);
      return true; 
    }

    // --- 2. LOGIC KIRIM KE GATEWAY ---
    try {
      const message = `*KODE RAHASIA MANDES SNACK*\n\nKode OTP Anda: *${otpCode}*\n\nJangan berikan kode ini kepada siapapun. Berlaku selama 5 menit.`;

      console.log(`[WA ATTEMPT] Mengirim ke: ${WA_GATEWAY_URL}`);

      const response = await axios.post(WA_GATEWAY_URL, { // Gunakan langsung tanpa backtick/string tambahan
      number: phone,
      message: message,
      }, {
        timeout: 5000 
      });

      console.log(`[WA SENT] OTP dikirim ke ${phone}`);
      return response.data;

    } catch (error: any) {
      // --- 3. ERROR HANDLING & FALLBACK ---
      console.error(`[WA GATEWAY ERROR] Gagal terhubung ke: ${WA_GATEWAY_URL}`);
      
      // Deteksi penyebab error secara lebih detail di log
      if (error.code === 'ECONNREFUSED') {
          console.error('Penyebab: Koneksi ditolak oleh Host. Cek IP/Firewall.');
      } else if (error.code === 'ETIMEDOUT') {
          console.error('Penyebab: Request Timeout. Gateway lemot atau IP salah.');
      }

      console.log(`\n!!! DARURAT: GATEWAY MATI / ERROR !!!`);
      console.log(`[MANUAL OTP FALLBACK] Gunakan kode ini untuk login: ${otpCode}`);
      console.log(`-------------------------------------\n`);

      return true; 
    }
  },

  async sendOrderNotification(phone: string, orderId: string, status: string) {
      try {
          const message = `Halo, Pesanan *${orderId}* statusnya sekarang: *${status}*. Terima kasih telah berbelanja!`;
          await axios.post(`${WA_GATEWAY_URL}/send-message`, { number: phone, message });
      } catch (e) {
          console.error("Gagal kirim notif order");
      }
  }
};