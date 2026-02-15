import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Nama lama: requireAdmin — tetap dipertahankan agar tidak break kode lain
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.mandes_admin_token;   // ← fix: pakai optional chaining

    if (!token) {
        return res.status(403).json({ error: 'Akses Ditolak: Butuh Login Admin' });
    }

    try {
        const secret = process.env.ADMIN_JWT_SECRET as string;
        const decoded: any = jwt.verify(token, secret);

        if (decoded.role === 'super_admin') {
            (req as any).admin = decoded; // attach ke request untuk dipakai controller
            next();
        } else {
            throw new Error('Role mismatch');
        }
    } catch (error) {
        return res.status(403).json({ error: 'Token Admin Tidak Valid atau Expired' });
    }
};
