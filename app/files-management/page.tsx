'use client';

import React, { useEffect } from 'react';
import { useIsAuthenticated } from '@azure/msal-react';
import { useRouter } from 'next/navigation';

import Layout from '@/components/Layout';
import FilesManagement from '@/components/FileManagement/FilesManagement';

export default function FilesManagementPage() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return (
    <Layout>
      <FilesManagement />
    </Layout>
  );
}
