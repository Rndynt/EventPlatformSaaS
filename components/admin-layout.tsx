'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  BarChart3,
  Menu,
  X,
  Building,
  Sparkles
} from 'lucide-react'
import { Button } from '@/lib/components/ui/button'
import { Card } from '@/lib/components/ui/card'
import { Badge } from '@/lib/components/ui/badge'
import { Separator } from '@/lib/components/ui/separator'
import { ThemeToggle } from './theme-toggle'
import type { Tenant } from '@/shared/schema'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: React.ReactNode
  tenant: Tenant
}

export function AdminLayout({ children, tenant }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Dashboard',
      href: `/admin/${tenant.slug}`,
      icon: LayoutDashboard,
      current: pathname === `/admin/${tenant.slug}`
    },
    {
      name: 'Events',
      href: `/admin/${tenant.slug}/events`,
      icon: Calendar,
      current: pathname.startsWith(`/admin/${tenant.slug}/events`)
    },
    {
      name: 'Analytics',
      href: `/admin/${tenant.slug}/analytics`,
      icon: BarChart3,
      current: pathname.startsWith(`/admin/${tenant.slug}/analytics`)
    },
    {
      name: 'Attendees',
      href: `/admin/${tenant.slug}/attendees`,
      icon: Users,
      current: pathname.startsWith(`/admin/${tenant.slug}/attendees`)
    },
    {
      name: 'Settings',
      href: `/admin/${tenant.slug}/settings`,
      icon: Settings,
      current: pathname.startsWith(`/admin/${tenant.slug}/settings`)
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              {tenant.theme?.logoUrl ? (
                <img 
                  src={tenant.theme.logoUrl} 
                  alt={`${tenant.name} logo`}
                  className="w-6 h-6 rounded"
                />
              ) : (
                <Building className="w-4 h-4 text-primary-foreground" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-card-foreground">{tenant.name}</h2>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
            data-testid="button-close-sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  item.current
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                data-testid={`nav-${item.name.toLowerCase()}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4">
          <Card className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="text-xs">
                Free
              </Badge>
              <Sparkles className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Upgrade for advanced features and unlimited events
            </p>
            <Button size="sm" className="w-full" data-testid="button-upgrade">
              Upgrade Plan
            </Button>
          </Card>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                data-testid="button-open-sidebar"
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-semibold text-foreground">
                  Dashboard
                </h1>
                <Badge variant="outline" className="text-xs">
                  {tenant.slug}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Button variant="outline" size="sm" data-testid="button-view-site">
                <Link href={`/${tenant.slug}`} target="_blank">
                  View Site
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}