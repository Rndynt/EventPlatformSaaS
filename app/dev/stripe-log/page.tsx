'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Badge } from '@/lib/components/ui/badge';
import { Button } from '@/lib/components/ui/button';
import { CreditCard, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/lib/components/ui/dialog';

interface StripeLogEntry {
  id: string;
  timestamp: string;
  type: 'payment_intent' | 'webhook' | 'error' | 'simulation';
  data: any;
  status: 'success' | 'pending' | 'failed';
  amount?: number;
  currency?: string;
}

export default function StripeLogPage() {
  const [logs, setLogs] = useState<StripeLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<StripeLogEntry | null>(null);

  useEffect(() => {
    // In a real implementation, this would fetch from the dev log store
    // For now, we'll simulate some Stripe logs
    const mockLogs: StripeLogEntry[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'simulation',
        status: 'success',
        amount: 2900,
        currency: 'USD',
        data: {
          paymentIntentId: 'pi_dev_1234567890',
          clientSecret: 'pi_dev_1234567890_secret_test',
          metadata: {
            eventId: 'event-123',
            ticketId: 'ticket-456'
          }
        }
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        type: 'webhook',
        status: 'success',
        data: {
          type: 'payment_intent.succeeded',
          paymentIntentId: 'pi_dev_0987654321',
          amount: 0,
          metadata: {
            eventId: 'event-456',
            ticketId: 'ticket-789'
          }
        }
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'error',
        status: 'failed',
        data: {
          error: 'Stripe API key not configured',
          attempted_operation: 'create_payment_intent',
          fallback_used: true
        }
      }
    ];

    setLogs(mockLogs);
  }, []);

  const clearLogs = () => {
    setLogs([]);
    setSelectedLog(null);
  };

  const refreshLogs = () => {
    // In a real implementation, this would fetch fresh logs
    console.log('Refreshing Stripe logs...');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment_intent':
      case 'simulation':
        return <CreditCard size={16} />;
      case 'webhook':
        return <RefreshCw size={16} />;
      case 'error':
        return <AlertCircle size={16} />;
      default:
        return <CreditCard size={16} />;
    }
  };

  const formatAmount = (amount?: number, currency?: string) => {
    if (amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <CreditCard className="mr-3" size={32} />
                Stripe Development Log
              </h1>
              <p className="text-gray-600 mt-2">
                Stripe operations in development mode (API keys not configured)
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {logs.length} entries
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshLogs}
                data-testid="button-refresh-logs"
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </Button>
              {logs.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearLogs}
                  data-testid="button-clear-logs"
                >
                  <Trash2 size={16} className="mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Stripe Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Public Key</span>
                <Badge variant={process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ? 'default' : 'destructive'}>
                  {process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ? 'Configured' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Secret Key</span>
                <Badge variant={process.env.STRIPE_SECRET_KEY ? 'default' : 'destructive'}>
                  {process.env.STRIPE_SECRET_KEY ? 'Configured' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Webhook Secret</span>
                <Badge variant={process.env.STRIPE_WEBHOOK_SECRET ? 'default' : 'destructive'}>
                  {process.env.STRIPE_WEBHOOK_SECRET ? 'Configured' : 'Missing'}
                </Badge>
              </div>
            </div>
            
            {(!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || !process.env.STRIPE_SECRET_KEY) && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Setup Instructions</h4>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                  <li>Go to <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="underline">Stripe Dashboard</a></li>
                  <li>Copy your Publishable key (starts with pk_) → NEXT_PUBLIC_STRIPE_PUBLIC_KEY</li>
                  <li>Copy your Secret key (starts with sk_) → STRIPE_SECRET_KEY</li>
                  <li>Set up webhook endpoint → STRIPE_WEBHOOK_SECRET</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logs Display */}
        {logs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Stripe operations yet</h3>
              <p className="text-gray-600">
                Stripe operations will appear here when running in development mode
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <Card 
                key={log.id} 
                className="cursor-pointer transition-colors hover:bg-gray-50"
                onClick={() => setSelectedLog(log)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(log.type)}
                        <span className="font-medium capitalize">
                          {log.type.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <Badge className={getStatusColor(log.status)}>
                        {log.status}
                      </Badge>
                      
                      {log.amount !== undefined && (
                        <span className="text-sm font-mono">
                          {formatAmount(log.amount, log.currency)}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      {log.data.paymentIntentId && (
                        <div className="text-xs text-gray-500 font-mono">
                          {log.data.paymentIntentId}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Log Detail Modal */}
        {selectedLog && (
          <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  {getTypeIcon(selectedLog.type)}
                  <span>Stripe {selectedLog.type.replace('_', ' ')} Details</span>
                  <Badge className={getStatusColor(selectedLog.status)}>
                    {selectedLog.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Timestamp</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                
                {selectedLog.amount !== undefined && (
                  <div>
                    <h4 className="font-medium mb-2">Amount</h4>
                    <p className="text-sm text-gray-600">
                      {formatAmount(selectedLog.amount, selectedLog.currency)}
                    </p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Raw Data</h4>
                  <div className="bg-gray-50 rounded-lg p-4 overflow-auto">
                    <pre className="text-xs text-gray-800">
                      {JSON.stringify(selectedLog.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
