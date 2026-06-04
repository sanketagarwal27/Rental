import { createContext, useState, useEffect, useContext } from "react";
import { getCurrentUser as fetchCurrentUser, login as apiLogin, logout as apiLogout } from "../api/auth";

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUserStatus = async () => {
    try {
      setLoading(true);
      const data = await fetchCurrentUser();
      if (data && data.data) {
        setUser(data.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, []);

  const login = async (payload) => {
    const data = await apiLogin(payload);
    // backend returns { statusCode, data: <user>, message, success }
    if (data && data.data) {
      setUser(data.data);
    }
    return data;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, checkUserStatus }}>
      {children}
    </AuthContext.Provider>
  );
};
