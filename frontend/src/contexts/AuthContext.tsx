/**
 * Session identity lives in the Flask session cookie; this context mirrors
 * GET /api/auth/me and exposes the auth mutations. `demoCode` holds the
 * simulated-email confirmation code so the confirm screen can display it.
 */
import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, post, ApiError, type Me } from "@/lib/api";

export interface SignupPayload {
  role: "owner" | "renter";
  name: string;
  email: string;
  password: string;
  location?: string;
  social_media?: Record<string, string>;
}

interface AuthContextValue {
  user: Me | null;
  isLoading: boolean;
  demoCode: string | null;
  login: (email: string, password: string) => Promise<Me>;
  signup: (payload: SignupPayload) => Promise<Me>;
  confirm: (code: string) => Promise<Me>;
  resendCode: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const { data: user = null, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async (): Promise<Me | null> => {
      try {
        return await api<Me>("/api/auth/me");
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const setMe = (me: Me | null) => queryClient.setQueryData(["me"], me);

  const value: AuthContextValue = {
    user,
    isLoading,
    demoCode,

    async login(email, password) {
      const me = await post<Me>("/api/auth/login", { email, password });
      setMe(me);
      return me;
    },

    async signup(payload) {
      const me = await post<Me>("/api/auth/signup", payload);
      setDemoCode(me.demo_confirmation_code ?? null);
      setMe(me);
      return me;
    },

    async confirm(code) {
      const me = await post<Me>("/api/auth/confirm", { code });
      setDemoCode(null);
      setMe(me);
      return me;
    },

    async resendCode() {
      const res = await post<{ demo_confirmation_code: string }>("/api/auth/resend-code");
      setDemoCode(res.demo_confirmation_code);
    },

    async logout() {
      await post("/api/auth/logout");
      setDemoCode(null);
      setMe(null);
      // Role-scoped data must not leak into the next session.
      queryClient.removeQueries({ queryKey: ["myRequests"] });
      queryClient.removeQueries({ queryKey: ["myBoxes"] });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
