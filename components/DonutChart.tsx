'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { DonutChartData } from './Dashboard';

// Dynamically import Plotly with SSR disabled to avoid server-side issues
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

type DonutCharts = {
  donutData: DonutChartData[];
};

const DonutChart = (props: DonutCharts) => {
  const { donutData } = props;
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

  const total = donutData.reduce((sum, item) => sum + item.value, 0);

  // Filter out zero values for the chart (Plotly can't render 0-value pie slices)
  const chartData = donutData.filter((item) => item.value > 0);

  // Show loading state only when data is not yet available
  const loading = !donutData || donutData.length === 0;

  function uppercaseToCapitalized(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Calculate percentage for each item (3 decimal places)
  const getPercentage = (value: number) => {
    if (total === 0) return '0';
    return ((value / total) * 100).toFixed(3);
  };

  // Format total with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className='flex flex-col' style={{ flex: '1 1 auto', minHeight: '0' }}>
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
        <>
          <Plot
            data={[
              {
                values: chartData.map((item) => item.value),
                labels: chartData.map((item) =>
                  uppercaseToCapitalized(item.label)
                ),
                type: 'pie',
                hole: 0.7,
                pull: Array(chartData.length).fill(0.01),
                marker: {
                  colors: chartData.map((item) => item.color),
                },
                textinfo: 'none',
                textposition: 'outside',
                texttemplate: '',
                hoverinfo: 'label+value+percent',
                hovertemplate:
                  '<b>%{label}</b><br>Count: %{value:,}<br>Percentage: %{percent:.3%}<extra></extra>',
                textfont: {
                  size: 10,
                  family: 'Poppins, var(--font-poppins)',
                  color: '#000000B2',
                },
              },
            ]}
            layout={{
              autosize: true,
              height: 250,
              showlegend: false,
              margin: { t: 10, b: 10, l: 10, r: 10 },
              annotations: [
                {
                  text: `<b>${formatNumber(total)}</b>`,
                  font: {
                    size: 28,
                    color: isDark ? '#FFFFFF' : '#101828',
                    family: 'Poppins, var(--font-poppins)',
                  },
                  showarrow: false,
                  align: 'center',
                  x: 0.5,
                  y: 0.55,
                  xanchor: 'center',
                  yanchor: 'middle',
                },
                {
                  text: 'Total Files',
                  font: {
                    size: 12,
                    color: isDark ? '#9CA3AF' : '#6A7282',
                    family: 'Poppins, var(--font-poppins)',
                  },
                  showarrow: false,
                  align: 'center',
                  x: 0.5,
                  y: 0.42,
                  xanchor: 'center',
                  yanchor: 'middle',
                },
              ],
              font: {
                family: 'Poppins, var(--font-poppins)',
              },
              plot_bgcolor: 'transparent',
              paper_bgcolor: 'transparent',
            }}
            config={{
              responsive: true,
              displaylogo: false,
              displayModeBar: false,
            }}
            style={{ width: '100%', height: '250px', cursor: 'pointer' }}
          />

          {/* Custom Legend - 2x2 grid showing API categories */}
          <div className='grid grid-cols-2 gap-x-6 gap-y-2 mt-4 px-4'>
            {donutData.map((item) => (
              <div
                key={item.label}
                className='flex items-center justify-between text-[#000000B2] dark:text-[#FFFFFFD9]'
              >
                <div className='flex items-center'>
                  <div
                    className='w-3 h-3 rounded-full mr-2'
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span
                    style={{
                      fontWeight: '600',
                      fontSize: '12px',
                      lineHeight: '16px',
                    }}
                  >
                    {uppercaseToCapitalized(item.label)}
                  </span>
                </div>
                <span
                  style={{
                    fontWeight: '500',
                    fontSize: '12px',
                  }}
                >
                  {getPercentage(item.value)} %
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DonutChart;
