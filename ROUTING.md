# 前端路由系统说明

## ✅ 已完成的路由配置

前端已集成 React Router，实现了完整的路由跳转功能。

## 📋 路由结构

### 路由列表

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 主页，包含 Hero、产品列表、联系方式 |
| `/products` | 产品列表页 | 所有产品的列表展示 |
| `/products/:productId` | 产品详情页 | 单个产品的详细信息 |
| `/admin/login` | 管理员登录页 | 管理后台登录 |
| `/admin/dashboard` | 管理后台 | 内容管理界面 |

### 路由配置

路由配置在 `frontend/src/app/routes.tsx` 中定义，使用 `createBrowserRouter` 创建。

## 🔄 路由跳转方式

### 1. 使用 `useNavigate` Hook

```typescript
import { useNavigate } from "react-router-dom";

function MyComponent() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate("/products/123"); // 跳转到产品详情
  };
}
```

### 2. 使用 `Link` 组件

```typescript
import { Link } from "react-router-dom";

<Link to="/products">查看所有产品</Link>
```

### 3. 锚点跳转（页面内滚动）

对于页面内的锚点链接（如 `#products`、`#factory-contact`），使用平滑滚动：

```typescript
const handleNavigation = (href: string) => {
  const targetId = href.replace("#", "");
  const element = document.getElementById(targetId);
  if (element) {
    const headerOffset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });
  }
};
```

## 📦 数据管理

### DataContext

创建了 `DataContext` 来统一管理应用数据：

- **位置**: `frontend/src/app/context/DataContext.tsx`
- **功能**: 
  - 统一加载产品、分类、标签、轮播图数据
  - 提供 `refreshData` 方法刷新数据
  - 所有页面共享同一份数据

### 使用方式

```typescript
import { useData } from "../context/DataContext";

function MyComponent() {
  const { products, categories, tags, banners, loading, refreshData } = useData();
  
  // 使用数据...
}
```

## 🎯 页面组件

### HomePage (`/`)
- 显示 Hero 轮播图
- 显示产品列表
- 显示联系方式

### ProductListPage (`/products`)
- 产品列表展示
- 分类筛选
- 标签筛选
- 排序功能

### ProductDetailPage (`/products/:productId`)
- 产品详细信息
- 图片画廊
- 产品规格
- 返回按钮

### AdminLoginPage (`/admin/login`)
- 管理员登录表单
- 登录后跳转到管理后台

### AdminDashboardPage (`/admin/dashboard`)
- 内容管理界面
- 产品、分类、标签、轮播图管理

## 🔗 导航组件更新

### Navbar
- 支持锚点跳转（页面内滚动）
- Logo 点击返回首页
- 导航链接平滑滚动

### Footer
- Admin Portal 按钮跳转到 `/admin/login`

### Hero
- 按钮链接支持锚点和路由
- 自动识别链接类型（`#` 开头为锚点，其他为路由）

## 🚀 浏览器功能支持

✅ **URL 变化**: 路由跳转会更新浏览器 URL  
✅ **前进/后退**: 浏览器前进后退按钮正常工作  
✅ **刷新页面**: 刷新页面会保持当前路由  
✅ **直接访问**: 可以直接通过 URL 访问任何页面  
✅ **404 处理**: 无效路由自动重定向到首页  

## 📝 注意事项

1. **数据加载**: 所有数据通过 `DataContext` 统一管理，避免重复请求
2. **路由保护**: 管理后台路由目前没有权限保护，未来可以添加
3. **SEO**: 产品详情页支持直接通过 URL 访问，有利于 SEO
4. **性能**: 路由组件按需加载，提升性能

## 🔧 开发建议

### 添加新路由

1. 在 `routes.tsx` 中添加路由配置
2. 创建对应的页面组件
3. 更新导航链接

### 路由参数

使用 `useParams` 获取路由参数：

```typescript
import { useParams } from "react-router-dom";

function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  // 使用 productId...
}
```

### 路由守卫

如需添加路由守卫（如登录验证），可以使用 `loader` 或 `beforeLoad`：

```typescript
{
  path: "admin/dashboard",
  element: <AdminDashboardPage />,
  loader: async () => {
    // 检查登录状态
    if (!isLoggedIn()) {
      throw redirect("/admin/login");
    }
  }
}
```

## 📚 相关文件

- `frontend/src/app/routes.tsx` - 路由配置
- `frontend/src/app/App.tsx` - 主应用组件（布局）
- `frontend/src/app/pages/` - 页面组件
- `frontend/src/app/context/DataContext.tsx` - 数据上下文
- `frontend/src/main.tsx` - 应用入口

