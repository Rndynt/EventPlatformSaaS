'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Badge } from '@/lib/components/ui/badge';
import { Button } from '@/lib/components/ui/button';
import { Mail, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/lib/components/ui/dialog';

interface DevEmail {
  id: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  timestamp: string;
}

export default function DevMailboxPage() {
  const [emails, setEmails] = useState<DevEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<DevEmail | null>(null);

  useEffect(() => {
    // In a real implementation, this would fetch from a dev email store
    // For now, we'll simulate some emails
    const mockEmails: DevEmail[] = [
      {
        id: '1',
        to: 'john@example.com',
        subject: 'Your ticket for Advanced React Patterns',
        html: '<html><body><h1>Your Event Ticket</h1><p>Thank you for registering!</p></body></html>',
        text: 'Your Event Ticket - Thank you for registering!',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        to: 'jane@example.com',
        subject: 'Event Reminder: Workshop starts in 24 hours',
        html: '<html><body><h1>Event Reminder</h1><p>Don\'t forget about your upcoming workshop!</p></body></html>',
        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      },
    ];

    setEmails(mockEmails);
  }, []);

  const deleteEmail = (id: string) => {
    setEmails(emails.filter(email => email.id !== id));
    if (selectedEmail?.id === id) {
      setSelectedEmail(null);
    }
  };

  const clearAll = () => {
    setEmails([]);
    setSelectedEmail(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Mail className="mr-3" size={32} />
                Dev Mailbox
              </h1>
              <p className="text-gray-600 mt-2">
                Emails sent in development mode (SendGrid not configured)
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                {emails.length} emails
              </Badge>
              {emails.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAll}
                  data-testid="button-clear-all"
                >
                  <Trash2 size={16} className="mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>

        {emails.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Mail size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No emails yet</h3>
              <p className="text-gray-600">
                Emails will appear here when sent in development mode
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Email List */}
            <div className="space-y-4">
              {emails.map((email) => (
                <Card 
                  key={email.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedEmail?.id === email.id ? 'ring-2 ring-primary' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedEmail(email)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium text-gray-900 truncate">
                          {email.subject}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          To: {email.to}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteEmail(email.id);
                        }}
                        data-testid={`button-delete-${email.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {new Date(email.timestamp).toLocaleString()}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        HTML
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Email Preview */}
            <div>
              {selectedEmail ? (
                <Card className="sticky top-8">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {selectedEmail.subject}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          To: {selectedEmail.to}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(selectedEmail.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye size={16} className="mr-2" />
                            Full View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>{selectedEmail.subject}</DialogTitle>
                          </DialogHeader>
                          <div 
                            className="mt-4 border rounded-lg p-4"
                            dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                      <div 
                        dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                        className="prose prose-sm max-w-none"
                      />
                    </div>
                    {selectedEmail.text && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          Plain Text Version:
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono">
                          {selectedEmail.text}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Eye size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Select an email
                    </h3>
                    <p className="text-gray-600">
                      Click on an email from the list to preview it
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
