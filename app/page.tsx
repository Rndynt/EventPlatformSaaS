import Link from 'next/link'
import { Button } from '@/lib/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/lib/components/ui/card'
import { Badge } from '@/lib/components/ui/badge'
import { Separator } from '@/lib/components/ui/separator'
import { CheckCircle, ArrowRight, Sparkles, Users, Calendar, Zap } from 'lucide-react'

export default function PlatformHomePage() {
  const businessTypes = [
    {
      type: 'webinar',
      title: 'Webinar & Online Events',
      description: 'Create professional webinars, online workshops, and virtual events with integrated registration and payment systems.',
      icon: '💻',
      iconComponent: Calendar,
      features: ['Live Streaming', 'Auto Registration', 'Digital Certificates'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      type: 'concerts',
      title: 'Concerts & Music Festivals',
      description: 'Manage concerts, music festivals, and entertainment events with digital ticketing systems.',
      icon: '🎵',
      iconComponent: Users,
      features: ['Digital Tickets', 'QR Check-in', 'Artist Management'],
      color: 'from-purple-500 to-pink-500'
    },
    {
      type: 'equipment_rental',
      title: 'Sound System Rental',
      description: 'Comprehensive platform for renting musical equipment, sound systems, and event gear.',
      icon: '🔊',
      iconComponent: Zap,
      features: ['Equipment Catalog', 'Booking Calendar', 'Payment System'],
      color: 'from-orange-500 to-red-500'
    },
    {
      type: 'wedding',
      title: 'Wedding Organizer',
      description: 'Complete wedding management system for packages, vendors, and event timelines.',
      icon: '💒',
      iconComponent: Sparkles,
      features: ['Wedding Packages', 'Vendor Management', 'Timeline Planner'],
      color: 'from-pink-500 to-rose-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  EventPlatform
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Professional Multi-Tenant Event Management
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/login">
                <Button variant="ghost" className="font-medium" data-testid="button-login">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg" data-testid="button-register">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-indigo-600/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-6 text-sm font-medium px-4 py-2">
              🚀 Trusted by 1000+ Event Organizers
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Event Management
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            Create professional landing pages for any type of event business.
            <br className="hidden md:block" />
            From webinars to concerts, wedding planning to equipment rental.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300" data-testid="button-start-free">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-2" data-testid="button-view-demo">
                View Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Business Types */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 text-sm font-medium px-4 py-2">
              ✨ Choose Your Business Type
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
              Built for Every Event Business
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Each business type gets a customized dashboard and professionally designed templates
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {businessTypes.map((business, index) => {
              const IconComponent = business.iconComponent
              return (
                <Card 
                  key={business.type} 
                  className={`group hover:shadow-2xl hover:scale-105 transition-all duration-300 border-0 shadow-lg bg-gradient-to-br ${business.color} p-0.5 cursor-pointer`}
                  data-testid={`card-business-${business.type}`}
                >
                  <div className="bg-white rounded-lg p-6 h-full">
                    <CardHeader className="text-center p-0 mb-6">
                      <div className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br ${business.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {business.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <CardDescription className="text-base text-muted-foreground mb-6 leading-relaxed">
                        {business.description}
                      </CardDescription>
                      <div className="space-y-3">
                        {business.features.map((feature) => (
                          <div key={feature} className="flex items-center text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                            <span className="text-gray-700 font-medium">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Button 
                        variant="ghost" 
                        className="w-full mt-6 group-hover:bg-gray-50 transition-colors"
                        data-testid={`button-explore-${business.type}`}
                      >
                        Explore Templates
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </CardContent>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Demo Links */}
      <section id="demo" className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 text-sm font-medium px-4 py-2">
              🎯 See It In Action
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-6">
              Live Demo Examples
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore real working examples of our platform in action
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/demo/webinar/advanced-react-patterns" className="group">
              <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-blue-200" data-testid="card-demo-webinar">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">Webinar Demo</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="mb-4">
                    Advanced React Patterns Workshop
                  </CardDescription>
                  <Button variant="outline" className="w-full group-hover:bg-blue-50 transition-colors" data-testid="button-demo-webinar">
                    View Demo
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/startup/workshop/fullstack-bootcamp" className="group">
              <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-purple-200" data-testid="card-demo-workshop">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">Workshop Demo</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="mb-4">
                    Full-Stack Development Bootcamp
                  </CardDescription>
                  <Button variant="outline" className="w-full group-hover:bg-purple-50 transition-colors" data-testid="button-demo-workshop">
                    View Demo
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/musicfest/concert/summer-music-festival" className="group">
              <Card className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-transparent hover:border-pink-200" data-testid="card-demo-concert">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">Concert Demo</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="mb-4">
                    Summer Music Festival Experience
                  </CardDescription>
                  <Button variant="outline" className="w-full group-hover:bg-pink-50 transition-colors" data-testid="button-demo-concert">
                    View Demo
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    EventPlatform
                  </h3>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md leading-relaxed">
                The most powerful multi-tenant event management platform. 
                Create professional event experiences that convert.
              </p>
              <div className="flex space-x-4">
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" data-testid="button-footer-start">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Platform</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Templates</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integration</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <Separator className="bg-gray-700 mb-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              &copy; 2024 EventPlatform. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-gray-400">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}