'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Star, 
  Plus,
  Settings,
  BarChart3,
  Ticket,
  Search,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Badge } from '@/lib/components/ui/badge';
import { AdminTable } from './AdminTable';
import type { Tenant } from '@/shared/schema';

interface AdminDashboardProps {
  tenant: Tenant;
}

interface DashboardStats {
  totalEvents: number;
  totalRegistrations: number;
  totalRevenue: number;
  avgRating: number;
  growthStats: {
    events: number;
    registrations: number;
    revenue: number;
  };
}

interface EventSummary {
  id: string;
  title: string;
  type: string;
  date: string;
  registrations: number;
  capacity: number;
  revenue: number;
  status: string;
}

export function AdminDashboard({ tenant }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    avgRating: 0,
    growthStats: { events: 0, registrations: 0, revenue: 0 }
  });
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [tenant.id]);

  const fetchDashboardData = async () => {
    try {
      // Fetch analytics data
      const analyticsResponse = await fetch(`/api/v1/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id })
      });

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        
        setStats({
          totalEvents: analyticsData.summary?.totalEvents || 0,
          totalRegistrations: analyticsData.summary?.totalTickets || 0,
          totalRevenue: analyticsData.summary?.totalRevenue || 0,
          avgRating: 4.8, // This would come from a separate ratings system
          growthStats: {
            events: 12, // Mock growth percentages
            registrations: 18,
            revenue: 15
          }
        });

        // Transform events data for table
        const eventsData: EventSummary[] = analyticsData.events?.map((event: any) => ({
          id: event.id,
          title: event.title,
          type: event.type,
          date: new Date().toISOString(), // This would come from event data
          registrations: event.tickets,
          capacity: 500, // This would come from event data
          revenue: event.revenue,
          status: 'Active' // This would be determined from event dates
        })) || [];

        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const eventColumns = [
    {
      key: 'title',
      label: 'Event',
      sortable: true,
      render: (value: string, row: EventSummary) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{row.type}</div>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'registrations',
      label: 'Registrations',
      sortable: true,
      render: (value: number, row: EventSummary) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">
            {row.capacity ? `/ ${row.capacity}` : ''}
          </div>
        </div>
      )
    },
    {
      key: 'revenue',
      label: 'Revenue',
      sortable: true,
      render: (value: number) => 
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'Active' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      )
    }
  ];

  const handleEditEvent = (event: EventSummary) => {
    window.location.href = `/admin/${tenant.slug}/events/${event.id}/edit`;
  };

  const handleViewEvent = (event: EventSummary) => {
    window.open(`/${tenant.slug}/${event.type}/${event.title.toLowerCase().replace(/\s+/g, '-')}`, '_blank');
  };

  const handleDeleteEvent = (event: EventSummary) => {
    if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
      // Implement delete functionality
      console.log('Delete event:', event.id);
    }
  };

  const handleExportEvents = () => {
    // Generate CSV export
    const csvContent = [
      ['Title', 'Type', 'Date', 'Registrations', 'Revenue', 'Status'],
      ...events.map(event => [
        event.title,
        event.type,
        new Date(event.date).toLocaleDateString(),
        event.registrations.toString(),
        event.revenue.toString(),
        event.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tenant.slug}-events-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your events.
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/${tenant.slug}/events/create`}>
            <Plus className="mr-2" size={16} />
            New Event
          </Link>
        </Button>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-card-foreground" data-testid="text-total-events">
              {stats.totalEvents}
            </div>
            <div className="text-sm text-primary mt-2">
              <span>+{stats.growthStats.events}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registrations
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-card-foreground" data-testid="text-total-registrations">
              {stats.totalRegistrations.toLocaleString()}
            </div>
            <div className="text-sm text-primary mt-2">
              <span>+{stats.growthStats.registrations}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-card-foreground" data-testid="text-total-revenue">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0
              }).format(stats.totalRevenue)}
            </div>
            <div className="text-sm text-primary mt-2">
              <span>+{stats.growthStats.revenue}% revenue growth</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-card-foreground" data-testid="text-avg-rating">
              {stats.avgRating.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Based on recent feedback
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">Recent Events</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminTable
            data={events}
            columns={eventColumns}
            title=""
            searchPlaceholder="Search events..."
            onEdit={handleEditEvent}
            onView={handleViewEvent}
            onDelete={handleDeleteEvent}
            onExport={handleExportEvents}
            actions={[
              {
                label: 'View Analytics',
                onClick: (event) => console.log('View analytics for', event.id),
                icon: BarChart3 as any
              },
              {
                label: 'Manage Tickets',
                onClick: (event) => console.log('Manage tickets for', event.id),
                icon: Ticket as any
              }
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
