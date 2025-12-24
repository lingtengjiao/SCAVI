import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLogin } from "../components/admin/AdminLogin";
import { Toaster } from "../components/ui/sonner";
import { useAuth } from "../context/AuthContext";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  // 如果已登录，重定向到管理后台
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  // 如果已登录，显示加载
  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen font-sans text-gray-900 bg-white selection:bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminLogin
        onLogin={() => navigate("/admin/dashboard")}
        onBack={() => navigate("/")}
      />
      <Toaster />
    </>
  );
}

