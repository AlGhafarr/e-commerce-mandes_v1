import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// 1. GET ALL PRODUCTS
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(products);
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
};

// 2. CREATE PRODUCT
export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, basePrice, stock, images, variants } = req.body;

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        basePrice: parseFloat(basePrice),
        stock: parseInt(stock) || 0,
        images: images || [], 
        variants: {
          create: Array.isArray(variants) ? variants.map((v: any) => ({
            name: v.name,
            size: v.size,
            price: parseFloat(v.price),
            stock: parseInt(v.stock)
          })) : []
        }
      },
      include: { variants: true }
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ error: 'Gagal membuat produk' });
  }
};

// 3. GET PRODUCT BY ID (FIXED)
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      // FIX: Tambahkan 'as string' di sini
      where: { id: id as string }, 
      include: { variants: true }
    });

    if (!product) {
        return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    
    res.json(product);
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    res.status(500).json({ error: 'Error mengambil detail produk' });
  }
};

// 4. DELETE PRODUCT (FIXED)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({ 
      // FIX: Tambahkan 'as string' di sini
      where: { id: id as string } 
    });
    
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ error: 'Gagal menghapus produk' });
  }
};

// 5. UPDATE PRODUCT
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, basePrice, stock, images, variants, category } = req.body;

    // Gunakan Transaction agar aman
    const updatedProduct = await prisma.$transaction(async (tx) => {
      
      // 1. Update Data Utama
      const product = await tx.product.update({
        // FIX: Tambahkan 'as string' agar TypeScript tidak error
        where: { id: id as string }, 
        data: {
          name,
          description,
          category: category || "Snack",
          basePrice: parseFloat(basePrice),
          stock: parseInt(stock) || 0,
          images: images || [],
        }
      });

      // 2. Jika ada data variants yang dikirim, lakukan Replace
      if (variants && Array.isArray(variants)) {
        // A. Hapus semua varian lama
        await tx.variant.deleteMany({ where: { productId: id as string } });

        // B. Buat varian baru
        if (variants.length > 0) {
            await tx.variant.createMany({
            data: variants.map((v: any) => ({
                productId: id as string, // Pastikan ini string juga
                name: v.name,
                size: v.size || '',
                price: parseFloat(v.price),
                stock: parseInt(v.stock)
            }))
            });
        }
      }

      return product;
    });

    // Ambil data terbaru beserta variannya
    const finalResult = await prisma.product.findUnique({
        where: { id: id as string },
        include: { variants: true }
    });

    res.json(finalResult);

  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ error: 'Gagal mengupdate produk' });
  }
};