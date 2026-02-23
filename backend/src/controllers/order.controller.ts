import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { paymentService } from '../services/payment.service';
import { generateOrderID } from '../utils/token.generator';

// ==========================================
// 1. CREATE ORDER (User Checkout)
// ==========================================
// ==========================================
// 1. CREATE ORDER (User Checkout)
// ==========================================
export const createOrder = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Ambil payload dari Frontend
        const { items, shippingCost, totalAmount, courier, addressId } = req.body; 

        // Tambahkan include addresses pada query
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { addresses: true }
        });

        if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

        // Cari alamat spesifik
        const selectedAddress = user.addresses.find(a => a.id === addressId) || user.addresses[0];
        if (!selectedAddress) return res.status(400).json({ error: "Alamat tidak ditemukan" });

        const newOrderId = generateOrderID(); 
        const finalTotal = totalAmount || 0;

        // Call Midtrans
        const payment = await paymentService.createTransaction(
            newOrderId, 
            finalTotal, 
            {
                name: user.name,
                email: user.email || '',
                phone: user.phone
            }
        );

        // Simpan ke DB
        await prisma.order.create({
            data: {
                id: newOrderId,
                userId: user.id,
                customerName: user.name,
                customerPhone: user.phone,
                totalAmount: finalTotal,
                status: 'PENDING_PAYMENT',
                
                snapToken: payment.token,
                snapUrl: payment.redirect_url,
                courier: courier || 'Kurir Toko',
                shippingCost: shippingCost || 0,
                
                // Simpan snapshot alamat sebagai JSON
                shippingAddress: selectedAddress as any, 

                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId,
                        productName: item.name || 'Produk',
                        quantity: item.quantity,
                        price: item.price,
                        
                        variantId: (item.variantId && item.variantId !== 'default') ? item.variantId : null, 
                        
                        variantName: item.variant || 'Standard',
                        totalPrice: item.price * item.quantity
                    }))
                }
            }
        });

        // ==============================================================
        // ✅ FIX: HAPUS BARANG DARI KERANJANG SETELAH CHECKOUT
        // ==============================================================
        const productIds = items.map((item: any) => item.productId);
        
        await prisma.cartItem.deleteMany({
            where: {
                cart: { userId: user.id },      // Pastikan hanya menghapus keranjang milik user ini
                productId: { in: productIds }   // Hanya hapus produk yang barusan di-checkout
            }
        });
        // ==============================================================

        res.json({ 
            message: "Order berhasil dibuat", 
            orderId: newOrderId,
            snap_token: payment.token, 
            snap_url: payment.redirect_url 
        });

    } catch (error: any) {
        console.error("Create Order Error:", error);
        res.status(500).json({ error: error.message || "Gagal membuat order" });
    }
};


// ==========================================
// 2. GET ALL ORDERS (Admin Dashboard)
// ==========================================
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { 
        // ✅ FIX: Include product untuk mengambil gambar asli produknya
        items: {
            include: {
                product: true
            }
        },
        user: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedOrders = orders.map(o => {
        // Safe Access: Handle jika user sudah dihapus dari DB (o.user null)
        const customerName = o.customerName || o.user?.name || 'Guest User';
        
        // Safe Access: Handle Address JSON
        const addrJson = o.shippingAddress as any;
        let addressString = 'Alamat tidak tersedia';
        if (addrJson && addrJson.fullAddress) {
            addressString = `${addrJson.fullAddress}, ${addrJson.city}`;
        }

        return {
            id: o.id,
            customer: customerName,
            total: o.totalAmount,
            date: new Date(o.createdAt).toLocaleString('id-ID'),
            status: o.status,
            paymentMethod: o.paymentMethod || 'Midtrans', 
            courier: o.courier || 'Kurir Toko', 
            trackingId: o.trackingId || '-',
            address: addressString, 
            items: o.items.map(i => ({
                productId: i.productId, // Disertakan untuk link klik di dashboard
                name: i.productName,
                qty: i.quantity,
                price: i.price,
                // ✅ FIX: Gunakan gambar asli dari database, fallback ke placeholder jika tidak ada
                image: i.product?.images?.[0] || 'https://placehold.co/50' 
            }))
        };
    });

    res.json(formattedOrders);
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ error: "Gagal mengambil data pesanan" });
  }
};

// ==========================================
// 3. UPDATE STATUS
// ==========================================
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    const orderId = Array.isArray(id) ? id[0] : id;

    let updateData: any = { status };

    // Simulasi Biteship saat status SHIPPED
    if (status === 'SHIPPED') {
        const generatedResi = `BS-MANDES-${Math.floor(1000 + Math.random() * 9000)}`;
        updateData.trackingId = generatedResi;
    }

    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: { items: true }
    });

    res.json({ 
        message: "Status pesanan diperbarui", 
        order: updatedOrder,
        trackingId: updateData.trackingId 
    });

  } catch (error) {
    console.error("Update Order Error:", error);
    res.status(500).json({ error: "Gagal update status pesanan" });
  }
};