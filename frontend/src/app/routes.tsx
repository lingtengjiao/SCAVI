/**
 * 路由配置
 */
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { AuthProvider } from "./context/AuthContext";
import App from "./App";
import HomePage from "./pages/HomePage";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CategoryPage from "./pages/CategoryPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </AuthProvider>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "products",
        element: <ProductListPage />,
      },
      {
        path: "products/:productId",
        element: <ProductDetailPage />,
      },
      {
        path: "categories/:categoryId",
        element: <CategoryPage />,
      },
      {
        path: "admin/login",
        element: <AdminLoginPage />,
      },
      {
        path: "admin",
        element: <Navigate to="/admin/dashboard" replace />,
      },
      {
        path: "admin/dashboard",
        element: <AdminDashboardPage />,
      },
      // 更具体的路由放在前面
      {
        path: "admin/products/add",
        element: <AdminDashboardPage />,
      },
      {
        path: "admin/products/:productId/edit",
        element: <AdminDashboardPage />,
      },
      {
        path: "admin/products",
        element: <AdminDashboardPage />,
      },
      {
        path: "admin/categories",
        element: <AdminDashboardPage />,
      },
      {
        path: "admin/tags",
        element: <AdminDashboardPage />,
      },
      {
        path: "admin/banners",
        element: <AdminDashboardPage />,
      },
      {
        path: "admin/settings",
        element: <AdminDashboardPage />,
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

