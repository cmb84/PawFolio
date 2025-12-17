import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { apiUrl } from "../lib/api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem("pawfolio_token");

  /**
   * Unified API fetch helper
   * - Automatically attaches Bearer token (if present)
   * - Automatically JSON encodes bodies (unless body is FormData)
   * - Works both with:
   *   - Same-origin /api proxying (VITE_API_BASE_URL unset)
   *   - Cross-origin API calls (VITE_API_BASE_URL set)
   */
  const apiFetch = useCallback(async (path, options = {}) => {
    const token = getToken();

    const headers = {
      ...(options.headers || {}),
    };

    // If the caller passed a plain object body, encode as JSON
    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData;

    if (!isFormData) {
      headers["Content-Type"] = headers["Content-Type"] || "application/json";
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(apiUrl(path), {
      ...options,
      headers,
    });

    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }

    if (!res.ok) {
      const msg = data?.error || data?.message || "Request failed.";
      throw new Error(msg);
    }

    return data;
  }, []);

  /**
   * LOGIN
   */
  const loginOk = useCallback(
    async (email, password) => {
      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (data?.token) {
        localStorage.setItem("pawfolio_token", data.token);
      }

      if (data?.user) {
        setUser(data.user);
      }

      return true; // allows Login.jsx to redirect to HOME
    },
    [apiFetch]
  );

  /**
   * REGISTER — argument order fixed + return true
   */
  const registerOk = useCallback(
    async (username, email, password) => {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username, email, password }),
      });

      // Auto-login after registration
      await loginOk(email, password);

      return true; // allows Signup.jsx to redirect to HOME
    },
    [apiFetch, loginOk]
  );

  /**
   * LOGOUT
   */
  const logout = useCallback(() => {
    localStorage.removeItem("pawfolio_token");
    setUser(null);
  }, []);

  /**
   * REFRESH USER (auth persistence)
   */
  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await apiFetch("/api/auth/me");
      if (data?.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.warn("Failed to refresh user:", err);
      localStorage.removeItem("pawfolio_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      loginOk,
      registerOk,
      logout,
      refresh,
      apiFetch, // exposed for convenience in pages (optional)
    }),
    [user, loading, loginOk, registerOk, logout, refresh, apiFetch]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
