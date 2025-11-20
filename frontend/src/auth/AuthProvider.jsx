import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

const AuthCtx = createContext(null);
const API_BASE = "/api"; // assuming /frontend is served and /api/*.php lives next to it

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Helper to call our PHP API with JSON + cookies.
   */
  const apiFetch = useCallback(async (path, options = {}) => {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

    const fetchOpts = {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    };

    // If body is an object, JSON-encode it.
    if (fetchOpts.body && typeof fetchOpts.body === "object") {
      fetchOpts.body = JSON.stringify(fetchOpts.body);
    }

    const res = await fetch(url, fetchOpts);
    let data = null;
    try {
      data = await res.json();
    } catch {
      // ignore parse errors; we'll still return status
    }

    return {
      httpOk: res.ok,
      status: res.status,
      data,
      ok: data && typeof data.ok === "boolean" ? data.ok : res.ok,
    };
  }, []);

  /**
   * Refresh the current session (GET /api/me.php).
   */
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFetch("/me.php", { method: "GET" });
      if (result.ok && result.data?.user) {
        setUser(result.data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("refresh error", e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  /**
   * Login helper.
   * Supports:
   *   loginOk(email, password)
   *   loginOk({ email, password })
   */
  const loginOk = useCallback(
    async (...args) => {
      let email;
      let password;

      if (args.length === 1 && typeof args[0] === "object") {
        ({ email, password } = args[0]);
      } else {
        [email, password] = args;
      }

      if (!email || !password) {
        return { ok: false, error: "Email and password are required." };
      }

      try {
        const result = await apiFetch("/login.php", {
          method: "POST",
          body: { email, password },
        });

        if (result.ok && result.data?.user) {
          setUser(result.data.user);
          return { ok: true, user: result.data.user };
        }

        const errMsg =
          result.data?.error ||
          (result.status === 401
            ? "Invalid email or password."
            : "Login failed.");
        return { ok: false, error: errMsg };
      } catch (e) {
        console.error("login error", e);
        return { ok: false, error: "Network or server error during login." };
      }
    },
    [apiFetch]
  );

  /**
   * Register helper.
   * Supports:
   *   registerOk(username, email, password, confirm)
   *   registerOk({ username, email, password, confirm })
   */
  const registerOk = useCallback(
    async (...args) => {
      let username;
      let email;
      let password;
      let confirm;

      if (args.length === 1 && typeof args[0] === "object") {
        ({ username, email, password, confirm } = args[0]);
      } else {
        [username, email, password, confirm] = args;
      }

      if (!username || !email || !password || !confirm) {
        return { ok: false, error: "All fields are required." };
      }

      try {
        const result = await apiFetch("/register.php", {
          method: "POST",
          body: { username, email, password, confirm },
        });

        if (result.ok && result.data?.user) {
          setUser(result.data.user);
          return { ok: true, user: result.data.user };
        }

        const errMsg =
          result.data?.error ||
          (result.status === 409
            ? "Email already in use."
            : "Registration failed.");
        return { ok: false, error: errMsg };
      } catch (e) {
        console.error("register error", e);
        return {
          ok: false,
          error: "Network or server error during registration.",
        };
      }
    },
    [apiFetch]
  );

  /**
   * Logout helper.
   */
  const logout = useCallback(async () => {
    try {
      await apiFetch("/logout.php", { method: "POST" });
    } catch (e) {
      console.error("logout error", e);
    } finally {
      setUser(null);
    }
  }, [apiFetch]);

  // On first load, check if we already have a session cookie
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
