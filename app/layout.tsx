import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { unstable_noStore as noStore } from 'next/cache';
import { PublicEnvScript } from 'next-runtime-env';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import './globals.css';
import AuthProvider from '@/components/auth/auth-provider';
import { AuthenticationWrapper } from '@/components/auth/AuthenticationWrapper';
import { MaterialSymbolsFont } from '@/components/MaterialSymbolsFont';
import { EnvProvider } from '@/context/EnvContext';

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['300', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Asset AI',
  description: 'Dome file manager',
};

// This script will run before any React code, immediately applying dark mode if needed
function setInitialColorMode() {
  return {
    __html: `
      (function() {
        // Check for stored theme preference and system preference
        function getInitialColorMode() {
          const savedTheme = window.localStorage.getItem('theme');
          const hasSavedTheme = typeof savedTheme === 'string';
          
          if (hasSavedTheme) {
            return savedTheme;
          }
          
          // Check system preference
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const hasSystemPreference = typeof mediaQuery.matches === 'boolean';
          
          if (hasSystemPreference) {
            return mediaQuery.matches ? 'dark' : 'light';
          }
          
          // Default to light
          return 'light';
        }
        
        const colorMode = getInitialColorMode();
        const root = document.documentElement;
        
        // Apply the dark class directly to the document root
        // Applying the class is enough - we'll use CSS to set the background color
        colorMode === 'dark' 
          ? root.classList.add('dark')
          : root.classList.remove('dark');
      })();
    `,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Opt out of static rendering to read env vars at runtime
  noStore();

  const envConfig = {
    assetaiApiBaseUrl: process.env.NEXT_PUBLIC_ASSETAI_API_BASE_URL || '',
  };

  return (
    <html lang='en' suppressHydrationWarning className={cn('no-scrollbar')}>
      <head>
        <PublicEnvScript />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <script dangerouslySetInnerHTML={setInitialColorMode()} />
      </head>
      <body className={`${poppins.variable} antialiased`}>
        <MaterialSymbolsFont />
        <EnvProvider config={envConfig}>
          <AuthProvider>
            <AuthenticationWrapper>
              <ThemeProvider
                attribute='class'
                defaultTheme='light'
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </AuthenticationWrapper>
          </AuthProvider>
        </EnvProvider>
      </body>
    </html>
  );
}
