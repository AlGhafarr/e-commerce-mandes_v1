import { Instagram, Facebook, Twitter, MapPin, Mail, Phone, FileText, Shield } from 'lucide-react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer id="footer" className="bg-gradient-to-b from-gray-900 to-black text-white mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-orange rounded-full flex items-center justify-center">
                <span className="text-xl font-bold">SN</span>
              </div>
              <span className="text-xl font-bold">Mandes Snack & Food</span>
            </div>
            <p className="text-gray-400 text-sm">
              Toko cemilan terpercaya dengan produk berkualitas tinggi untuk keluarga Indonesia.
            </p>
            
            {/* Social Media */}
            <div className="flex gap-3">
              <a href="#" className="p-2 bg-white/10 hover:bg-primary-orange rounded-lg transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="p-2 bg-white/10 hover:bg-primary-orange rounded-lg transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="p-2 bg-white/10 hover:bg-primary-orange rounded-lg transition-colors">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary-orange">Hubungi Kami</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPin size={18} className="flex-shrink-0 mt-1" />
                <div>
                  <p>Jl. Cemilan Enak No. 123</p>
                  <p>Jakarta Selatan, DKI Jakarta 12345</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={18} />
                <a href="tel:+628123456789" className="hover:text-primary-orange">
                  +62 812-3456-789
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <a href="mailto:info@snackparadise.com" className="hover:text-primary-orange">
                  info@snackparadise.com
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary-orange">Informasi</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="hover:text-primary-orange transition-colors">
                  FAQ - Pertanyaan Umum
                </Link>
              </li>
              <li>
                <Link href="/faq#pemesanan" className="hover:text-primary-orange transition-colors">
                  Cara Pemesanan
                </Link>
              </li>
              <li>
                <Link href="/faq#pengiriman" className="hover:text-primary-orange transition-colors">
                  Info Pengiriman
                </Link>
              </li>
              <li>
                <Link href="/faq#pembayaran" className="hover:text-primary-orange transition-colors">
                  Metode Pembayaran
                </Link>
              </li>
              <li>
                <Link href="/faq#pengembalian" className="hover:text-primary-orange transition-colors">
                  Pengembalian & Penukaran
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Certificates */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-primary-orange">Legal & Sertifikat</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Shield size={16} className="text-green-400" />
                <span>Sertifikat Halal MUI</span>
              </li>
              <li className="flex items-center gap-2">
                <FileText size={16} className="text-blue-400" />
                <span>PIRT: 123456789</span>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary-orange transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary-orange transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Platform Links */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <h4 className="text-center text-sm font-semibold mb-4">
            Temukan Kami di Platform Lain
          </h4>
          <div className="flex justify-center gap-4">
            <a href="#" className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-lg text-sm transition-colors">
              Shopee
            </a>
            <a href="#" className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors">
              Tokopedia
            </a>
            <a href="#" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors">
              Blibli
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-gray-800 text-center text-sm text-gray-400">
          <p>© 2024 Mandes Snack & Food. All rights reserved.</p>
          <p className="mt-1">HAKI/Hak Cipta: HC-2024-SNACK-001</p>
        </div>
      </div>
    </footer>
  )
}