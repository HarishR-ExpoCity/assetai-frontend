'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { addBasePath } from 'next/dist/client/add-base-path';
import { Users } from 'lucide-react';
import GroupBarChart from '@/components/GroupBarChart';
import DonutChart from '@/components/DonutChart';
import { Projects, columns } from '@/components/table/dashboardcolumns';
import { DataTable } from '@/components/table/data-table';
import { useAccessToken } from '@/hooks/useAccessToken';

export type DonutChartData = {
  label: string;
  value: number;
  color: string;
};

export type barChartData = {
  project: string;
  values: {
    PENDING: number;
    DRAFT: number;
    APPROVED: number;
    REJECTED: number;
  };
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<Projects[]>([]);
  const [donutData, setDonutData] = useState<DonutChartData[]>([]);
  const [barChartData, setBarChartData] = useState<barChartData[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  const { accessToken, getAccessToken, idToken } = useAccessToken();

  const fetchDashboardData = async (
    sortby?: string,
    sortorder?: string,
    path?: string
  ) => {
    if (accessToken !== null) {
      try {
        let url = `${process.env.NEXT_PUBLIC_AIASSET_API_BASE_URL}/sharepoint/dashboard`;

        const queryParams = new URLSearchParams({
          ...(path && { path }),
        });

        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
        setIsDataLoading(true);
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${idToken}`,
            Authorization2: `${accessToken}`,
            Accept: 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data.items);
          const donutData = manipulateDonutData(data.charts.donut);
          setDonutData(donutData);
          setBarChartData(data.charts.bar);
          setIsDataLoading(false);
        }
      } catch (error) {
        setIsDataLoading(false);
        console.error('Failed to fetch file list:', error);
      }
    }
  };

  useEffect(() => {
    if (accessToken == null) {
      getAccessToken();
    }
  }, [accessToken, getAccessToken]);

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const colorMap: { [key: string]: string } = {
    approved: '#5CCC89',
    pending: '#F59E0B',
    rejected: '#EF4444',
    draft: '#3B82F6',
  };

  const manipulateDonutData = (
    donutData: DonutChartData[]
  ): DonutChartData[] => {
    return donutData.map((file) => ({
      ...file,
      color: colorMap[file.label.toLowerCase()] || file.color || '#CCCCCC', // Fallback to existing color or default gray
    }));
  };

  // Calculate summary percentages for the header (3 decimal places to match donut chart)
  const totalFiles = donutData.reduce((sum, item) => sum + item.value, 0);
  const getPercentage = (label: string) => {
    const item = donutData.find(
      (d) => d.label.toUpperCase() === label.toUpperCase()
    );
    if (!item || totalFiles === 0) return '0';
    return ((item.value / totalFiles) * 100).toFixed(3);
  };

  return (
    <div className='h-[calc(100vh-105px)] flex flex-col'>
      <div className='flex-1 overflow-auto no-scrollbar pb-4'>
        {/* Charts Section - Side by Side */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4'>
          {/* Project Performance Overview (Bar Chart) - Left Side */}
          <div className='lg:col-span-8 card-shadow rounded-xl dark:border-[#FFFFFF26] p-4'>
            <div className='flex items-center gap-2 mb-1'>
              <Image
                src={addBasePath('/icons/graph.svg')}
                alt='Graph'
                width={20}
                height={20}
              />
              <h2 className='text-base font-semibold tracking-[0.005em]'>
                Project Performance Overview
              </h2>
            </div>
            <div className='text-xs text-gray-600 dark:text-gray-400 mb-4'>
              <span>All Projects- </span>
              <span style={{ color: colorMap.approved }}>
                Approved:{getPercentage('approved')}%
              </span>
              <span>, </span>
              <span style={{ color: colorMap.pending }}>
                Pending:{getPercentage('pending')} %
              </span>
              <span>, </span>
              <span style={{ color: colorMap.rejected }}>
                Rejected:{getPercentage('rejected')}%
              </span>
            </div>
            <div className='overflow-x-auto'>
              <GroupBarChart barChartData={barChartData} />
            </div>
          </div>

          {/* Status Distribution (Donut Chart) - Right Side */}
          <div className='lg:col-span-4 card-shadow rounded-xl dark:border-[#FFFFFF26] p-4'>
            <div className='flex items-center gap-2 mb-4'>
              <Users size={20} color='#9810FA' />
              <h2 className='text-base font-semibold tracking-[0.005em]'>
                Status Distribution
              </h2>
            </div>
            <DonutChart donutData={donutData} />
          </div>
        </div>

        {/* Data Table Section */}
        <div className='rounded-xl dark:border-[#FFFFFF26]'>
          <DataTable
            columns={columns}
            data={dashboardData}
            isDataLoading={isDataLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
