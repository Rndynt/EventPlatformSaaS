'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Globe, Mail, CreditCard } from 'lucide-react';
import { Button } from '@/client/src/components/ui/button';
import { Input } from '@/client/src/components/ui/input';
import { Label } from '@/client/src/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/client/src/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/src/components/ui/select';
import { ThemeEditor } from './ThemeEditor';
import { useToast } from '@/client/src/hooks/use-toast';
import type { Tenant } from '@/shared/schema';

const settingsSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
  email: z.string().email('Invalid email address'),
  domains: z.array(z.string()),
  timezone: z.string(),
  currency: z.string(),
  allowRegistration: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

interface TenantSettingsProps {
  tenant: Tenant;
}

export function TenantSettings({ tenant }: TenantSettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [customDomain, setCustomDomain] = useState('');
  const { toast } = useToast();

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: tenant.name,
      email: tenant.email,
      domains: tenant.domains || [],
      timezone: tenant.settings?.timezone || 'UTC',
      currency: tenant.settings?.currency || 'USD',
      allowRegistration: tenant.settings?.allowRegistration ?? true,
    },
  });

  const handleSaveSettings = async (data: SettingsForm) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          domains: data.domains,
          settings: {
            timezone: data.timezone,
            currency: data.currency,
            allowRegistration: data.allowRegistration,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: 'Settings Saved',
        description: 'Your organization settings have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTheme = async (themeData: any) => {
    const response = await fetch(`/api/v1/tenants/${tenant.id}/theme`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme: themeData }),
    });

    if (!response.ok) {
      throw new Error('Failed to save theme');
    }
  };

  const handleAddDomain = () => {
    if (!customDomain.trim()) return;
    
    const domains = form.getValues('domains');
    if (!domains.includes(customDomain.trim())) {
      form.setValue('domains', [...domains, customDomain.trim()]);
      setCustomDomain('');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    const domains = form.getValues('domains');
    form.setValue('domains', domains.filter(d => d !== domain));
  };

  return (
    <Tabs defaultValue="general" className="space-y-6">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="domains">Domains</TabsTrigger>
        <TabsTrigger value="theme">Theme</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Globe className="mr-2" size={20} />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSaveSettings)} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    className="mt-1"
                    data-testid="input-org-name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Contact Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    className="mt-1"
                    data-testid="input-org-email"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={form.watch('timezone')}
                    onValueChange={(value) => form.setValue('timezone', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={form.watch('currency')}
                    onValueChange={(value) => form.setValue('currency', value)}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto"
                data-testid="button-save-settings"
              >
                <Save className="mr-2" size={16} />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="domains">
        <Card>
          <CardHeader>
            <CardTitle>Custom Domains</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="customDomain">Add Custom Domain</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="customDomain"
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="events.yourcompany.com"
                  className="flex-1"
                  data-testid="input-custom-domain"
                />
                <Button
                  type="button"
                  onClick={handleAddDomain}
                  data-testid="button-add-domain"
                >
                  Add
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Current Domains</h4>
              {form.watch('domains').length === 0 ? (
                <p className="text-gray-500 text-sm">No custom domains configured</p>
              ) : (
                <div className="space-y-2">
                  {form.watch('domains').map((domain, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-mono text-sm">{domain}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveDomain(domain)}
                        data-testid={`button-remove-domain-${index}`}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Domain Setup Instructions</h4>
              <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
                <li>Add your custom domain above</li>
                <li>Create a CNAME record pointing to: <code className="bg-blue-100 px-1 rounded">events.eventflow.com</code></li>
                <li>Add these DNS records for email deliverability:</li>
              </ol>
              <div className="mt-3 bg-blue-100 p-3 rounded font-mono text-xs">
                <div>TXT @ "v=spf1 include:sendgrid.net ~all"</div>
                <div>CNAME s1._domainkey s1.domainkey.u123456.wl.sendgrid.net</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="theme">
        <ThemeEditor tenant={tenant} onSave={handleSaveTheme} />
      </TabsContent>

      <TabsContent value="billing">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2" size={20} />
              Billing & Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Stripe Status</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ? 'Connected' : 'Not Connected'}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">SendGrid Status</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {process.env.SENDGRID_API_KEY ? 'Connected' : 'Not Connected'}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      process.env.SENDGRID_API_KEY ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gray-50 border rounded-lg p-4">
              <h4 className="font-medium mb-2">Integration Setup</h4>
              <p className="text-sm text-gray-600 mb-4">
                Configure your payment and email providers to enable full functionality.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Stripe Payments</span>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SendGrid Email</span>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Twilio SMS</span>
                  <Button variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
