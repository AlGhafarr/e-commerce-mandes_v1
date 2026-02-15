import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// ==========================================
// ADMIN LOGIN - FIXED
// ==========================================
export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;

        console.log("=== ADMIN LOGIN ATTEMPT ===");
        console.log("Username received:", username);
        console.log("Password received:", password ? "[PROVIDED]" : "[EMPTY]");
        console.log("ENV Username:", process.env.ADMIN_USERNAME);
        console.log("Match username:", username === process.env.ADMIN_USERNAME);
        console.log("Match password:", password === process.env.ADMIN_PASSWORD);

        // Validasi input tidak boleh kosong
        if (!username || !password) {
            return res.status(400).json({ error: "Username dan password wajib diisi" });
        }

        // Bandingkan langsung dengan ENV (plaintext comparison)
        const isUsernameMatch = username === process.env.ADMIN_USERNAME;
        const isPasswordMatch = password === process.env.ADMIN_PASSWORD;

        if (!isUsernameMatch || !isPasswordMatch) {
            console.log("❌ Login gagal - credentials tidak cocok");
            return res.status(401).json({ error: "Username atau password salah" });
        }

        console.log("✅ Login berhasil");

        // Buat JWT token
        const secret = process.env.ADMIN_JWT_SECRET as string;
        const token = jwt.sign(
            { 
                username: username,
                role: 'super_admin',
                loginAt: new Date().toISOString()
            },
            secret,
            { expiresIn: '8h' }
        );

        // Set cookie
        res.cookie('mandes_admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 8 * 60 * 60 * 1000, // 8 jam
            path: '/'
        });

        return res.status(200).json({ 
            message: "Login admin berhasil",
            username: username
        });

    } catch (error) {
        console.error("Admin Login Error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// ==========================================
// ADMIN LOGOUT
// ==========================================
export const adminLogout = (req: Request, res: Response) => {
    res.clearCookie('mandes_admin_token', { path: '/' });
    return res.status(200).json({ message: "Logout berhasil" });
};

// ==========================================
// CEK STATUS LOGIN ADMIN (/api/admin/me)
// ==========================================
export const adminMe = (req: Request, res: Response) => {
    const token = req.cookies.mandes_admin_token;

    if (!token) {
        return res.status(401).json({ error: "Belum login" });
    }

    try {
        const secret = process.env.ADMIN_JWT_SECRET as string;
        const decoded = jwt.verify(token, secret) as any;
        return res.status(200).json({ username: decoded.username, role: decoded.role });
    } catch {
        return res.status(401).json({ error: "Token tidak valid atau expired" });
    }
};


// ==========================================
// 1. GET ALL CUSTOMERS
// ==========================================
export const getCustomers = async (req: Request, res: Response) => {
    try {
        const customers = await prisma.user.findMany({
            where: { role: 'customer' },
            include: {
                orders: {
                    include: { items: true },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = customers.map(user => ({
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email || '-',
            last_login: '-', 
            created_at: user.createdAt,
            
            orders: user.orders.map(order => ({
                order_id: order.id,
                date: order.createdAt,
                total: order.totalAmount,
                payment_method: order.paymentMethod || 'Midtrans',
                status: order.status,
                items: order.items.map(item => ({
                    name: item.productName,
                    qty: item.quantity,
                    price: item.price
                }))
            }))
        }));

        res.json(formatted);
    } catch (error) {
        console.error("Admin Customers Error:", error);
        res.status(500).json({ error: "Gagal mengambil data pelanggan" });
    }
};

// ==========================================
// 2. GET ALL ORDERS (LENGKAP UNTUK ADMIN)
// ==========================================
export const getAdminOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: {
                    select: { name: true, phone: true }
                },
                items: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const formatted = orders.map(order => {
            // Parse Alamat dari JSON
            const addr = order.shippingAddress as any;
            const fullAddress = addr 
                ? `${addr.fullAddress}, ${addr.city} ${addr.postalCode}` 
                : 'Alamat tidak tersedia';

            return {
                id: order.id,
                customerName: order.customerName || order.user?.name || 'Guest',
                totalAmount: order.totalAmount,
                status: order.status,
                date: order.createdAt,
                
                // DATA TAMBAHAN YANG DIBUTUHKAN FRONTEND:
                paymentMethod: order.paymentMethod || 'Midtrans',
                courier: order.courier || 'Kurir Toko',
                trackingId: order.trackingId,
                address: fullAddress, // Agar muncul di modal detail
                items: order.items.map(i => ({
                    productName: i.productName,
                    quantity: i.quantity,
                    price: i.price,
                    image: 'https://placehold.co/100' // Placeholder jika orderItem tidak simpan gambar
                }))
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error("Admin Orders Error:", error);
        res.status(500).json({ error: "Gagal mengambil data pesanan" });
    }
};

// ==========================================
// 3. UPDATE ORDER STATUS
// ==========================================
export const updateAdminOrderStatus = async (req: Request, res: Response) => {
    try {
        // FIX: Type Casting agar ID dianggap String (Mengatasi Error TS2322)
        const { id } = req.params as { id: string };
        const { status } = req.body;

        const validStatuses = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Status tidak valid" });
        }

        let updateData: any = { status };

        // Simulasi Generate Resi
        if (status === 'SHIPPED') {
            const generatedResi = `MANDES-RESI-${Math.floor(10000 + Math.random() * 90000)}`;
            updateData.trackingId = generatedResi;
        }

        const updatedOrder = await prisma.order.update({
            where: { id }, // Sekarang aman karena 'id' pasti string
            data: updateData
        });

        res.json({ 
            message: "Status berhasil diperbarui", 
            order: updatedOrder,
            trackingId: updateData.trackingId 
        });

    } catch (error) {
        console.error("Update Order Status Error:", error);
        res.status(500).json({ error: "Gagal update status pesanan" });
    }
};