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
      features: ['Live Streaming', 'Auto Registration', 'Digital Certificates']
    },
    {
      type: 'concerts',
      title: 'Concerts & Music Festivals',
      description: 'Manage concerts, music festivals, and entertainment events with digital ticketing systems.',
      icon: '🎵',
      iconComponent: Users,
      features: ['Digital Tickets', 'QR Check-in', 'Artist Management']
    },
    {
      type: 'equipment_rental',
      title: 'Sound System Rental',
      description: 'Comprehensive platform for renting musical equipment, sound systems, and event gear.',
      icon: '🔊',
      iconComponent: Zap,
      features: ['Equipment Catalog', 'Booking Calendar', 'Payment System']
    },
    {
      type: 'wedding',
      title: 'Wedding Organizer',
      description: 'Complete wedding management system for packages, vendors, and event timelines.',
      icon: '💒',
      iconComponent: Sparkles,
      features: ['Wedding Packages', 'Vendor Management', 'Timeline Planner']
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
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
                <Button className="shadow-lg" data-testid="button-register">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <Badge variant="secondary" className="mb-6 text-sm font-medium px-4 py-2">
              🚀 Trusted by 1000+ Event Organizers
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-8 text-foreground">
            Event Management
            <br />
            Made Simple
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
            Create professional landing pages for any type of event business.
            <br className="hidden md:block" />
            From webinars to concerts, wedding planning to equipment rental.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-4 shadow-xl hover:shadow-2xl transition-all duration-300" data-testid="button-start-free">
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4" data-testid="button-view-demo">
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
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 text-sm font-medium px-4 py-2">
              ✨ Choose Your Business Type
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
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
                  className="group hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer border-border/50"
                  data-testid={`card-business-${business.type}`}
                >
                  <CardHeader className="text-center p-6 pb-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold text-card-foreground">
                      {business.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <CardDescription className="text-base text-muted-foreground mb-6 leading-relaxed">
                      {business.description}
                    </CardDescription>
                    <div className="space-y-3 mb-6">
                      {business.features.map((feature) => (
                        <div key={feature} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-primary mr-3 flex-shrink-0" />
                          <span className="text-card-foreground font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full group-hover:bg-accent transition-colors"
                      data-testid={`button-explore-${business.type}`}
                    >
                      Explore Templates
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Demo Links */}
      <section id="demo" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-6 text-sm font-medium px-4 py-2">
              🎯 See It In Action
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Live Demo Examples
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore real working examples of our platform in action
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/demo/webinar/advanced-react-patterns" className="group">
              <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-border/50" data-testid="card-demo-webinar">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold">Webinar Demo</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="mb-4">
                    Advanced React Patterns Workshop
                  </CardDescription>
                  <Button variant="outline" className="w-full group-hover:bg-accent transition-colors" data-testid="button-demo-webinar">
                    View Demo
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/startup/workshop/fullstack-bootcamp" className="group">
              <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-border/50" data-testid="card-demo-workshop">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold">Workshop Demo</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="mb-4">
                    Full-Stack Development Bootcamp
                  </CardDescription>
                  <Button variant="outline" className="w-full group-hover:bg-accent transition-colors" data-testid="button-demo-workshop">
                    View Demo
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/musicfest/concert/summer-music-festival" className="group">
              <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-300 border-border/50" data-testid="card-demo-concert">
                <CardHeader className="text-center pb-4">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold">Concert Demo</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="mb-4">
                    Summer Music Festival Experience
                  </CardDescription>
                  <Button variant="outline" className="w-full group-hover:bg-accent transition-colors" data-testid="button-demo-concert">
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
      <footer className="bg-muted/30 border-t border-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    EventPlatform
                  </h3>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                The most powerful multi-tenant event management platform. 
                Create professional event experiences that convert.
              </p>
              <div className="flex space-x-4">
                <Link href="/register">
                  <Button data-testid="button-footer-start">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4 text-foreground">Platform</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Templates</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Integration</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4 text-foreground">Support</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <Separator className="bg-border mb-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm mb-4 md:mb-0">
              &copy; 2024 EventPlatform. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}