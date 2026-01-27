'use client';

import React, { useEffect } from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import { useRouter } from 'next/navigation';

import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return (
    <Layout>
      <main className='flex flex-col w-full px-4'>
        <Dashboard />
      </main>
    </Layout>
  );
}
