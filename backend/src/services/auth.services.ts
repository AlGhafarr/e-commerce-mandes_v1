import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Nanti kita uncomment ini setelah setup Prisma Schema
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia_super_aman_123';

export const authService = {
  // 1. REGISTER
  async register(userData: any) {
    const { name, email, password, phone } = userData;

    // Cek user exists (Simulasi DB)
    // const existingUser = await prisma.user.findUnique({ where: { email } });
    // if (existingUser) throw new Error('Email sudah terdaftar');

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan ke DB (Simulasi)
    // const newUser = await prisma.user.create({
    //   data: { name, email, phone, password: hashedPassword }
    // });

    return { 
      message: 'Registrasi berhasil', 
      user: { name, email, phone } // Return data tanpa password
    };
  },

  // 2. LOGIN
  async login(credentials: any) {
    const { email, password } = credentials;

    // Cari user (Simulasi)
    // const user = await prisma.user.findUnique({ where: { email } });
    // if (!user) throw new Error('User tidak ditemukan');

    // Dummy User untuk test sebelum DB connect
    const user = { 
        id: 1, 
        email: 'user@example.com', 
        password: '$2a$10$wI...', // Hash dummy
        role: 'user' 
    };

    // Validasi Password
    // const isMatch = await bcrypt.compare(password, user.password);
    // if (!isMatch) throw new Error('Password salah');

    // Generate Token
    const token = jwt.sign(
      { id: user.id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '1d' }
    );

    return { token, user: { id: user.id, email: user.email } };
  }
};