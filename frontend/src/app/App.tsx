import React from "react";
import { Outlet } from "react-router-dom";

/**
 * 主应用布局组件
 * 使用 Outlet 渲染子路由
 */
function App() {
  return <Outlet />;
}

export default App;
