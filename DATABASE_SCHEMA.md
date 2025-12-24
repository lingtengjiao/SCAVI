# 数据库结构说明

## 📊 数据表结构（基于前端数据结构设计）

### 1. categories (分类表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | VARCHAR(100) | 分类名称 |
| slug | VARCHAR(100) | URL 标识（唯一） |
| order | INTEGER | 排序权重 |
| is_active | BOOLEAN | 是否启用 |

**对应前端**: `Category` 接口

### 2. tags (标签表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | VARCHAR(100) | 标签名称（唯一） |
| color | VARCHAR(20) | 标签颜色（十六进制，如 #10b981） |
| order | INTEGER | 排序权重 |
| is_active | BOOLEAN | 是否启用 |

**对应前端**: `TagItem` 接口

### 3. products (产品表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| category_id | INTEGER | 分类ID（外键） |
| name | VARCHAR(200) | 产品名称（对应前端 `title`） |
| slug | VARCHAR(200) | SKU/URL 标识（唯一，对应前端 `sku`） |
| description | TEXT | 产品简介 |
| key_features | JSON | 核心卖点/特性列表（JSON 数组，对应前端 `features`） |
| images | JSON | 图片URL列表（JSON 数组，第一个为主图，对应前端 `gallery`） |
| specs | JSON | 规格参数（JSON 对象，包含：material, care, video, price 等） |
| order | INTEGER | 排序权重（对应前端 `order`） |
| is_active | BOOLEAN | 是否展示（对应前端 `status`） |
| created_at | VARCHAR(50) | 创建时间 |
| updated_at | VARCHAR(50) | 更新时间 |

**对应前端**: `ProductType` 接口

**specs 字段示例**:
```json
{
  "material": "Silk, Lace",
  "care": "Hand wash only",
  "video": "https://example.com/video.mp4",
  "price": "$29.99"
}
```

### 4. product_tags (产品-标签关联表)

| 字段 | 类型 | 说明 |
|------|------|------|
| product_id | INTEGER | 产品ID（外键） |
| tag_id | INTEGER | 标签ID（外键） |

**多对多关系**: 一个产品可以有多个标签，一个标签可以关联多个产品

### 5. hero_slides (首页轮播图表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| title | VARCHAR(200) | 标题 |
| subtitle | VARCHAR(200) | 副标题 |
| image | VARCHAR(500) | 图片URL |
| description | TEXT | 描述文本 |
| link | VARCHAR(500) | 跳转链接 |
| button_text | VARCHAR(100) | 按钮文案（对应前端 `buttonText`） |
| text_color | VARCHAR(20) | 文本颜色（white/black，对应前端 `textColor`） |
| order | INTEGER | 排序权重 |
| is_active | BOOLEAN | 是否启用 |

**对应前端**: `HeroSlide` 接口

## 🔗 关系说明

1. **Category ↔ Product**: 一对多（一个分类可以有多个产品）
2. **Product ↔ Tag**: 多对多（通过 `product_tags` 表关联）
3. **HeroSlide**: 独立表，无关联关系

## 📝 字段映射（前端 ↔ 后端）

### ProductType → Product
- `title` → `name`
- `sku` → `slug`
- `gallery` → `images` (JSON 数组)
- `features` → `key_features` (JSON 数组)
- `tags` → 通过 `product_tags` 关联表获取
- `material` → `specs.material`
- `care` → `specs.care`
- `video` → `specs.video`
- `price` → `specs.price`
- `status` → `is_active`
- `order` → `order`

### HeroSlide → HeroSlide
- `buttonText` → `button_text`
- `textColor` → `text_color`

## 🚀 API 端点

- `GET /api/categories` - 获取分类列表
- `GET /api/tags` - 获取标签列表
- `GET /api/products` - 获取产品列表（包含标签）
- `GET /api/products/{id}` - 获取产品详情（包含标签）
- `GET /api/slides` - 获取轮播图列表

## 💡 使用建议

1. **标签管理**: 先在管理后台创建标签，然后为产品关联标签
2. **产品排序**: 使用 `order` 字段控制产品显示顺序
3. **图片管理**: `images` 数组的第一个元素会作为主图显示
4. **规格参数**: `specs` 字段可以灵活存储各种产品规格信息

## 🔄 数据迁移

如果表结构已更新，运行迁移脚本：

```bash
python3 migrate_database.py
```

**注意**: 这会删除所有现有数据并重新创建表！

