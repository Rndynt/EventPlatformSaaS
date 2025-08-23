'use client';

import React, { useState, useEffect } from 'react';
import { CheckinScanner } from '@/components/CheckinScanner';
import { Button } from '@/client/src/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/src/components/ui/card';
import { Input } from '@/client/src/components/ui/input';
import { Label } from '@/client/src/components/ui/label';
import { Badge } from '@/client/src/components/ui/badge';
import { QrCode, Users, Clock, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '@/client/src/hooks/use-toast';

interface CheckinData {
  ticket: {
    id: string;
    token: string;
    status: string;
  };
  attendee: {
    name: string;
    email: string;
    company?: string;
  };
  event: {
    title: string;
    type: string;
    startDate: string;
    location?: string;
  };
}

interface PendingCheckin {
  token: string;
  timestamp: string;
  attendeeName: string;
}

export default function CheckinPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({
    totalCheckins: 0,
    todayCheckins: 0,
    pendingSync: 0
  });
  const [pendingCheckins, setPendingCheckins] = useState<PendingCheckin[]>([]);
  const [manualToken, setManualToken] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load pending checkins from localStorage
    const saved = localStorage.getItem('pendingCheckins');
    if (saved) {
      setPendingCheckins(JSON.parse(saved));
    }

    // Load stats from localStorage
    const savedStats = localStorage.getItem('checkinStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Sync pending checkins when online
    if (isOnline && pendingCheckins.length > 0) {
      syncPendingCheckins();
    }
  }, [isOnline, pendingCheckins]);

  const handleScan = async (token: string) => {
    await performCheckin(token);
  };

  const handleManualCheckin = async () => {
    if (!manualToken.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a ticket token',
        variant: 'destructive',
      });
      return;
    }

    await performCheckin(manualToken.trim());
    setManualToken('');
  };

  const performCheckin = async (token: string) => {
    try {
      if (!isOnline) {
        // Store for offline sync
        const pendingCheckin: PendingCheckin = {
          token,
          timestamp: new Date().toISOString(),
          attendeeName: 'Unknown', // Will be filled when synced
        };

        const newPending = [...pendingCheckins, pendingCheckin];
        setPendingCheckins(newPending);
        localStorage.setItem('pendingCheckins', JSON.stringify(newPending));

        const newStats = {
          ...stats,
          pendingSync: stats.pendingSync + 1
        };
        setStats(newStats);
        localStorage.setItem('checkinStats', JSON.stringify(newStats));

        toast({
          title: 'Offline Check-in',
          description: 'Check-in queued for sync when online',
        });
        return;
      }

      const response = await fetch('/api/v1/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          gateId: 'gate-1',
          operatorId: 'operator-1',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      // Update stats
      const newStats = {
        ...stats,
        totalCheckins: stats.totalCheckins + 1,
        todayCheckins: stats.todayCheckins + 1,
      };
      setStats(newStats);
      localStorage.setItem('checkinStats', JSON.stringify(newStats));

      toast({
        title: 'Check-in Successful',
        description: `${data.attendee.name} checked in successfully`,
      });
    } catch (error) {
      console.error('Check-in error:', error);
      toast({
        title: 'Check-in Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const syncPendingCheckins = async () => {
    if (!isOnline || pendingCheckins.length === 0) return;

    let successCount = 0;
    const remaining: PendingCheckin[] = [];

    for (const pending of pendingCheckins) {
      try {
        const response = await fetch('/api/v1/checkin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: pending.token,
            gateId: 'gate-1',
            operatorId: 'operator-1',
            notes: `Offline checkin from ${pending.timestamp}`,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          remaining.push(pending);
        }
      } catch (error) {
        console.error('Sync error for token:', pending.token, error);
        remaining.push(pending);
      }
    }

    setPendingCheckins(remaining);
    localStorage.setItem('pendingCheckins', JSON.stringify(remaining));

    if (successCount > 0) {
      const newStats = {
        ...stats,
        totalCheckins: stats.totalCheckins + successCount,
        todayCheckins: stats.todayCheckins + successCount,
        pendingSync: remaining.length,
      };
      setStats(newStats);
      localStorage.setItem('checkinStats', JSON.stringify(newStats));

      toast({
        title: 'Sync Complete',
        description: `${successCount} check-ins synced successfully`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Event Check-in</h1>
              <p className="text-gray-600 mt-2">Scan tickets or enter manually</p>
            </div>
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Wifi size={16} className="mr-1" />
                  Online
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <WifiOff size={16} className="mr-1" />
                  Offline
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalCheckins}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Today's Check-ins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.todayCheckins}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Sync
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {stats.pendingSync}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Check-in Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2" size={20} />
                QR Code Scanner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CheckinScanner onScan={handleScan} />
            </CardContent>
          </Card>

          {/* Manual Check-in */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2" size={20} />
                Manual Check-in
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="manual-token">Ticket Token</Label>
                <Input
                  id="manual-token"
                  placeholder="Enter ticket token..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleManualCheckin();
                    }
                  }}
                  data-testid="input-manual-token"
                />
              </div>
              <Button 
                onClick={handleManualCheckin}
                className="w-full"
                data-testid="button-manual-checkin"
              >
                Check In
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pending Sync Queue */}
        {pendingCheckins.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2" size={20} />
                Pending Sync ({pendingCheckins.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingCheckins.slice(0, 5).map((pending, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{pending.token}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(pending.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}
                {pendingCheckins.length > 5 && (
                  <div className="text-sm text-gray-500 text-center">
                    ... and {pendingCheckins.length - 5} more
                  </div>
                )}
              </div>
              {isOnline && (
                <Button 
                  onClick={syncPendingCheckins}
                  className="w-full mt-4"
                  data-testid="button-sync-pending"
                >
                  Sync Now
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
