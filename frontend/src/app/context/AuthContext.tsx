import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminInfo {
  id: number;
  username: string;
  email?: string;
  is_superuser: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  admin: AdminInfo | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "scavi_admin_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<AdminInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // 从 localStorage 恢复登录状态
  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        if (authData.admin && authData.timestamp) {
          // 检查是否过期（24小时）
          const now = Date.now();
          const expireTime = 24 * 60 * 60 * 1000; // 24小时
          if (now - authData.timestamp < expireTime) {
            setAdmin(authData.admin);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error("Failed to restore auth:", error);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      console.log("[Auth] 开始登录请求:", { username });
      console.log("[Auth] 请求 URL: /api/auth/login");
      console.log("[Auth] 请求方法: POST");
      
      const requestBody = { username, password };
      console.log("[Auth] 请求体:", { username, password: "***" });
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 包含 cookies/session
        body: JSON.stringify(requestBody),
      });

      console.log("[Auth] 登录响应状态:", response.status, response.statusText);
      console.log("[Auth] 响应头:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const text = await response.text();
          console.error("[Auth] 登录失败，响应内容:", text);
          throw new Error(`登录失败 (${response.status}): ${text || response.statusText}`);
        }
        console.error("[Auth] 登录失败，错误信息:", errorData);
        throw new Error(errorData.detail || errorData.message || "登录失败");
      }

      const data = await response.json();
      console.log("[Auth] 登录响应数据:", data);
      
      if (data.success) {
        const adminInfo: AdminInfo = {
          id: data.admin_id,
          username: data.username,
          is_superuser: true, // 可以根据后端返回的数据设置
        };
        
        console.log("[Auth] 设置管理员信息:", adminInfo);
        setAdmin(adminInfo);
        setIsAuthenticated(true);
        
        // 保存到 localStorage
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          admin: adminInfo,
          timestamp: Date.now(),
        }));
        
        console.log("[Auth] 登录成功");
        return true;
      }
      
      console.warn("[Auth] 登录响应 success 为 false");
      return false;
    } catch (error: any) {
      console.error("[Auth] 登录异常:", error);
      throw error;
    }
  };

  const logout = () => {
    setAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    
    // 调用后端登出接口
    fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include", // 包含 cookies/session
    }).catch(console.error);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, admin, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

