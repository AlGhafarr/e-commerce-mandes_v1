import { authEvents } from './event';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://10.253.128.163:4721/api';

export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  // Otomatis tambah credentials agar cookie terkirim
  const config = {
    ...options,
    credentials: 'include' as RequestCredentials, 
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // CEGAT ERROR 401 DI SINI
  if (response.status === 401) {
    // 1. Trigger event buka modal
    authEvents.triggerLoginModal();
    
    // 2. Lempar error agar kode di page berhenti
    throw new Error('UNAUTHORIZED_ACCESS'); 
  }

  return response;
};