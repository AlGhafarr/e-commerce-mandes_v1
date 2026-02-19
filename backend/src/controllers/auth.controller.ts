import { Request, Response, CookieOptions } from 'express';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { whatsappService } from '../services/whatsapp.service';
import { generateOTP } from '../utils/token.generator';

// --- SECRET KEYS ---
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_user_biasa_123';
const ADMIN_SECRET = process.env.ADMIN_JWT_SECRET || 'rahasia_admin_ganteng';

// --- CONFIG COOKIE (FINAL & STABLE) ---
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || (process.env.NODE_ENV === 'production' ? '.mandessnack.shop' : undefined);

const getCookieOptions = (): CookieOptions => {
    return {
        httpOnly: true,
        secure: true,
        sameSite: 'none',        
        maxAge: 7 * 24 * 3600 * 1000,
        domain: COOKIE_DOMAIN,
        path: '/'
    };
};

/**
 * HELPER: FORMAT NO HP (08xx -> 628xx)
 */
const formatPhone = (phone: any): string => {
    if (!phone || typeof phone !== 'string') return '';
    let formatted = phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) {
        formatted = '62' + formatted.slice(1);
    }
    return formatted;
};

// ==========================================
// 1. REGISTER REQUEST
// ==========================================
export const registerRequest = async (req: Request, res: Response) => {
    try {
        const { name, username, phone, email } = req.body;
        const dbPhone = formatPhone(phone);

        if (!username || !phone) {
            return res.status(400).json({ error: "Username dan Nomor HP wajib diisi" });
        }

        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { phone: dbPhone },
                    ...(email ? [{ email }] : [])
                ],
                isVerified: true
            }
        });

        if (existing) {
            return res.status(400).json({ error: "Username, Email, atau Nomor HP sudah terdaftar!" });
        }

        const otp = generateOTP(6);
        const expiry = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.user.upsert({
            where: { username },
            update: { otpCode: otp, otpExpiry: expiry, name, phone: dbPhone, email },
            create: {
                name, username, phone: dbPhone, email: email || null,
                password: "", otpCode: otp, otpExpiry: expiry
            }
        });

        await whatsappService.sendOTP(dbPhone, otp);

        res.json({ message: "OTP terkirim ke WhatsApp", phone: dbPhone });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: "Gagal memproses pendaftaran" });
    }
};

// ==========================================
// 2. LOGIN WITH PHONE (OTP)
// ==========================================
export const loginWithPhone = async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;
        if (!phone) return res.status(400).json({ error: "Nomor HP wajib diisi" });

        const dbPhone = formatPhone(phone);
        const otp = generateOTP(6);
        const expiry = new Date(Date.now() + 5 * 60 * 1000);

        await prisma.user.upsert({
            where: { phone: dbPhone },
            update: { otpCode: otp, otpExpiry: expiry },
            create: {
                phone: dbPhone,
                username: `user${dbPhone.slice(-6)}`,
                name: 'Pelanggan',
                password: "",
                otpCode: otp,
                otpExpiry: expiry,
                email: `${dbPhone}@temp.mandessnack.shop` 
            }
        });

        await whatsappService.sendOTP(dbPhone, otp);
        res.json({ message: "OTP Login dikirim ke WhatsApp", target: dbPhone });

    } catch (error) {
        console.error("Login Phone Error:", error);
        res.status(500).json({ error: "Gagal mengirim OTP Login" });
    }
};

// ==========================================
// 3. VERIFY OTP (USER BIASA)
// ==========================================
export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { identifier, username, otp } = req.body;
        const finalIdentifier = identifier || username;

        if (!finalIdentifier || !otp) {
            return res.status(400).json({ error: "Data tidak lengkap" });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: finalIdentifier },
                    { phone: formatPhone(finalIdentifier) }
                ]
            }
        });

        if (!user || user.otpCode !== otp || !user.otpExpiry || new Date() > user.otpExpiry) {
            return res.status(400).json({ error: "Kode OTP salah atau kadaluarsa" });
        }

        // A. Jika Login
        if (user.isVerified && user.password !== "") {
            await prisma.user.update({ where: { id: user.id }, data: { otpCode: null, otpExpiry: null } });

            const mandes_token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

            // ✅ BENAR: Set mandes_token
            res.cookie('mandes_token', mandes_token, getCookieOptions());
            
            return res.json({ message: "Login Berhasil", user, action: "LOGIN_SUCCESS" });
        }

        // B. Jika Register, Lanjut ke Set Password
        res.json({ message: "OTP Valid", username: user.username, action: "SET_PASSWORD" });

    } catch (error) {
        console.error("Verify OTP Error:", error);
        res.status(500).json({ error: "Gagal verifikasi" });
    }
};

// ==========================================
// 4. SET PASSWORD (USER BIASA)
// ==========================================
export const setPassword = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        if (!password || password.length < 6) {
            return res.status(400).json({ error: "Password minimal 6 karakter" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.update({
            where: { username },
            data: {
                password: hashedPassword,
                isVerified: true,
                otpCode: null,
                otpExpiry: null
            }
        });

        const mandes_token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        // ✅ BENAR: Set mandes_token
        res.cookie('mandes_token', mandes_token, getCookieOptions());

        res.json({ message: "Registrasi Berhasil!", user });
    } catch (error) {
        console.error("Set Password Error:", error);
        res.status(500).json({ error: "Gagal menyimpan password" });
    }
};

// ==========================================
// 5. LOGIN PASSWORD (USER BIASA)
// ==========================================
export const login = async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body;

        const user = await prisma.user.findFirst({
            where: {
                OR: [{ username: identifier }, { email: identifier }],
                isVerified: true
            }
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Username/Email atau Password salah" });
        }

        const mandes_token = jwt.sign({ id: user.id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

        // ✅ BENAR: Set mandes_token
        res.cookie('mandes_token', mandes_token, getCookieOptions());

        res.json({ message: "Login Berhasil", user: { id: user.id, name: user.name, role: user.role } });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Terjadi kesalahan server saat login" });
    }
};

// ==========================================
// 6. CHECK SESSION (USER BIASA)
// ==========================================
export const getMe = async (req: Request, res: Response) => {
    try {
        // ✅ PERBAIKAN DISINI: Harus baca dari req.cookies.mandes_token
        const token = req.cookies.mandes_token; 
        
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const decoded: any = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, name: true, username: true, role: true, phone: true }
        });

        if (!user) return res.status(401).json({ error: "User tidak ditemukan" });
        res.json(user);
    } catch (e) {
        res.status(401).json({ error: "Token invalid atau expired" });
    }
};

// ==========================================
// 7. LOGOUT (USER BIASA)
// ==========================================
export const logout = (req: Request, res: Response) => {
    const { maxAge, ...logoutOptions } = getCookieOptions();
    // ✅ BENAR: Hapus mandes_token
    res.clearCookie('mandes_token', logoutOptions);
    res.json({ message: "Logout berhasil" });
};

// ==========================================
// 8. ADMIN LOGIN (KHUSUS ADMIN)
// ==========================================
export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return res.status(401).json({ error: "Kredensial Admin Salah!" });
        }

        const token = jwt.sign(
            { id: 'admin_env_id', role: 'super_admin', name: 'Super Admin' },
            ADMIN_SECRET,
            { expiresIn: '6h' }
        );

        res.cookie('mandes_admin_token', token, getCookieOptions());

        res.json({ message: "Welcome Commander!", role: 'super_admin' });

    } catch (error) {
        console.error("Admin Login Error:", error);
        res.status(500).json({ error: "Server Error" });
    }
};

// ==========================================
// 9. ADMIN SESSION (KHUSUS ADMIN)
// ==========================================
export const getAdminMe = async (req: Request, res: Response) => {
    try {
        const token = req.cookies.mandes_admin_token;
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const decoded: any = jwt.verify(token, ADMIN_SECRET);
        if (decoded.role !== 'super_admin') throw new Error("Fake Admin");

        res.json({ role: 'super_admin', name: 'Super Admin' });
    } catch (e) {
        res.status(401).json({ error: "Invalid Admin Token" });
    }
};

// ==========================================
// 10. ADMIN LOGOUT (KHUSUS ADMIN)
// ==========================================
export const adminLogout = (req: Request, res: Response) => {
    const { maxAge, ...logoutOptions } = getCookieOptions();
    res.clearCookie('mandes_admin_token', logoutOptions);
    res.json({ message: "Admin Logout berhasil" });
};