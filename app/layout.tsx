import { Outfit } from 'next/font/google';
import './globals.css';

import { SidebarProvider } from '@/app/ui/context/SidebarContext';
import { ThemeProvider } from '@/app/ui/context/ThemeContext';
import { AuthProvider } from '@/app/ui/context/AuthContext';
import { RealTimeProvider } from '@/app/ui/components/RealTimeProvider';
import { NotificationToaster } from '@/app/ui/components/NotificationToaster';

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
