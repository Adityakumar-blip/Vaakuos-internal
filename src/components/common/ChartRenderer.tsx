import React from 'react';
import { cn } from "@/lib/utils";
// @ts-ignore
import Chart from 'react-apexcharts';
// @ts-ignore
import { ApexOptions } from 'apexcharts';

export type ChartType = 'line' | 'bar' | 'area' | 'donut' | 'pie';

interface ChartRendererProps {
  type: ChartType;
  series: any[];
  options?: ApexOptions;
  height?: number | string;
  className?: string;
  showToolbar?: boolean;
  // Kept for backward compatibility during refactor if needed, but we'll move to series
  data?: any; 
}

/**
 * Common Chart Renderer using ApexCharts for premium look and built-in features
 */
export function ChartRenderer({ 
  type, 
  series, 
  data,
  options: customOptions, 
  height = 350, 
  className,
  showToolbar = true
}: ChartRendererProps) {
  
  // Adapt Chart.js data to Apex series if passed (minimal effort for refactor)
  const finalSeries = series || (data?.datasets?.map((ds: any) => ({
    name: ds.label,
    data: ds.data
  }))) || [];

  const categories = data?.labels || [];

  // Default shared theme options
  const defaultOptions: ApexOptions = {
    chart: {
      toolbar: {
        show: showToolbar, // Use showToolbar prop to control visibility
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      fontFamily: "'Inter', sans-serif",
      background: 'transparent',
      foreColor: '#64748b', // Slate-500 (works well in both)
    },
    theme: {
      mode: 'light', // Default to light, but can be overridden
    },
    stroke: {
      curve: 'smooth',
      width: type === 'line' || type === 'area' ? 3 : 0,
    },
    grid: {
      borderColor: 'rgba(0, 0, 0, 0.05)',
      strokeDashArray: 4,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    },
    tooltip: {
      theme: 'light',
      x: { show: true },
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '12px',
      markers: {
        offsetY: 0,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      },
    },
    xaxis: {
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '11px',
        }
      }
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  };

  // Merge options
  const mergedOptions: ApexOptions = {
    ...defaultOptions,
    ...customOptions,
    chart: {
      ...defaultOptions.chart,
      ...customOptions?.chart,
    },
    xaxis: {
      ...defaultOptions.xaxis,
      ...customOptions?.xaxis,
    },
    yaxis: {
      ...defaultOptions.yaxis,
      ...customOptions?.yaxis,
    },
    grid: {
      ...defaultOptions.grid,
      ...customOptions?.grid,
    },
    legend: {
      ...defaultOptions.legend,
      ...customOptions?.legend,
    }
  };

  // For pie/donut, series is just an array of numbers
  const pieSeries = type === 'pie' || type === 'donut' 
    ? (series || data?.datasets?.[0]?.data || []) 
    : finalSeries;

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <Chart
        options={mergedOptions}
        series={pieSeries}
        type={type}
        height="100%" // Always set ApexChart to fill its container
      />
    </div>
  );
}
