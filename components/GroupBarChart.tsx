'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
// Type definition for bar chart data
export interface barChartData {
  project: string;
  values: {
    APPROVED: number;
    PENDING: number;
    REJECTED: number;
    DRAFT: number;
  };
}

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className='flex items-center justify-center h-full w-full'>
      <div className='flex flex-col space-y-3'>
        <Skeleton className='h-[125px] w-[250px] rounded-xl' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-[250px]' />
          <Skeleton className='h-4 w-[200px]' />
        </div>
      </div>
    </div>
  ),
});

// Colors for each category
const colors = {
  Approved: '#5CCC89',
  Pending: '#FFDC0D',
  Rejected: '#E58484',
  Draft: '#49ABFF',
} as const;

// Categories (bar labels within each group)
const categories: Array<keyof typeof colors> = [
  'Approved',
  'Pending',
  'Rejected',
  'Draft',
];

type barchart = {
  barChartData: barChartData[];
};

const GroupBarChart = (props: barchart) => {
  const { barChartData } = props;
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () =>
      setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setLoading(!barChartData || barChartData.length === 0);
  }, [barChartData]);

  // Fixed chart height for vertical bars
  const chartHeight = 300;

  // Dynamic width based on number of projects (for horizontal scrolling)
  const minWidth = 600;
  const widthPerProject = 100;
  const dynamicWidth = Math.max(
    minWidth,
    barChartData.length * widthPerProject
  );

  // Ensure each project has a unique identifier
  const projectsWithIds = barChartData.map((project, index) => ({
    ...project,
    id: `project-${index}`,
  }));

  // Generate traces for each category (Approved, Pending, Rejected, Draft) - VERTICAL bars
  const traces: Partial<Plotly.PlotData>[] = categories.map((category) => {
    return {
      x: projectsWithIds.map((project) => project.project),
      y: projectsWithIds.map(
        (project) =>
          project.values[category.toUpperCase() as keyof typeof project.values]
      ),
      type: 'bar',
      name: category,
      marker: {
        color: colors[category],
        cornerradius: 4,
      },
      hovertemplate: `<b>${category}</b><br>Count: %{y}<extra></extra>`,
    };
  });

  const layout: Partial<Plotly.Layout> = {
    width: dynamicWidth,
    height: chartHeight,
    barmode: 'group',
    margin: { t: 20, r: 20, l: 50, b: 80 },
    xaxis: {
      type: 'category',
      tickfont: {
        family: 'Poppins, var(--font-poppins)',
        size: 11,
        weight: 600,
        color: isDark ? '#FFFFFFB2' : '#000000B2',
      },
      tickangle: 0,
    },
    yaxis: {
      tickfont: {
        family: 'Poppins, var(--font-poppins)',
        size: 11,
        weight: 600,
        color: isDark ? '#FFFFFFB2' : '#000000B2',
      },
      zeroline: false,
      tickvals: [0, 3000, 6000, 9000, 12000],
      ticktext: ['0', '3000', '6000', '9000', '12000'],
      gridcolor: isDark ? '#374151' : '#E5E7EB',
      gridwidth: 1,
    },
    font: {
      family: 'Poppins, var(--font-poppins)',
      size: 10,
      weight: 400,
      color: isDark ? '#FFFFFFB2' : '#000000B2',
    },
    showlegend: false,
    bargap: 0.2,
    bargroupgap: 0.1,
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
  };

  const config: Partial<Plotly.Config> = {
    responsive: false,
    displaylogo: false,
    displayModeBar: false,
  };

  return (
    <div className='flex flex-col' style={{ minHeight: '0' }}>
      {loading ? (
        <div className='flex items-center justify-center h-full w-full'>
          <div className='flex flex-col space-y-3'>
            <Skeleton className='h-[125px] w-[250px] rounded-xl' />
            <div className='space-y-2'>
              <Skeleton className='h-4 w-[250px]' />
              <Skeleton className='h-4 w-[200px]' />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ minWidth: `${dynamicWidth}px` }}>
          <Plot
            data={traces as Plotly.Data[]}
            layout={layout}
            config={config}
            style={{ width: `${dynamicWidth}px`, height: `${chartHeight}px` }}
          />
        </div>
      )}
    </div>
  );
};

export default GroupBarChart;
