"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { api } from "./api";
import { useAppStore } from "./store";
import type { AuthUser } from "./types";

type MeResponse = {
  user: Omit<AuthUser, "factories">;
  factories: AuthUser["factories"];
  activeFactory?: AuthUser["factories"][number] | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  isReady: boolean;
  login: (user: AuthUser, activeFactoryId?: string | null) => void;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const factoryId = useAppStore((state) => state.factoryId);
  const setFactoryId = useAppStore((state) => state.setFactoryId);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const response = await api.get<MeResponse>("/auth/me");
        const nextUser: AuthUser = {
          ...response.data.user,
          factories: response.data.factories,
        };
        setUser(nextUser);

        const nextFactoryId =
          (factoryId &&
            response.data.factories.some((factory) => factory.id === factoryId) &&
            factoryId) ||
          response.data.activeFactory?.id ||
          response.data.factories[0]?.id ||
          null;

        setFactoryId(nextFactoryId);
      } catch {
        setUser(null);
        setFactoryId(null);
      } finally {
        setIsReady(true);
      }
    };

    hydrate();
  }, [factoryId, setFactoryId]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      login: (nextUser, activeFactoryId) => {
        setUser(nextUser);
        setFactoryId(activeFactoryId || nextUser.factories[0]?.id || null);
      },
      logout: async () => {
        await api.post("/auth/logout");
        setUser(null);
        setFactoryId(null);
        router.push("/login");
      },
      refreshMe: async () => {
        const response = await api.get<MeResponse>("/auth/me");
        const nextUser: AuthUser = {
          ...response.data.user,
          factories: response.data.factories,
        };
        setUser(nextUser);

        const nextFactoryId =
          nextUser.factories.find((factory) => factory.id === factoryId)?.id ||
          response.data.activeFactory?.id ||
          nextUser.factories[0]?.id ||
          null;
        setFactoryId(nextFactoryId);
      },
    }),
    [factoryId, isReady, router, setFactoryId, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
