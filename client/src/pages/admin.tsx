import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LogOut, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings, 
  Plus,
  Building2,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  if (!user) {
    setLocation('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
    setLocation('/');
  };

  const quickActions = [
    {
      title: 'Create Event',
      description: 'Create a new event (concert, webinar, or workshop)',
      icon: Plus,
      onClick: () => toast({ title: 'Coming Soon', description: 'Event creation will be available soon.' }),
      color: 'bg-blue-500',
    },
    {
      title: 'Manage Events',
      description: 'View and manage existing events',
      icon: Calendar,
      onClick: () => toast({ title: 'Coming Soon', description: 'Event management will be available soon.' }),
      color: 'bg-green-500',
    },
    {
      title: 'View Analytics',
      description: 'Check event performance and analytics',
      icon: BarChart3,
      onClick: () => toast({ title: 'Coming Soon', description: 'Analytics dashboard will be available soon.' }),
      color: 'bg-purple-500',
    },
    {
      title: 'Settings',
      description: 'Configure tenant settings and preferences',
      icon: Settings,
      onClick: () => toast({ title: 'Coming Soon', description: 'Settings page will be available soon.' }),
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
              <Badge variant="secondary" className="text-xs">
                {user.role}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Building2 className="h-4 w-4" />
                <span>{user.tenant.name}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name}!
            </h2>
            <p className="text-gray-600">
              Manage your events and tenant settings from this dashboard.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">No events yet</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">No attendees yet</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0</div>
                <p className="text-xs text-muted-foreground">No revenue yet</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tenant</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{user.tenant.slug}</div>
                <p className="text-xs text-muted-foreground">{user.tenant.name}</p>
              </CardContent>
            </Card>
          </div>

          <Separator className="my-8" />

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={action.onClick}
                  data-testid={`action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <CardHeader>
                    <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${action.color} text-white mb-2`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{action.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Navigation Back */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              data-testid="button-back-home"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}