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
      </head>
      <body className={`${poppins.variable} antialiased`}>
        <MaterialSymbolsFont />
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem
          disableTransitionOnChange
        >
          <EnvProvider config={envConfig}>
            <AuthProvider>
              <AuthenticationWrapper>
                {children}
              </AuthenticationWrapper>
            </AuthProvider>
          </EnvProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
