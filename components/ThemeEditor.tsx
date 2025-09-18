'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Palette, Upload, Eye, Save } from 'lucide-react';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Label } from '@/lib/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/lib/components/ui/select';
import { Switch } from '@/lib/components/ui/switch';
import { useToast } from '@/lib/hooks/use-toast';
import type { Tenant } from '@/shared/schema';

const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  accentColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
  fontFamily: z.string(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  hidePlatformBranding: z.boolean(),
});

type ThemeForm = z.infer<typeof themeSchema>;

interface ThemeEditorProps {
  tenant: Tenant;
  onSave: (theme: ThemeForm) => Promise<void>;
}

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Source Sans Pro', label: 'Source Sans Pro' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Merriweather', label: 'Merriweather' },
];

export function ThemeEditor({ tenant, onSave }: ThemeEditorProps) {
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const form = useForm<ThemeForm>({
    resolver: zodResolver(themeSchema),
    defaultValues: {
      primaryColor: tenant.theme?.primaryColor || '#6366F1',
      secondaryColor: tenant.theme?.secondaryColor || '#EC4899',
      accentColor: tenant.theme?.accentColor || '#10B981',
      fontFamily: tenant.theme?.fontFamily || 'Inter',
      logoUrl: tenant.theme?.logoUrl || '',
      hidePlatformBranding: tenant.theme?.hidePlatformBranding || false,
    },
  });

  const watchedValues = form.watch();

  // Apply theme preview
  useEffect(() => {
    if (isPreview) {
      const root = document.documentElement;
      root.style.setProperty('--primary', watchedValues.primaryColor);
      root.style.setProperty('--secondary', watchedValues.secondaryColor);
      root.style.setProperty('--accent', watchedValues.accentColor);
      root.style.setProperty('--font-family', watchedValues.fontFamily);
    }
    
    return () => {
      if (isPreview) {
        // Reset to original values
        const root = document.documentElement;
        root.style.setProperty('--primary', tenant.theme?.primaryColor || '#6366F1');
        root.style.setProperty('--secondary', tenant.theme?.secondaryColor || '#EC4899');
        root.style.setProperty('--accent', tenant.theme?.accentColor || '#10B981');
        root.style.setProperty('--font-family', tenant.theme?.fontFamily || 'Inter');
      }
    };
  }, [isPreview, watchedValues, tenant.theme]);

  const handleSave = async (data: ThemeForm) => {
    setIsSaving(true);
    try {
      await onSave(data);
      toast({
        title: 'Theme Saved',
        description: 'Your theme settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save theme settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Theme Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2" size={20} />
            Theme Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            {/* Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Colors</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="primaryColor"
                      type="color"
                      {...form.register('primaryColor')}
                      className="w-16 h-10 p-1 border rounded"
                      data-testid="input-primary-color"
                    />
                    <Input
                      type="text"
                      {...form.register('primaryColor')}
                      className="flex-1"
                      placeholder="#6366F1"
                    />
                  </div>
                  {form.formState.errors.primaryColor && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.primaryColor.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="secondaryColor"
                      type="color"
                      {...form.register('secondaryColor')}
                      className="w-16 h-10 p-1 border rounded"
                      data-testid="input-secondary-color"
                    />
                    <Input
                      type="text"
                      {...form.register('secondaryColor')}
                      className="flex-1"
                      placeholder="#EC4899"
                    />
                  </div>
                  {form.formState.errors.secondaryColor && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.secondaryColor.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="accentColor"
                      type="color"
                      {...form.register('accentColor')}
                      className="w-16 h-10 p-1 border rounded"
                      data-testid="input-accent-color"
                    />
                    <Input
                      type="text"
                      {...form.register('accentColor')}
                      className="flex-1"
                      placeholder="#10B981"
                    />
                  </div>
                  {form.formState.errors.accentColor && (
                    <p className="text-sm text-red-600 mt-1">
                      {form.formState.errors.accentColor.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Typography</h3>
              
              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={form.watch('fontFamily')}
                  onValueChange={(value) => form.setValue('fontFamily', value)}
                >
                  <SelectTrigger className="mt-1" data-testid="select-font-family">
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    {fontOptions.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <span style={{ fontFamily: font.value }}>
                          {font.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Branding */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Branding</h3>
              
              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="logoUrl"
                    type="url"
                    {...form.register('logoUrl')}
                    className="flex-1"
                    placeholder="https://example.com/logo.png"
                    data-testid="input-logo-url"
                  />
                  <Button type="button" variant="outline" size="sm">
                    <Upload size={16} />
                  </Button>
                </div>
                {form.formState.errors.logoUrl && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.logoUrl.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="hidePlatformBranding">Hide Platform Branding</Label>
                  <p className="text-sm text-gray-600">
                    Remove "Powered by EventFlow" from your pages
                  </p>
                </div>
                <Switch
                  id="hidePlatformBranding"
                  checked={form.watch('hidePlatformBranding')}
                  onCheckedChange={(checked) => form.setValue('hidePlatformBranding', checked)}
                  data-testid="switch-hide-platform-branding"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={togglePreview}
                className="flex-1"
                data-testid="button-toggle-preview"
              >
                <Eye className="mr-2" size={16} />
                {isPreview ? 'Exit Preview' : 'Preview Changes'}
              </Button>
              
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1"
                data-testid="button-save-theme"
              >
                <Save className="mr-2" size={16} />
                {isSaving ? 'Saving...' : 'Save Theme'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="border rounded-lg p-6 space-y-4"
            style={{
              '--preview-primary': watchedValues.primaryColor,
              '--preview-secondary': watchedValues.secondaryColor,
              '--preview-accent': watchedValues.accentColor,
              fontFamily: watchedValues.fontFamily,
            } as React.CSSProperties}
          >
            {/* Header Preview */}
            <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                {watchedValues.logoUrl ? (
                  <img 
                    src={watchedValues.logoUrl} 
                    alt="Logo preview"
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: watchedValues.primaryColor }}
                  >
                    T
                  </div>
                )}
                <span className="font-bold text-gray-900">{tenant.name}</span>
              </div>
              <div 
                className="px-4 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: watchedValues.primaryColor }}
              >
                Host Event
              </div>
            </div>

            {/* Hero Section Preview */}
            <div 
              className="p-6 rounded-lg text-white"
              style={{ 
                background: `linear-gradient(135deg, ${watchedValues.primaryColor}, ${watchedValues.secondaryColor})`
              }}
            >
              <h2 className="text-2xl font-bold mb-2">Sample Event Title</h2>
              <p className="mb-4 opacity-90">
                This is how your event pages will look with the selected theme.
              </p>
              <div 
                className="inline-block px-6 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: watchedValues.accentColor }}
              >
                Register Now
              </div>
            </div>

            {/* Content Preview */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: watchedValues.accentColor }}
                />
                <span>Feature with accent color</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Card Title</h4>
                  <p className="text-sm text-gray-600">Sample content in your chosen font.</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Another Card</h4>
                  <p className="text-sm text-gray-600">Consistent typography throughout.</p>
                </div>
              </div>
            </div>

            {/* Footer Preview */}
            <div className="bg-gray-900 text-white p-4 rounded-lg text-center">
              <p className="text-sm">
                © 2024 {tenant.name}. All rights reserved.
              </p>
              {!watchedValues.hidePlatformBranding && (
                <p className="text-xs text-gray-400 mt-2">
                  Powered by EventFlow Platform
                </p>
              )}
            </div>
          </div>

          {/* Color Values Display */}
          <div className="mt-6 space-y-2">
            <h4 className="font-semibold text-sm">CSS Variables:</h4>
            <div className="bg-gray-50 p-3 rounded-lg text-xs font-mono space-y-1">
              <div>--primary: {hexToHsl(watchedValues.primaryColor).h}, {hexToHsl(watchedValues.primaryColor).s}%, {hexToHsl(watchedValues.primaryColor).l}%</div>
              <div>--secondary: {hexToHsl(watchedValues.secondaryColor).h}, {hexToHsl(watchedValues.secondaryColor).s}%, {hexToHsl(watchedValues.secondaryColor).l}%</div>
              <div>--accent: {hexToHsl(watchedValues.accentColor).h}, {hexToHsl(watchedValues.accentColor).s}%, {hexToHsl(watchedValues.accentColor).l}%</div>
              <div>--font-family: {watchedValues.fontFamily}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
