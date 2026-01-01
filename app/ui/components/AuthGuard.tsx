"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/ui/context/AuthContext";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await fetch("/api/auth/me", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            auth.setUserState(data.user);
            if (mounted) setLoading(false);
            return;
          }
        }
        // not authenticated -> redirect to signin with next param
        const next = window.location.pathname + window.location.search;
        router.replace(`/signin?next=${encodeURIComponent(next)}`);
      } catch (err) {
        console.error(err);
        const next = window.location.pathname + window.location.search;
        router.replace(`/signin?next=${encodeURIComponent(next)}`);
      }
    }
    check();
    return () => { mounted = false; };
  }, [router]);

  if (loading) return <div className="p-8">Checking authentication...</div>;

  return <>{children}</>;
}
