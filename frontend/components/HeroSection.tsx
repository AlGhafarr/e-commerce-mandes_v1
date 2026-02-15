'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-gradient-orange rounded-3xl p-8 md:p-16 shadow-2xl">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-white space-y-6"
          >
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Cemilan Lezat
              <br />
              <span className="text-primary-cream">Untuk Keluarga</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-cream/90">
              Nikmati berbagai pilihan snack berkualitas dengan harga terjangkau.
              Cocok untuk segala momen kebersamaan!
            </p>
            <div className="flex gap-4">
              <button className="px-8 py-4 bg-white text-primary-orange rounded-xl font-semibold hover:shadow-xl transition-all">
                Belanja Sekarang
              </button>
              <button className="px-8 py-4 border-2 border-white text-white rounded-xl font-semibold hover:bg-white hover:text-primary-orange transition-all">
                Lihat Promo
              </button>
            </div>
          </motion.div>

          {/* Animated Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[400px] hidden md:block"
          >
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              {/* Placeholder untuk animasi interaktif */}
              <div className="text-center">
                <div className="text-8xl mb-4">🍿</div>
                <p className="text-white text-xl font-semibold">
                  Animasi Interaktif
                </p>
                <p className="text-primary-cream/80 text-sm mt-2">
                  (Dapat diatur via Admin Dashboard)
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}