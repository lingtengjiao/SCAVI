# SCAVI 数据流架构文档

## 概览

SCAVI网站采用集中式状态管理架构，所有核心数据在App.tsx中统一管理，确保前台官网和后台管理系统的数据实时同步。

## 架构图

```
┌───────────────────────────────────────────────────────────┐
│                    App.tsx (数据中心)                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  统一状态管理                                        │  │
│  │  • products: ProductType[]                          │  │
│  │  • categories: Category[]                           │  │
│  │  • tags: TagItem[]                                  │  │
│  │  • banners: HeroSlide[]                             │  │
│  └─────────────────────────────────────────────────────┘  │
└───┬──────────────────────────────────┬────────────────────┘
    │                                  │
    │  Props传递                        │  Props传递 + 回调
    ▼                                  ▼
┌────────────────┐              ┌──────────────────────┐
│   前台组件      │              │   后台管理系统        │
├────────────────┤              ├──────────────────────┤
│ Hero           │  ◄───────    │ AdminDashboard       │
│ • banners      │      数据     │ • 接收所有数据        │
│                │      同步     │ • CRUD操作           │
│ Products       │              │ • 调用update回调      │
│ • products     │              │                      │
│                │              │ 包含子模块:           │
│ ProductListPage│              │ • BannerManagement   │
│ • products     │              │ • AddProductForm     │
│                │              │ • Categories Table   │
│ ProductDetail  │              │ • Tags Management    │
│                │              │                      │
└────────────────┘              └──────────────────────┘
```

## 核心数据类型

所有共享类型定义在 `/src/app/types/admin.ts`:

### Category
```typescript
interface Category {
  id: string;
  name: string;
  count: number;
  status: string;
  order: number;
}
```

### TagItem
```typescript
interface TagItem {
  id: string;
  name: string;
  count: number;
  color: string;
  order: number;
}
```

### HeroSlide
```typescript
interface HeroSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  link: string;
  buttonText: string;
  order?: number;
}
```

## 数据流向

### 1. 前台显示数据流

```typescript
// App.tsx → Hero组件
<Hero banners={banners} />

// App.tsx → Products组件  
<Products products={products} />

// App.tsx → ProductListPage
<ProductListPage products={products} />
```

### 2. 后台管理数据流

```typescript
// App.tsx → AdminDashboard (完整数据传递)
<AdminDashboard 
  products={products}
  categories={categories}
  tags={tags}
  banners={banners}
  onProductsUpdate={setProducts}
  onCategoriesUpdate={setCategories}
  onTagsUpdate={setTags}
  onBannersUpdate={setBanners}
/>
```

### 3. 数据更新流程

后台管理员进行CRUD操作时:

```
用户操作 (Add/Edit/Delete) 
   ↓
AdminDashboard处理
   ↓
调用onXxxUpdate回调
   ↓
App.tsx的setState更新
   ↓
自动触发React重渲染
   ↓
前台组件自动更新显示
```

## 优势

1. **单一数据源**: 避免数据不同步问题
2. **实时更新**: 后台修改立即反映到前台
3. **类型安全**: 统一的TypeScript类型定义
4. **易于维护**: 数据流清晰，便于调试和扩展
5. **无需数据库**: 纯前端运行，刷新后重置

## 文件结构

```
/src/app/
├── App.tsx                          # 数据中心
├── types/
│   └── admin.ts                     # 共享类型定义
├── components/
│   ├── Hero.tsx                     # 前台轮播图 (使用banners)
│   ├── Products.tsx                 # 前台产品列表 (使用products)
│   ├── ProductListPage.tsx          # 产品列表页 (使用products)
│   └── admin/
│       ├── AdminDashboard.tsx       # 后台主界面
│       ├── BannerManagement.tsx     # 轮播图管理
│       └── AddProductForm.tsx       # 产品表单
```

## 使用说明

### 添加新数据类型

1. 在 `/src/app/types/admin.ts` 中定义类型
2. 在 `App.tsx` 中添加状态:
   ```typescript
   const [newData, setNewData] = useState<NewDataType[]>([]);
   ```
3. 将数据传递给需要的组件
4. 提供更新回调函数

### 扩展现有数据

1. 修改 `/src/app/types/admin.ts` 中的接口
2. 更新初始数据
3. 组件会自动获得新字段

## 注意事项

⚠️ **重要**: 
- 所有数据修改必须通过回调函数进行
- 不要在子组件中直接修改props
- 数据为临时存储，刷新页面会重置
- 类型定义必须保持一致

## 未来扩展

如需持久化存储，可以:
1. 集成Supabase数据库
2. 使用localStorage本地存储
3. 连接后端API

当前架构已预留扩展接口，只需在App.tsx层面添加数据持久化逻辑即可。
