"use client";

import { publicAsset } from "@/lib/site-path";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  auth as authApi,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  me as meApi,
  setTokens,
  type User,
  type RegisterEmpresaPayload,
  type RegisterSindicoPayload,
} from "@/lib/api";

export type { RegisterEmpresaPayload, RegisterSindicoPayload };

export interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  registerSindico: (data: RegisterSindicoPayload) => Promise<void>;
  registerEmpresa: (data: RegisterEmpresaPayload) => Promise<void>;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Avoid double-bootstrap in StrictMode dev double-render.
  const bootstrappedRef = useRef(false);

  const reset = useCallback(() => {
    clearTokens();
    setUser(null);
    setAccessToken(null);
  }, []);

  // Hydration: read tokens from localStorage and verify with /me.
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const storedAccess = getAccessToken();
    const storedRefresh = getRefreshToken();

    if (!storedAccess && !storedRefresh) {
      setIsLoading(false);
      return;
    }

    setAccessToken(storedAccess);

    let cancelled = false;
    (async () => {
      try {
        const fresh = await meApi.get();
        if (cancelled) return;
        setUser(fresh);
        // request() may have refreshed the token under the hood — sync state.
        const latest = getAccessToken();
        if (latest) setAccessToken(latest);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          reset();
        } else {
          // Network/server hiccup: keep tokens but mark unauthenticated for now.
          // The next page interaction will retry.
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reset]);

  // Listen for global logout events fired by the API client (refresh failure).
  useEffect(() => {
    function onLogout() {
      setUser(null);
      setAccessToken(null);
    }
    window.addEventListener("auth:logout", onLogout);
    return () => window.removeEventListener("auth:logout", onLogout);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const data = await authApi.login({ email, password });
    setTokens(data.access_token, data.refresh_token);
    setAccessToken(data.access_token);
    setUser(data.user);
    return data.user;
  }, []);

  const registerSindico = useCallback(async (data: RegisterSindicoPayload) => {
    const res = await authApi.registerSindico(data);
    setTokens(res.access_token, res.refresh_token);
    setAccessToken(res.access_token);
    setUser(res.user);
  }, []);

  const registerEmpresa = useCallback(async (data: RegisterEmpresaPayload) => {
    const res = await authApi.registerEmpresa(data);
    setTokens(res.access_token, res.refresh_token);
    setAccessToken(res.access_token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    void authApi.logout();
    reset();
    // Navegação "dura" para a home: garante estado de visitante limpo em toda a
    // app (o Perfil é overlay por estado interno, não muda com a URL), sem que o
    // usuário precise dar refresh manual.
    if (typeof window !== "undefined") window.location.assign(publicAsset("/"));
  }, [reset]);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      registerSindico,
      registerEmpresa,
      logout,
      updateUser,
    }),
    [user, accessToken, isLoading, login, registerSindico, registerEmpresa, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}
