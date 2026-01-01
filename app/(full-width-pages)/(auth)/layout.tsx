import GridShape from "@/app/ui/components/common/GridShape";
import ThemeTogglerTwo from "@/app/ui/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/app/ui/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex w-full h-screen items-center justify-center dark:bg-gray-900 sm:p-0">
          {children}
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
