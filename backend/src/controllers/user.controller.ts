import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_aman_mandes_123';

// Helper: Get User ID from Token (Cookie)
// Digunakan jika Middleware Auth belum terpasang di route ini
const getUserId = (req: Request) => {
  const token = req.cookies.mandes_admin_token;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (e) {
    return null;
  }
};

// ==========================================
// 1. ADDRESS MANAGEMENT
// ==========================================

export const getAddresses = async (req: Request, res: Response) => {
  const userId = getUserId(req) || (req as any).user?.id; // Support Middleware & Direct Token
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' } // Default paling atas
    });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil alamat" });
  }
};

export const addAddress = async (req: Request, res: Response) => {
  const userId = getUserId(req) || (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Jika ini alamat pertama user, set otomatis jadi default
    const count = await prisma.address.count({ where: { userId } });
    const isDefault = count === 0;

    const address = await prisma.address.create({
      data: { ...req.body, userId, isDefault }
    });
    res.json(address);
  } catch (error) {
    res.status(500).json({ error: "Gagal menyimpan alamat" });
  }
};

// ==========================================
// 2. ORDER HISTORY (Customer Side)
// ==========================================

export const getMyOrders = async (req: Request, res: Response) => {
  const userId = getUserId(req) || (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: { items: true }, 
      orderBy: { createdAt: 'desc' }
    });

    // Format Data agar Frontend mudah membacanya
    const formattedOrders = orders.map(order => {
        // Handle Alamat JSON
        const addrJson = order.shippingAddress as any;
        const addressString = addrJson 
            ? `${addrJson.fullAddress}, ${addrJson.city}` 
            : 'Alamat tidak tersedia';

        return {
            id: order.id,
            date: new Date(order.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }),
            status: order.status,
            total: order.totalAmount,
            
            // Info Pengiriman & Pembayaran
            courier: order.courier || '-',
            trackingId: order.trackingId || '-',
            snapToken: order.snapToken,
            paymentMethod: order.paymentMethod || 'Midtrans',
            
            address: addressString,
            items: order.items.map(item => ({
                name: item.productName,
                qty: item.quantity,
                price: item.price,
                total: item.totalPrice
            }))
        };
    });

    res.json(formattedOrders);
  } catch (error) {
    console.error("Get My Orders Error:", error);
    res.status(500).json({ error: "Gagal mengambil history pesanan" });
  }
};

// ==========================================
// 3. ADMIN: GET ALL CUSTOMERS
// ==========================================

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        orders: {
          include: { items: true }, 
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedData = users.map(user => ({
      id: user.id,
      phone: user.phone,
      name: user.name,
      last_login: "-", // Placeholder (perlu field lastLogin di DB jika ingin real)
      created_at: new Date(user.createdAt).toLocaleDateString('id-ID', { 
        day: 'numeric', month: 'short', year: 'numeric' 
      }),
      orders: user.orders.map(order => ({
        order_id: order.id,
        date: new Date(order.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        }),
        total: order.totalAmount,
        payment_method: order.paymentMethod || 'Midtrans',
        status: order.status,
        
        // Tambahan info untuk Admin
        courier: order.courier || '-',
        tracking_id: order.trackingId || '-',

        items: order.items.map(item => ({
            name: item.productName,
            qty: item.quantity,
            price: item.price
        }))
      }))
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error get customers:", error);
    res.status(500).json({ error: "Gagal mengambil data pelanggan" });
  }
};