import React, { useState } from "react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Lock, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!username || !password) {
      setError("请填写用户名和密码");
      setLoading(false);
      return;
    }

    try {
      console.log("[AdminLogin] 开始登录:", { username, passwordLength: password.length });
      console.log("[AdminLogin] 表单验证通过，准备发送请求");
      
      const success = await login(username, password);
      console.log("[AdminLogin] 登录结果:", success);
      
      if (success) {
        console.log("[AdminLogin] 登录成功，准备跳转");
        toast.success("登录成功");
        // 延迟一下，确保状态更新完成
        setTimeout(() => {
          onLogin();
        }, 100);
      } else {
        console.warn("[AdminLogin] 登录返回 false");
        setError("登录失败，请检查用户名和密码");
        setLoading(false);
      }
    } catch (err: any) {
      console.error("[AdminLogin] 登录异常:", err);
      console.error("[AdminLogin] 错误详情:", {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      const errorMessage = err.message || "登录失败，请检查用户名和密码";
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-gray-100">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto bg-gray-900 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Lock className="text-white w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-serif">Admin Portal</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="username" 
                    type="text" 
                    placeholder="admin"
                    className="pl-9"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>
              {error && (
                  <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded border border-red-200">
                    <strong>登录失败：</strong>{error}
                  </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-gray-900 hover:bg-gray-800" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <Button variant="ghost" type="button" onClick={onBack} className="w-full text-gray-500">
                Back to Website
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
