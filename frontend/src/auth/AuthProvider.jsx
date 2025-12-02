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

  // Read token from localStorage
  const getToken = () => localStorage.getItem("pawfolio_token");

  async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(path, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = data?.error || data?.message || "Request failed.";
      throw new Error(msg);
    }

    return data;
  }

  const loginOk = useCallback(async (email, password) => {
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

    return true;
  }, []);

  const registerOk = useCallback(async (username, email, password) => {
    await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });

    // After successful registration, immediately log them in
    await loginOk(email, password);
    return true;
  }, [loginOk]);

  const logout = useCallback(() => {
    localStorage.removeItem("pawfolio_token");
    setUser(null);
  }, []);

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
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      loading,
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
