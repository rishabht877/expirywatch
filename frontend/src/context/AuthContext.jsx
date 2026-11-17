import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .getMe()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch((err) => {
        if (active) setLoadError(err.errors?.join(" ") ?? err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      loadError,
      async login(credentials) {
        const me = await api.login(credentials);
        setUser(me);
        return me;
      },
      async register(details) {
        const me = await api.register(details);
        setUser(me);
        return me;
      },
      async logout() {
        await api.logout();
        setUser(null);
      },
    }),
    [user, loading, loadError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
