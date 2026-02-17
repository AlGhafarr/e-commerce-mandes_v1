import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ==========================================
// 1. AMBIL KERANJANG (GET /api/cart)
// ==========================================
export const getCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Cari Cart milik user
        const userCart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: { 
                        product: true, // Untuk ambil nama & gambar
                        variant: true  // PENTING: Untuk ambil harga varian
                    },
                    orderBy: { id: 'desc' }
                }
            }
        });

        if (!userCart) {
            return res.json([]); 
        }

        // Format data
        const formattedData = userCart.items.map((item) => {
            // LOGIC HARGA: Prioritaskan harga varian jika ada, jika tidak pakai harga dasar produk
            const finalPrice = item.variant ? item.variant.price : item.product.basePrice;
            
            // LOGIC NAMA VARIAN: Gabungkan nama & ukuran
            const variantInfo = item.variant 
                ? `${item.variant.name}${item.variant.size ? ` - ${item.variant.size}` : ''}` 
                : 'Standard';

            return {
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                name: item.product.name,
                
                price: finalPrice, // <-- INI YANG MEMPERBAIKI HARGA 0
                
                variant: variantInfo,
                image: (item.product.images as any)?.[0] || 'https://placehold.co/100',
                quantity: item.quantity,
                storeName: 'Mandes Store',
                selected: true
            };
        });

        res.json(formattedData);

    } catch (error) {
        console.error("Get Cart Error:", error);
        res.status(500).json({ error: "Gagal mengambil keranjang" });
    }
};

// ==========================================
// 2. TAMBAH KE KERANJANG (POST /api/cart)
// ==========================================
export const addToCart = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        console.log("🚀 [CART_POST] Data Diterima:", {
            userId,
            body: req.body,
            cookies: req.cookies // Pastikan cookie 'token' ada di sini
        });

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { productId, quantity, variantId } = req.body;

        if (!productId || !quantity) {
            return res.status(400).json({ error: "Data produk atau quantity tidak lengkap" });
        }

        // 1. Pastikan User punya Cart
        let userCart = await prisma.cart.findUnique({
            where: { userId }
        });

        if (!userCart) {
            userCart = await prisma.cart.create({
                data: { userId }
            });
        }

        // 2. Cek Item di Cart
        const existingItem = await prisma.cartItem.findFirst({
            where: { 
                cartId: userCart.id,
                productId,
                variantId: variantId || null 
            }
        });

        if (existingItem) {
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: existingItem.quantity + quantity }
            });
        } else {
            await prisma.cartItem.create({
                data: {
                    cartId: userCart.id,
                    productId,
                    variantId: variantId || null,
                    quantity
                }
            });
        }

        res.json({ message: "Berhasil masuk keranjang" });

    } catch (error) {
        console.error("Add Cart Error:", error);
        res.status(500).json({ error: "Gagal menambah item" });
    }
};

// ==========================================
// 3. UPDATE QUANTITY (POST /api/cart/sync)
// ==========================================
export const updateCartQuantity = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const { productId, quantity, variantId } = req.body;

        const userCart = await prisma.cart.findUnique({ where: { userId } });
        if (!userCart) return res.status(404).json({ error: "Cart not found" });

        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: userCart.id,
                productId,
                variantId: variantId || null
            }
        });

        if (!existingItem) {
            return res.status(404).json({ error: "Item tidak ditemukan" });
        }

        await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: quantity }
        });

        res.json({ message: "Quantity updated" });

    } catch (error) {
        console.error("Update Cart Error:", error);
        res.status(500).json({ error: "Gagal update quantity" });
    }
};

// ==========================================
// 4. HAPUS ITEM (DELETE /api/cart/:id)
// ==========================================
export const deleteCartItem = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        
        // FIX: Paksa TypeScript menganggap req.params sebagai object dengan id string
        const { id } = req.params as { id: string }; 

        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Cek kepemilikan
        const itemToDelete = await prisma.cartItem.findUnique({
            where: { id }, // TypeScript sekarang tau 'id' pasti string
            include: { cart: true }
        });

        if (!itemToDelete) {
            return res.status(404).json({ error: "Item tidak ditemukan" });
        }

        // Sekarang akses .cart aman karena query di atas valid
        if (itemToDelete.cart.userId !== userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        await prisma.cartItem.delete({
            where: { id }
        });

        res.json({ message: "Item dihapus" });

    } catch (error) {
        console.error("Delete Cart Error:", error);
        res.status(500).json({ error: "Gagal menghapus item" });
    }
};