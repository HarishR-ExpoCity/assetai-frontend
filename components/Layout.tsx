import React from 'react';

import Header from '@/components/Header';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className='min-h-screen'>
      <div className='fixed top-0 left-0 right-0'>
        <Header />
      </div>
      <div className='pt-[105px]'>
        {children} {/* Render the children (content from specific routes) */}
      </div>
    </div>
  );
}
