import { ShoppingCart, User, CreditCard, MapPin, Package, Truck, CheckCircle } from 'lucide-react'

const orderSteps = [
  { icon: User, title: 'Login', desc: 'Daftar dengan WhatsApp' },
  { icon: ShoppingCart, title: 'Pilih Produk', desc: 'Tambah ke keranjang' },
  { icon: Package, title: 'Pilih Varian', desc: 'Rasa & ukuran' },
  { icon: MapPin, title: 'Isi Alamat', desc: 'Alamat lengkap' },
  { icon: Truck, title: 'Pilih Kurir', desc: 'Estimasi ongkir' },
  { icon: CreditCard, title: 'Pembayaran', desc: 'QRIS, Transfer, E-Wallet' },
  { icon: CheckCircle, title: 'Konfirmasi', desc: 'Pesanan diproses' },
]

export default function HowToOrderSection() {
  return (
    <section className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-orange mb-4">
          Cara Pemesanan
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Proses pemesanan yang mudah dan cepat, hanya dalam 7 langkah sederhana
        </p>
      </div>

      {/* Desktop View - Horizontal */}
      <div className="hidden md:grid grid-cols-7 gap-4">
        {orderSteps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={index} className="relative">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-orange rounded-full flex items-center justify-center shadow-lg">
                  <Icon className="text-white" size={28} />
                </div>
                <div className="text-sm font-semibold text-gray-800">
                  {step.title}
                </div>
                <div className="text-xs text-gray-600">
                  {step.desc}
                </div>
              </div>
              {index < orderSteps.length - 1 && (
                <div className="absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-2rem)] h-0.5 bg-primary-orange/30" />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile View - Vertical */}
      <div className="md:hidden space-y-4">
        {orderSteps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={index} className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-gradient-orange rounded-full flex items-center justify-center flex-shrink-0">
                <Icon className="text-white" size={24} />
              </div>
              <div>
                <div className="font-semibold text-gray-800">{step.title}</div>
                <div className="text-sm text-gray-600">{step.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}