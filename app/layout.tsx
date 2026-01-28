import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import './globals.css';
import AuthProvider from '@/components/auth/auth-provider';
import { AuthenticationWrapper } from '@/components/auth/AuthenticationWrapper';
import { MaterialSymbolsFont } from '@/components/MaterialSymbolsFont';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning className={cn('no-scrollbar')}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <script dangerouslySetInnerHTML={setInitialColorMode()} />
      </head>
      <body className={`${poppins.variable} antialiased`}>
        <MaterialSymbolsFont />
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
      </body>
    </html>
  );
}
