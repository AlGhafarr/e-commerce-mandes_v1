import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_aman_mandes_123';

// Helper: Get User ID from Token
const getUserId = (req: Request) => {
  const token = req.cookies.mandes_admin_token;
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (e) { return null; }
};

// 1. GET CART (User Only)
export const getMyCart = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true, variant: true },
          orderBy: { productId: 'asc' }
        }
      }
    });

    // Jika belum punya keranjang, buat baru
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true, variant: true } } }
      });
    }

    // Format Data untuk Frontend
    const formattedItems = cart.items.map(item => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      storeName: "Mandes Official Store", // Bisa dibuat dinamis nanti
      name: item.product.name,
      variant: item.variant ? `${item.variant.name} (${item.variant.size})` : "Standard",
      price: item.variant ? item.variant.price : item.product.basePrice,
      image: item.product.images[0] || 'https://placehold.co/100', // Ambil gambar pertama
      quantity: item.quantity,
      selected: true // Default selected
    }));

    res.json(formattedItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal mengambil keranjang" });
  }
};

// 2. SYNC / ADD TO CART
// Frontend akan kirim item, backend akan update/create
export const syncCartItem = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { productId, variantId, quantity } = req.body;

    // Pastikan User Punya Cart
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) cart = await prisma.cart.create({ data: { userId } });

    // Cek apakah item sudah ada di cart
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId }
    });

    if (existingItem) {
      // Update Qty
      if (quantity <= 0) {
        await prisma.cartItem.delete({ where: { id: existingItem.id } });
      } else {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity }
        });
      }
    } else if (quantity > 0) {
      // Create New Item
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, variantId, quantity }
      });
    }

    res.json({ message: "Cart updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gagal update keranjang" });
  }
};

// 3. REMOVE ITEM
export const removeCartItem = async (req: Request, res: Response) => {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const { itemId } = req.params;
        const validItemId = Array.isArray(itemId) ? itemId[0] : itemId;
        await prisma.cartItem.delete({ where: { id: validItemId as string } });
        res.json({ message: "Item dihapus" });
    } catch (error) {
        res.status(500).json({ error: "Gagal hapus item" });
    }
};