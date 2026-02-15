'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

// Konfigurasi URL Backend (env-first, fallback ke localhost untuk dev)
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_URL = `${baseUrl}/api/auth`;

// --- TIPE DATA ---
interface User {
  id: string;
  name: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  // Fungsi Register Flow
  registerRequest: (data: any) => Promise<any>;
  verifyOtp: (username: string, otp: string) => Promise<any>;
  setPassword: (username: string, password: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname(); // Hook untuk ambil URL sekarang

  // ==========================================
  // 1. CEK SESSION SAAT LOAD (SMART CHECK)
  // ==========================================
  useEffect(() => {
    // PENTING: Jika pathname belum siap/null, JANGAN LAKUKAN APAPUN.
    // Ini mencegah request bocor saat inisialisasi awal.
    if (!pathname) return; 

    // Cek apakah sedang di area admin
    const isAdminArea = 
        pathname.startsWith('/admin') || 
        pathname.startsWith('/admin-dashboard');

    // Jika di Admin Area -> STOP TOTAL (Jangan fetch user biasa)
    if (isAdminArea) {
      console.log("Admin Area Detected: Skipping User Session Check"); // Debugging
      setIsLoading(false); 
      return; 
    }

    // Jika BUKAN Admin Area -> Baru boleh fetch session user biasa
    const checkSession = async () => {
      try {
        const res = await fetch(`${API_URL}/me`, { credentials: 'include' });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [pathname]);


  // ==========================================
  // 2. LOGIN USER (Username/Email + Password)
  // ==========================================
  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
        credentials: 'include' // Wajib agar Backend bisa set-cookie
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login gagal');

      setUser(data.user);
      router.refresh(); 
    } catch (error) {
      throw error;
    }
  };

  // ==========================================
  // 3. REGISTER REQUEST (Step 1)
  // ==========================================
  const registerRequest = async (data: any) => {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal registrasi');
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  // ==========================================
  // 4. VERIFY OTP (Step 2)
  // ==========================================
  const verifyOtp = async (username: string, otp: string) => {
    try {
      const res = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, otp }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'OTP Invalid');
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  // ==========================================
  // 5. SET PASSWORD (Step 3 - Final)
  // ==========================================
  const setPassword = async (username: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal set password');
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  // ==========================================
  // 6. LOGOUT
  // ==========================================
  const logout = async () => {
    try {
      await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        logout,
        registerRequest, 
        verifyOtp,       
        setPassword      
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};