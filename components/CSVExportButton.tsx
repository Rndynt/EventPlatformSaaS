'use client';

import React, { useState } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { Button } from '@/lib/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/lib/components/ui/dropdown-menu';
import { useToast } from '@/lib/hooks/use-toast';

interface ExportData {
  [key: string]: any;
}

interface CSVExportButtonProps {
  data: ExportData[];
  filename?: string;
  columns?: {
    key: string;
    label: string;
    format?: (value: any) => string;
  }[];
  onExport?: () => void;
  className?: string;
}

export function CSVExportButton({ 
  data, 
  filename = 'export', 
  columns,
  onExport,
  className = '' 
}: CSVExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const formatValue = (value: any, formatter?: (value: any) => string): string => {
    if (formatter) {
      return formatter(value);
    }
    
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    // Escape quotes and wrap in quotes if contains comma, newline, or quote
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  };

  const generateCSV = (exportData: ExportData[], exportColumns?: typeof columns): string => {
    if (exportData.length === 0) {
      return '';
    }

    // Determine columns to export
    const columnsToExport = exportColumns || Object.keys(exportData[0]).map(key => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim()
    }));

    // Create header row
    const headers = columnsToExport.map(col => col.label);
    const csvContent = [headers.join(',')];

    // Create data rows
    exportData.forEach(row => {
      const values = columnsToExport.map(col => 
        formatValue(row[col.key], col.format)
      );
      csvContent.push(values.join(','));
    });

    return csvContent.join('\n');
  };

  const downloadCSV = (content: string, fileName: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (format: 'all' | 'filtered' | 'summary' = 'all') => {
    if (data.length === 0) {
      toast({
        title: 'Export Failed',
        description: 'No data available to export',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    
    try {
      let exportData = data;
      let exportColumns = columns;
      let filenameSuffix = '';

      switch (format) {
        case 'filtered':
          // Export only specific columns for a cleaner view
          exportColumns = columns?.filter(col => 
            !['id', 'metadata', 'createdAt', 'updatedAt'].includes(col.key)
          ) || exportColumns;
          filenameSuffix = '-filtered';
          break;
          
        case 'summary':
          // Create summary data with key metrics
          const summary = {
            totalRecords: data.length,
            exportDate: new Date().toISOString(),
            recordTypes: data.reduce((acc: Record<string, number>, item) => {
              const type = item.type || item.status || 'unknown';
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {}),
          };
          
          exportData = [summary];
          exportColumns = [
            { key: 'totalRecords', label: 'Total Records' },
            { key: 'exportDate', label: 'Export Date', format: (value) => new Date(value).toLocaleString() },
            { key: 'recordTypes', label: 'Record Types', format: (value) => JSON.stringify(value) },
          ];
          filenameSuffix = '-summary';
          break;
          
        default:
          // Export all data as-is
          break;
      }

      const csvContent = generateCSV(exportData, exportColumns);
      
      if (csvContent) {
        downloadCSV(csvContent, `${filename}${filenameSuffix}`);
        
        if (onExport) {
          onExport();
        }
        
        toast({
          title: 'Export Successful',
          description: `${exportData.length} records exported to CSV`,
        });
      } else {
        throw new Error('Failed to generate CSV content');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getRecordCount = () => {
    if (data.length === 0) return 'No records';
    if (data.length === 1) return '1 record';
    return `${data.length.toLocaleString()} records`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isExporting || data.length === 0}
          className={className}
          data-testid="button-csv-export"
        >
          <Download className="mr-2" size={16} />
          {isExporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 text-sm text-gray-600 border-b">
          {getRecordCount()} available
        </div>
        
        <DropdownMenuItem 
          onClick={() => handleExport('all')}
          disabled={isExporting}
          data-testid="export-all"
        >
          <FileText className="mr-2" size={16} />
          <div>
            <div className="font-medium">Export All Data</div>
            <div className="text-xs text-gray-500">Complete dataset with all columns</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleExport('filtered')}
          disabled={isExporting}
          data-testid="export-filtered"
        >
          <Calendar className="mr-2" size={16} />
          <div>
            <div className="font-medium">Export Filtered</div>
            <div className="text-xs text-gray-500">Key columns only, cleaner format</div>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleExport('summary')}
          disabled={isExporting}
          data-testid="export-summary"
        >
          <Download className="mr-2" size={16} />
          <div>
            <div className="font-medium">Export Summary</div>
            <div className="text-xs text-gray-500">Statistics and overview data</div>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Preset configurations for common export scenarios
export const exportPresets = {
  events: {
    columns: [
      { key: 'title', label: 'Event Title' },
      { key: 'type', label: 'Type' },
      { key: 'startDate', label: 'Start Date', format: (value: Date) => value.toLocaleDateString() },
      { key: 'capacity', label: 'Capacity' },
      { key: 'status', label: 'Status' },
    ],
  },
  
  tickets: {
    columns: [
      { key: 'attendeeName', label: 'Attendee Name' },
      { key: 'email', label: 'Email' },
      { key: 'ticketType', label: 'Ticket Type' },
      { key: 'price', label: 'Price', format: (value: number) => `$${value.toFixed(2)}` },
      { key: 'status', label: 'Status' },
      { key: 'checkedInAt', label: 'Check-in Time', format: (value?: Date) => value ? value.toLocaleString() : 'Not checked in' },
    ],
  },
  
  analytics: {
    columns: [
      { key: 'date', label: 'Date', format: (value: string) => new Date(value).toLocaleDateString() },
      { key: 'event', label: 'Event' },
      { key: 'registrations', label: 'Registrations' },
      { key: 'revenue', label: 'Revenue', format: (value: number) => `$${value.toFixed(2)}` },
      { key: 'conversionRate', label: 'Conversion Rate', format: (value: number) => `${value.toFixed(1)}%` },
    ],
  },
};

// Usage examples:
// <CSVExportButton data={events} filename="events" {...exportPresets.events} />
// <CSVExportButton data={tickets} filename="tickets" {...exportPresets.tickets} />
