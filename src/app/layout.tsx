import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { RealTimeProvider } from '@/components/RealTimeProvider';
import { NotificationToaster } from '@/components/NotificationToaster';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <AuthProvider>
            <RealTimeProvider>
              <SidebarProvider>
                {children}
                <NotificationToaster />
              </SidebarProvider>
            </RealTimeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
