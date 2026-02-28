# ☕ 咖啡溯源系统 - 技术规划文档 (PLAN)

## 1. 技术栈选择

### 1.1 核心技术栈

| 层级 | 技术选型 | 理由 |
|------|----------|------|
| **全栈框架** | Next.js 14+ (App Router) | SSR 支持 SEO、Server Actions 简化后端、生态丰富 |
| **数据库** | PostgreSQL | 强关系型 + JSONB 灵活扩展 |
| **ORM** | Prisma | 类型安全、自动迁移、查询构建器优秀 |
| **UI 组件库** | Shadcn UI + Tailwind CSS | 现代设计、可定制性强、响应式 |
| **认证** | NextAuth.js (Auth.js) | 支持多 provider、JWT/OAuth |
| **部署** | Vercel / Docker | Vercel 零配置部署，或自建 Docker |

### 1.2 开发环境

```bash
Node.js >= 20.0.0
pnpm >= 8.0.0  (推荐) 或 npm >= 10.0.0
PostgreSQL >= 14.0
```

---

## 2. 系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   B端后台   │  │   C端溯源页  │  │     移动端 H5           │  │
│  │  (Admin)    │  │ (Traceability)│ │    (Mobile Web)        │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼───────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js API Layer                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Route Handlers / Server Actions             │  │
│  │   /api/batches  /api/planting  /api/processing  etc.     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Middleware (Auth, Rate Limit)                │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │BatchService│  │TraceService│  │AuthService │  │StatsService│ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Prisma ORM                            │  │
│  │         (PostgreSQL + JSONB Support)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
coffee-traceability/
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # 认证相关页面
│   │   ├── (dashboard)/       # B端后台管理
│   │   ├── trace/             # C端溯源页面
│   │   ├── api/               # API 路由
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                # Shadcn UI 组件
│   │   ├── forms/             # 表单组件
│   │   └── trace/             # 溯源展示组件
│   ├── lib/
│   │   ├── prisma.ts          # Prisma 客户端单例
│   │   ├── auth.ts            # NextAuth 配置
│   │   └── utils.ts           # 工具函数
│   ├── services/              # 业务逻辑层
│   │   ├── batch.service.ts
│   │   ├── trace.service.ts
│   │   └── stats.service.ts
│   └── types/                 # TypeScript 类型定义
├── public/
│   └── images/                # 静态资源
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

---

## 3. 数据库设计

### 3.1 核心数据模型 (Prisma Schema)

```prisma
// 用户角色枚举
enum UserRole {
  ADMIN
  GOVERNMENT
  FARMER
  PROCESSOR
  ROASTER
  CAFE
}

// 处理法枚举
enum ProcessMethod {
  WASHED
  NATURAL
  HONEY
  CARBONIC_MACERATION
  OTHER
}

// 用户表
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  name         String?
  role         UserRole  @default(FARMER)
  organization String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  batches      Batch[]
}

// 批次表 (核心)
model Batch {
  id              String            @id @default(cuid())
  batchNumber     String            @unique  // 唯一追溯码
  skuName         String?           // 商品名称
  currentStage    String            // 当前阶段
  status          String            @default("PLANTING")

  plantingId      String?           @unique
  plantingRecord  PlantingRecord?   @relation(fields: [plantingId], references: [id])

  processingId    String?           @unique
  processingRecord ProcessingRecord? @relation(fields: [processingId], references: [id])

  storageId       String?           @unique
  storageRecord   StorageRecord?    @relation(fields: [storageId], references: [id])

  roastingId      String?           @unique
  roastingRecord  RoastingRecord?   @relation(fields: [roastingId], references: [id])

  createdById     String?
  createdBy       User?             @relation(fields: [createdById], references: [id])

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

// 种植记录
model PlantingRecord {
  id              String    @id @default(cuid())
  farmLocation    String
  altitude        Float?    // 海拔
  sunlightHours   Float?    // 日照时长
  tempDifference  Float?    // 昼夜温差
  rainfall        Float?    // 降雨量
  soilData        Json?     // 土壤数据
  harvestTime     DateTime
  harvestQuantity Float?    // 采收量(kg)
  qualityGrade    String?   // 品质等级
  batch           Batch?    @relation
}

// 加工记录
model ProcessingRecord {
  id              String         @id @default(cuid())
  method          ProcessMethod
  startDate       DateTime
  endDate         DateTime?
  durationHours   Float?
  phValue         Json?          // pH变化 {"start": 5.5, "end": 4.2}
  temperature     Float?         // 发酵温度
  notes           String?
  batch           Batch?         @relation
}

// 仓储记录
model StorageRecord {
  id              String    @id @default(cuid())
  conditions      String?   // 仓储条件描述
  temperature     Float?    // 存储温度
  humidity        Float?    // 相对湿度
  storageDuration Int?     // 存储天数
  moisture        Float?    // 含水率
  waterActivity   Float?   // 水活性 Aw
  density         Float?    // 密度
  batch           Batch?    @relation
}

// 烘焙记录
model RoastingRecord {
  id              String    @id @default(cuid())
  machineName     String?   // 烘焙设备
  roastDate       DateTime?
  roastCurveImg   String?   // 烘焙曲线图URL
  roastCurveData  Json?     // 烘焙曲线数据
  agtronBean      Float?    // Agtron 豆值
  agtronGround    Float?    // Agtron 粉值
  cuppingScore    Float?    // 杯测评分
  cuppingNotes    String?   // 风味描述
  cuppingFlavors  String[]   // 风味标签数组
  batch           Batch?    @relation
}
```

### 3.2 索引设计

| 表 | 索引字段 | 用途 |
|----|----------|------|
| Batch | batchNumber | 溯源查询 (唯一索引) |
| Batch | createdById | 用户数据关联 |
| Batch | currentStage | 状态筛选 |
| PlantingRecord | farmLocation | 产地统计 |
| RoastingRecord | cuppingScore | 评分排序 |

---

## 4. API 设计

### 4.1 RESTful API 规范

#### 批次管理
| Method | Endpoint | 描述 | 权限 |
|--------|----------|------|------|
| POST | /api/batches | 创建批次 | FARMER+ |
| GET | /api/batches | 列表查询 | 登录用户 |
| GET | /api/batches/[id] | 详情 | 登录用户 |
| PATCH | /api/batches/[id] | 更新 | 批次Owner |
| DELETE | /api/batches/[id] | 删除 | ADMIN |

#### 种植记录
| Method | Endpoint | 描述 | 权限 |
|--------|----------|------|------|
| POST | /api/planting | 创建种植记录 | FARMER |
| GET | /api/planting/[batchId] | 查询 | 登录用户 |
| PATCH | /api/planting/[id] | 更新 | FARMER(Own) |

#### 加工记录
| Method | Endpoint | 描述 | 权限 |
|--------|----------|------|------|
| POST | /api/processing | 创建加工记录 | PROCESSOR |
| GET | /api/processing/[batchId] | 查询 | 登录用户 |
| PATCH | /api/processing/[id] | 更新 | PROCESSOR(Own) |

#### 仓储记录
| Method | Endpoint | 描述 | 权限 |
|--------|----------|------|------|
| POST | /api/storage | 创建仓储记录 | PROCESSOR |
| GET | /api/storage/[batchId] | 查询 | 登录用户 |

#### 烘焙记录
| Method | Endpoint | 描述 | 权限 |
|--------|----------|------|------|
| POST | /api/roasting | 创建烘焙记录 | ROASTER |
| GET | /api/roasting/[batchId] | 查询 | 登录用户 |
| PATCH | /api/roasting/[id] | 更新 | ROASTER(Own) |

#### 溯源查询 (核心)
| Method | Endpoint | 描述 | 权限 |
|--------|----------|------|------|
| GET | /api/trace/[batchNumber] | 溯源时间线 | 公开 |

#### 统计分析 (政府端)
| Method | Endpoint | 描述 | 权限 |
|--------|----------|------|------|
| GET | /api/stats/overview | 全局概览 | GOVERNMENT/ADMIN |
| GET | /api/stats/region | 区域统计 | GOVERNMENT/ADMIN |
| GET | /api/stats/quality | 品质分析 | GOVERNMENT/ADMIN |

### 4.2 溯源接口响应格式

```json
{
  "success": true,
  "data": {
    "batchNumber": "CF-20260228-0001",
    "skuName": "云南单品日晒咖啡豆",
    "currentStage": "ROASTING",
    "timeline": [
      {
        "stage": "PLANTING",
        "title": "种植与采收",
        "date": "2026-02-15",
        "data": {
          "farmLocation": "云南普洱",
          "altitude": 1500,
          "harvestTime": "2026-02-10",
          "soilData": { "ph": 6.2, "nitrogen": "medium" }
        }
      },
      {
        "stage": "PROCESSING",
        "title": "初加工",
        "date": "2026-02-18",
        "data": {
          "method": "NATURAL",
          "durationHours": 240,
          "notes": "慢速日晒"
        }
      },
      {
        "stage": "STORAGE",
        "title": "仓储",
        "date": "2026-02-25",
        "data": {
          "conditions": "恒温恒湿",
          "temperature": 18,
          "humidity": 55
        }
      },
      {
        "stage": "ROASTING",
        "title": "烘焙与杯测",
        "date": "2026-02-28",
        "data": {
          "machineName": "Probat 12",
          "agtronBean": 65,
          "cuppingScore": 86.5,
          "cuppingNotes": "柑橘、茉莉花、坚果"
        }
      }
    ]
  }
}
```

---

## 5. 权限控制设计

### 5.1 角色权限矩阵

| 功能 | ADMIN | GOVERNMENT | FARMER | PROCESSOR | ROASTER | CAFE |
|------|-------|-------------|--------|-----------|---------|------|
| 溯源查询(公开) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 批次创建 | ✓ | - | ✓ | - | - | - |
| 种植记录 | ✓ | R | ✓(Own) | - | - | - |
| 加工记录 | ✓ | R | - | ✓(Own) | - | - |
| 仓储记录 | ✓ | R | - | ✓(Own) | - | - |
| 烘焙记录 | ✓ | R | - | - | ✓(Own) | - |
| 全局统计 | ✓ | ✓ | - | - | - | - |
| 用户管理 | ✓ | - | - | - | - | - |

*注: R = 只读, Own = 仅操作自己创建的数据*

### 5.2 鉴权实现策略

```typescript
// 基于角色的权限检查
function checkRolePermission(userRole: UserRole, action: string, resource: string): boolean {
  const permissions = {
    ADMIN: ['*'],
    GOVERNMENT: ['trace:read', 'stats:read'],
    FARMER: ['batch:create', 'planting:*'],
    PROCESSOR: ['processing:*', 'storage:*'],
    ROASTER: ['roasting:*'],
    CAFE: ['trace:read']
  };

  const rolePerms = permissions[userRole];
  return rolePerms.includes('*') || rolePerms.includes(`${resource}:${action}`);
}
```

---

## 6. 前端页面规划

### 6.1 B端后台 (Dashboard)

| 页面 | 路径 | 描述 |
|------|------|------|
| 登录页 | /login | 邮箱登录 |
| 仪表盘 | /dashboard | 数据概览卡片 |
| 批次管理 | /dashboard/batches | 批次列表与详情 |
| 种植记录 | /dashboard/planting | 种植数据表单 |
| 加工记录 | /dashboard/processing | 加工数据表单 |
| 仓储记录 | /dashboard/storage | 仓储数据表单 |
| 烘焙记录 | /dashboard/roasting | 烘焙数据表单 |
| 统计分析 | /dashboard/stats | 图表统计 (Government) |
| 用户管理 | /dashboard/users | 用户列表 (Admin) |

### 6.2 C端溯源页 (Traceability)

| 页面 | 路径 | 描述 |
|------|------|------|
| 溯源首页 | /trace | 扫码/输入入口 |
| 溯源结果 | /trace/[batchNumber] | 时间线展示 |

---

## 7. 验收标准

### 7.1 技术验收

| 验收项 | 验收条件 |
|--------|----------|
| 项目启动 | `pnpm dev` 可正常启动，无报错 |
| 数据库迁移 | `pnpm prisma migrate dev` 成功执行 |
| 类型检查 | `pnpm tsc --noEmit` 无错误 |
| 构建 | `pnpm build` 成功生成生产构建 |

### 7.2 功能验收

| 功能 | 验收条件 |
|------|----------|
| 用户注册 | 可注册并分配角色 |
| 登录 | 登录成功获取 JWT |
| 批次创建 | 创建成功返回 batchNumber |
| 种植记录 | 可保存并关联到批次 |
| 溯源查询 | 输入 batchNumber 返回完整时间线 |
| 权限控制 | 非授权角色无法执行写操作 |

---

*文档版本: v1.0*
*创建日期: 2026-02-28*
