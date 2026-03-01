# Coffee Traceability - 咖啡溯源管理系统

给咖啡装上"身份证"，从种植到杯中的全程可追溯系统。

## 项目信息

- **技术栈**: Next.js 16 + TypeScript + Prisma + SQLite + NextAuth.js + Tailwind CSS
- **数据库**: SQLite (dev.db)
- **认证**: NextAuth.js (Credentials Provider)
- **包管理器**: pnpm

## 快速开始

```bash
cd coffee-traceability
pnpm install
npx prisma db push
pnpm dev
```

访问 http://localhost:3000

默认账号: admin@example.com / admin123

## 项目结构

```
src/
├── app/
│   ├── api/                    # API 路由
│   │   ├── auth/               # 认证相关
│   │   │   ├── [...nextauth]/  # NextAuth 路由
│   │   │   └── register/       # 用户注册
│   │   ├── batches/            # 批次管理
│   │   ├── planting/           # 种植记录
│   │   ├── processing/         # 加工记录
│   │   ├── storage/            # 仓储记录
│   │   ├── roasting/          # 烘焙记录
│   │   ├── warehouses/        # 仓库管理
│   │   ├── trace/              # 溯源查询 API
│   │   ├── delete-requests/   # 删除审核
│   │   └── users/             # 用户管理
│   ├── dashboard/             # 管理后台页面
│   │   ├── page.tsx           # 仪表盘
│   │   ├── batches/           # 批次管理
│   │   ├── planting/           # 种植记录
│   │   ├── processing/        # 加工记录
│   │   ├── storage/           # 仓储记录
│   │   ├── roasting/          # 烘焙记录
│   │   ├── warehouses/        # 仓库管理
│   │   ├── users/             # 用户管理
│   │   ├── audit/             # 删除审核
│   │   └── stats/             # 统计分析
│   ├── trace/                 # 溯源查询页面
│   ├── login/                  # 登录页
│   ├── register/              # 注册页
│   └── layout.tsx             # 根布局
├── lib/
│   ├── auth.ts                # NextAuth 配置
│   ├── auth-utils.ts          # 认证工具函数
│   ├── constants.ts           # 常量定义
│   └── prisma.ts              # Prisma 客户端
├── components/                 # 公共组件
└── types/                     # 类型定义
```

## 数据模型

### 核心表

- **User** - 用户 (角色: ADMIN, GOVERNMENT, FARMER, PROCESSOR, ROASTER, CAFE, WAREHOUSE_MANAGER)
- **Batch** - 批次 (核心，关联各阶段记录)
- **PlantingRecord** - 种植记录
- **ProcessingRecord** - 加工记录
- **StorageRecord** - 仓储记录
- **RoastingRecord** - 烘焙记录
- **Warehouse** - 仓库
- **OperationLog** - 操作日志
- **DeleteRequest** - 删除审核请求

### 批次阶段

```
PLANTING → PROCESSING → STORAGE → ROASTING → COMPLETED
```

跳过阶段时设置 `currentStage` 为目标阶段。

## 角色权限

| 角色 | 权限 |
|------|------|
| ADMIN | 管理员，审批用户、审核删除、全功能 |
| FARMER | 咖农，管理种植记录 |
| PROCESSOR | 加工商，管理加工和仓储记录 |
| ROASTER | 烘焙师，管理烘焙记录 |
| WAREHOUSE_MANAGER | 仓库管理，管理仓储 |
| GOVERNMENT | 农业局，查看统计数据 |
| CAFE | 咖啡店 |

## 产区代码

- PE - 普洱
- BS - 保山
- DH - 德宏芒市
- LC - 临沧
- BN - 西双版纳
- OT - 其他

## 常用命令

```bash
# 数据库
npx prisma db push          # 同步数据库 schema
npx prisma studio           # 打开数据库管理界面

# 开发
pnpm dev                    # 启动开发服务器
pnpm build                  # 构建生产版本
pnpm start                  # 启动生产服务器

# 代码质量
pnpm lint                   # 运行 ESLint
```

## 注意事项

1. 用户注册后需要 ADMIN 审批才能登录
2. 删除操作需要提交审核，由 ADMIN 审批
3. 溯源查询页面 `/trace` 公开无需登录
4. 批次号唯一，用于溯源查询

## 代码规范

### TypeScript 规范
- 使用明确的类型定义，避免使用 `any`
- 接口优于类型别名 (type)，除非需要联合类型
- 使用 `readonly` 修饰只读属性
- 函数参数使用完整类型标注

### 组件规范
- 使用 Server Components 优先于 Client Components
- Client Components 使用 `'use client'` 指令
- 组件文件名使用 PascalCase (如 `BatchList.tsx`)
- 组件放在 `src/components/` 目录，按功能模块组织

### API 路由规范
- 使用 Route Handler (route.ts) 而非 API Routes
- 请求参数使用 Zod 进行验证
- 响应格式统一: `{ success: boolean, data?: T, error?: string }`
- 错误处理返回适当的 HTTP 状态码

### 数据库操作
- 使用 Prisma Client 实例 (单例模式)
- 避免在循环中进行数据库查询
- 使用事务处理多表操作
- 敏感字段不返回给前端
