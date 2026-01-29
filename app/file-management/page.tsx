'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { useEnvConfig } from '@/context/EnvContext';
import Layout from '@/components/Layout';
import { FileUploader } from '@/components/FileUploader';
import { useFileUpload } from '@/hooks/useFileUpload';

export default function FileManagementPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { assetaiApiBaseUrl } = useEnvConfig();
  const router = useRouter();

  const {
    files,
    isUploading,
    addFiles,
    removeFile,
    retryUpload,
    cancelAll,
    clearCompleted,
  } = useFileUpload({
    url: `${assetaiApiBaseUrl}/upload/`,
    maxConcurrent: 3,
    onFileComplete: (file) => {
      if (file.status === 'success') {
        console.log('File uploaded successfully:', file.file.name);
      }
    },
    onAllComplete: (files) => {
      const successCount = files.filter((f) => f.status === 'success').length;
      const errorCount = files.filter((f) => f.status === 'error').length;
      console.log(
        `Upload complete: ${successCount} succeeded, ${errorCount} failed`,
      );
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <Layout>
        <div className='flex items-center justify-center h-[calc(100vh-100px)]'>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className='px-4 py-6 max-w-4xl mx-auto'>
        <div className='card-shadow rounded-xl p-6 dark:border-[#FFFFFF26]'>
          <FileUploader
            files={files}
            isUploading={isUploading}
            onAddFiles={addFiles}
            onRemoveFile={removeFile}
            onRetryUpload={retryUpload}
            onCancelAll={cancelAll}
            onClearCompleted={clearCompleted}
            accept={{
              'application/pdf': ['.pdf'],
              'application/msword': ['.doc'],
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                ['.docx'],
              'text/plain': ['.txt'],
              'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
            }}
            maxSize={50 * 1024 * 1024}
            maxFiles={10}
          />
        </div>
      </div>
    </Layout>
  );
}
