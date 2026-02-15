'use client'

export default function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-lg border-2 border-primary-orange/20">
        <div className="grid md:grid-cols-3 gap-8 items-center">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-48 h-48 bg-gradient-orange rounded-full flex items-center justify-center shadow-xl">
              <span className="text-6xl font-bold text-white">SN</span>
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-orange">
              Tentang Kami
            </h2>
            <div className="space-y-3 text-gray-700 leading-relaxed">
              <p>
                Selamat datang di <strong className="text-primary-orange">Mandes Snack & Food</strong>, 
                toko cemilan terpercaya yang menyediakan berbagai pilihan snack berkualitas tinggi 
                untuk keluarga Indonesia.
              </p>
              <p>
                Kami berkomitmen untuk menghadirkan produk-produk pilihan dengan cita rasa yang 
                lezat dan kemasan yang menarik. Setiap produk dipilih dengan cermat untuk memastikan 
                kualitas terbaik sampai ke tangan Anda.
              </p>
              <p>
                Dengan pengalaman bertahun-tahun di industri makanan ringan, kami memahami kebutuhan 
                pelanggan akan cemilan yang tidak hanya enak, tetapi juga higienis dan terjamin 
                kehalalannya.
              </p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-orange">500+</div>
                <div className="text-sm text-gray-600">Produk</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-orange">10K+</div>
                <div className="text-sm text-gray-600">Pelanggan</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-orange">4.9★</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
