import React, { createContext, useContext, useState, useEffect } from "react";
import client, { setAccessToken } from "../api/client";

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (email: string, username: string, fullName: string | null, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (token: string) => {
    try {
      setAccessToken(token);
      setAccessTokenState(token);
      const response = await client.get<User>("/auth/me");
      setUser(response.data);
    } catch (err) {
      handleLocalLogout();
    }
  };

  const handleLocalLogout = () => {
    setAccessToken(null);
    setAccessTokenState(null);
    setUser(null);
  };

  const initializeSession = async () => {
    try {
      // Hit the refresh endpoint to obtain an access token using HTTP-only cookies
      const response = await client.post("/auth/refresh");
      const { access_token } = response.data;
      await fetchProfile(access_token);
    } catch (err) {
      // No active session cookie or invalid, normal guest state
      handleLocalLogout();
    } finally {
      setIsLoading(false);
    }
  };

  // Attempt to recover the user session when the app mounts
  useEffect(() => {
    initializeSession();

    // Listen to global Axios unauthorized alerts (expired/revoked sessions)
    const handleUnauthorizedAlert = () => {
      handleLocalLogout();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorizedAlert);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorizedAlert);
    };
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await client.post("/auth/login", {
        username_or_email: usernameOrEmail,
        password,
      });
      const { access_token } = response.data;
      await fetchProfile(access_token);
    } catch (error) {
      handleLocalLogout();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    username: string,
    fullName: string | null,
    password: string,
    confirmPassword: string
  ) => {
    setIsLoading(true);
    try {
      await client.post("/auth/register", {
        email,
        username,
        full_name: fullName,
        password,
        confirm_password: confirmPassword,
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await client.post("/auth/logout");
    } catch (err) {
      // Log errors but clean up locally anyway
    } finally {
      handleLocalLogout();
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
