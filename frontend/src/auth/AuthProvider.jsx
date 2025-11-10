import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function apiFetch(url, options = {}) {
    try {
      const res = await fetch(url, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        cache: "no-store",
        ...options,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        const message = data?.error || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(message);
      }

      return data;
    } catch (err) {
      console.error(`[API ERROR] ${url}:`, err);
      throw err;
    }
  }

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch("/api/me.php");
      if (data?.ok && data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn("[Auth] Session check failed:", err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const loginOk = async (email, password) => {
    const data = await apiFetch("/api/login.php", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (data?.ok && data?.user) {
      setUser(data.user);
      return true;
    }

    throw new Error(data?.error || "Login failed");
  };

  const registerOk = async (email, password, username) => {
    const data = await apiFetch("/api/register.php", {
      method: "POST",
      body: JSON.stringify({ email, password, username }),
    });

    if (data?.ok && data?.user) {
      setUser(data.user);
      return true;
    }

    throw new Error(data?.error || "Registration failed");
  };

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/logout.php", { method: "POST" });
    } catch (err) {
      console.warn("[Auth] Logout request failed:", err.message);
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      loginOk,
      registerOk,
      logout,
      refresh,
    }),
    [user, loading, loginOk, registerOk, logout, refresh]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
