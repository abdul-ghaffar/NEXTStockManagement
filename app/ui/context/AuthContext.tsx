"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

export type User = {
  ID: number;
  Name: string;
  IsAdmin: number | boolean;
  ClientTypeID?: number | null;
};

type AuthContextType = {
  user: User | null;
  login: (name: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  setUserState: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // hydrate from localStorage for client display
    try {
      const raw = localStorage.getItem("ta_user");
      if (raw) setUser(JSON.parse(raw));
    } catch (err) {
      // ignore
    }
  }, []);

  const login = useCallback(async (name: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        try {
          localStorage.setItem("ta_user", JSON.stringify(data.user));
        } catch (err) {}
        return { ok: true };
      }
      return { ok: false, message: data?.message || "Login failed" };
    } catch (err) {
      console.error(err);
      return { ok: false, message: "Network error" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error(err);
    }
    setUser(null);
    try {
      localStorage.removeItem("ta_user");
    } catch (err) {}
    // navigate to signin
    try {
      router.push("/signin");
    } catch (err) {}
  }, [router]);

  const setUserState = useCallback((u: User | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem("ta_user", JSON.stringify(u));
      else localStorage.removeItem("ta_user");
    } catch (err) {}
  }, []);

  const value = useMemo(() => ({ user, login, logout, setUserState }), [user, login, logout, setUserState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
