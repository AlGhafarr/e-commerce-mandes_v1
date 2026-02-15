import axios from 'axios';

const BITESHIP_API_KEY = process.env.BITESHIP_API_KEY || 'biteship_test_token_...'; 
const BITESHIP_URL = 'https://api.biteship.com/v1';

export const shippingService = {
  // 1. Cek Ongkir
  async checkRates(origin: any, destination: any, items: any[]) {
    try {
      const response = await axios.post(`${BITESHIP_URL}/rates/couriers`, {
        origin_area_id: origin.area_id, // ID Area Biteship (misal: ID Jakarta Selatan)
        destination_area_id: destination.area_id, // ID Area Customer
        couriers: "jne,jnt,sicepat,gojek,grab", // Kurir yang diinginkan
        items: items // Array of items {name, value, weight, ...}
      }, {
        headers: { 'Authorization': `Bearer ${BITESHIP_API_KEY}` }
      });

      return response.data;
    } catch (error) {
      console.error('Biteship Rate Error:', error);
      throw new Error('Gagal cek ongkir');
    }
  },

  // 2. Request Pickup / Buat Order Pengiriman
  async createShippingOrder(orderData: any) {
    try {
      const response = await axios.post(`${BITESHIP_URL}/orders`, {
        // Mapping data order DB ke format Biteship
        origin: { ...orderData.origin },
        destination: { ...orderData.destination },
        courier: {
            company: orderData.courier_code, // e.g. "jne"
            type: orderData.courier_service  // e.g. "reg"
        },
        items: orderData.items
      }, {
        headers: { 'Authorization': `Bearer ${BITESHIP_API_KEY}` }
      });

      return response.data; // Mengembalikan Tracking ID / Resi
    } catch (error) {
      console.error('Biteship Order Error:', error);
      throw new Error('Gagal request pickup');
    }
  },

  // 3. Tracking Resi
  async trackOrder(trackingId: string) {
    try {
      const response = await axios.get(`${BITESHIP_URL}/trackings/${trackingId}`, {
        headers: { 'Authorization': `Bearer ${BITESHIP_API_KEY}` }
      });
      return response.data;
    } catch (error) {
        throw new Error('Gagal melacak pesanan');
    }
  }
};