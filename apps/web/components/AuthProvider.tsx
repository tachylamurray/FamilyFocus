"use client";

import { api } from "@/lib/api";
import { User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type AuthContextProps = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

type Props = {
  children: React.ReactNode;
};

export default function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Ensure we're in the browser
  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    let mounted = true;
    api
      .me()
      .then((data) => {
        if (mounted) {
          setUser(data.user);
        }
      })
      .catch((error) => {
        // Silently fail - user is not authenticated
        if (mounted) {
          setUser(null);
        }
        // Only log in development
        if (process.env.NODE_ENV === "development") {
          console.error("Auth check failed:", error);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user: loggedIn } = await api.login({ email, password });
      setUser(loggedIn);
      // Use replace instead of push to avoid navigation issues
      if (isBrowser) {
        try {
          router.replace("/");
        } catch (navError) {
          // Fallback to window.location if router fails (e.g., on some mobile browsers)
          window.location.href = "/";
        }
      }
    } catch (error) {
      // Re-throw error so the login page can handle it
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
    if (isBrowser) {
      try {
        router.push("/login");
      } catch (navError) {
        // Fallback to window.location if router fails
        window.location.href = "/login";
      }
    }
  };

  const refreshUser = async () => {
    try {
      const data = await api.me();
      setUser(data.user);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refreshUser
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

