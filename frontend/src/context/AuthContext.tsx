import React, {
  createContext,
  useState,
  useContext,
  type ReactNode,
} from "react";


export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  googleLogin: (idToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("reachinbox_user");
    return saved ? (JSON.parse(saved) as User) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("reachinbox_token");
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isAuthenticated: boolean = Boolean(token);

  const login = (jwt: string, userData: User): void => {
    setToken(jwt);
    setUser(userData);
    localStorage.setItem("reachinbox_token", jwt);
    localStorage.setItem("reachinbox_user", JSON.stringify(userData));
  };

  const logout = (): void => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("reachinbox_token");
    localStorage.removeItem("reachinbox_user");
  };


  const googleLogin = async (idToken: string): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch(`/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        let message = "Google authentication failed";
        try {
          const err = (await response.json()) as { message?: string };
          if (err.message) message = err.message;
        } catch {
          // ignore JSON parse error
        }
        throw new Error(message);
      }

      const data = (await response.json()) as {
        token: string;
        user: User;
      };

      login(data.token, data.user);
    } catch (err) {
      console.error("Google login error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };


  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    googleLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
