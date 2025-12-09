import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

const AuthCtx = createContext(null);
const TOKEN_KEY = "pawfolio_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generic fetch helper that automatically adds JWT if present
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

  // LOGIN (handles MFA vs non-MFA)
  const loginOk = useCallback(async (email, password) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    // MFA required: don't set token/user yet; caller (Login.jsx) will handle step 2
    if (data?.mfaRequired) {
      // Make sure any old session is cleared
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      return {
        mfaRequired: true,
        mfaToken: data.mfaToken,
        message: data.message,
      };
    }

    // Normal login (no MFA)
    if (data?.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    if (data?.user) {
      setUser(data.user);
    }

    return { mfaRequired: false };
  }, []);

  // VERIFY MFA CODE
  const verifyMfa = useCallback(async (code, mfaToken) => {
    const data = await apiFetch("/api/auth/verify-mfa", {
      method: "POST",
      body: JSON.stringify({ code, mfaToken }),
    });

    if (data?.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
    }
    if (data?.user) {
      setUser(data.user);
    }

    return true;
  }, []);

  // REGISTER (no auto-login; user will go to login + MFA)
  const registerOk = useCallback(async (username, email, password) => {
    await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
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
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Refresh error:", err);
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle MFA setting for current user
  const updateMfa = useCallback(async (enabled) => {
    const data = await apiFetch("/api/auth/mfa", {
      method: "PATCH",
      body: JSON.stringify({ enabled }),
    });

    if (data?.user) {
      setUser(data.user);
    }

    return true;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      loginOk,
      verifyMfa,
      registerOk,
      logout,
      refresh,
      updateMfa,
    }),
    [user, loading, loginOk, verifyMfa, registerOk, logout, refresh, updateMfa]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
