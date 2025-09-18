import Link from 'next/link'
import { Button } from '@/lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/lib/components/ui/card'

export default function PlatformHomePage() {
  const businessTypes = [
    {
      type: 'webinar',
      title: 'Webinar & Online Events',
      description: 'Buat webinar, workshop online, dan acara virtual dengan fitur registrasi dan pembayaran',
      icon: '💻',
      features: ['Live streaming', 'Registrasi otomatis', 'Sertifikat digital']
    },
    {
      type: 'concerts',
      title: 'Konser & Festival Musik',
      description: 'Kelola konser, festival musik, dan acara hiburan dengan sistem tiket digital',
      icon: '🎵',
      features: ['Tiket digital', 'QR code check-in', 'Manajemen artis']
    },
    {
      type: 'equipment_rental',
      title: 'Penyewaan Sound System',
      description: 'Platform sewa alat musik, sound system, dan equipment acara',
      icon: '🔊',
      features: ['Katalog equipment', 'Booking calendar', 'Sistem pembayaran']
    },
    {
      type: 'wedding',
      title: 'Wedding Organizer',
      description: 'Kelola paket pernikahan, vendor, dan timeline acara pernikahan',
      icon: '💒',
      features: ['Paket pernikahan', 'Vendor management', 'Timeline planner']
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EventPlatform</h1>
              <p className="text-gray-600">Platform Multi-Tenant untuk Event Management</p>
            </div>
            <div className="space-x-4">
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Daftar Sekarang</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Platform Event Management
            <span className="text-blue-600"> untuk Semua Bisnis</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Buat halaman landing yang professional untuk berbagai jenis bisnis event. 
            Dari webinar hingga konser, dari wedding organizer hingga penyewaan equipment.
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-3">
              Mulai Gratis Sekarang
            </Button>
          </Link>
        </div>
      </section>

      {/* Business Types */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pilih Jenis Bisnis Anda
            </h2>
            <p className="text-xl text-gray-600">
              Setiap jenis bisnis mendapat dashboard dan template yang disesuaikan
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessTypes.map((business) => (
              <Card key={business.type} className="hover:shadow-lg transition-shadow">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-2">{business.icon}</div>
                  <CardTitle className="text-lg">{business.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {business.description}
                  </CardDescription>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {business.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Links */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Lihat Demo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/demo/webinar/advanced-react-patterns" className="block">
              <Button variant="outline" className="w-full">
                Demo Webinar
              </Button>
            </Link>
            <Link href="/startup/workshop/fullstack-bootcamp" className="block">
              <Button variant="outline" className="w-full">
                Demo Workshop
              </Button>
            </Link>
            <Link href="/musicfest/concert/summer-music-festival" className="block">
              <Button variant="outline" className="w-full">
                Demo Konser
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 EventPlatform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
