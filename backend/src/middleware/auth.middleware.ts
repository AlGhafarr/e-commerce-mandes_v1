import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_aman_mandes_123';
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'rahasia_admin_ganteng'; 

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    username: string;
  };
}

// 1. AUTHENTICATION (Cek Siapa Kamu)
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.mandes_token || req.cookies.mandes_admin_token;

    if (!token) {
      // Tidak ada token -> 401 -> Frontend akan buka Modal Login
      return res.status(401).json({ error: "Unauthorized: Silakan login terlebih dahulu." });
    }

    let decoded: any;
    try {
        // Coba User Secret
        decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        try {
            // Coba Admin Secret
            decoded = jwt.verify(token, ADMIN_SECRET);
        } catch (adminErr) {
            // Token Expired/Rusak -> Kembalikan 401 agar Frontend minta Login ulang
            // (Sebelumnya 403, saya ubah ke 401 untuk UX yang lebih baik)
            return res.status(401).json({ error: "Session expired. Silakan login kembali." });
        }
    }

    (req as any).user = decoded; 
    next();

  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// 2. AUTHORIZATION (Cek Hak Akses)
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) return res.status(401).json({ error: "Unauthorized" });

    // Whitelist Role
    const allowedRoles = ['admin', 'ADMIN', 'super_admin'];

    if (!allowedRoles.includes(user.role)) {
        // User login tapi bukan admin -> 403 Forbidden (Betul)
        return res.status(403).json({ 
            error: "Forbidden: Akses ditolak.",
            details: `Role ${user.role} tidak diizinkan.` 
        });
    }

    next();
};