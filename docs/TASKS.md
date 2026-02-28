# ☕ 咖啡溯源系统 - 任务拆解 (TASKS)

## 任务总览

| 序号 | 任务模块 | 预估工时 | 优先级 |
|------|----------|----------|--------|
| T01 | 项目初始化 | 1h | P0 |
| T02 | 数据库建模 | 2h | P0 |
| T03 | 用户认证 | 3h | P0 |
| T04 | 批次管理 | 4h | P0 |
| T05 | 种植记录 | 3h | P0 |
| T06 | 加工记录 | 3h | P0 |
| T07 | 仓储记录 | 2h | P0 |
| T08 | 烘焙记录 | 3h | P0 |
| T09 | 溯源查询 | 3h | P0 |
| T10 | 权限控制 | 2h | P1 |
| T11 | B端后台 | 4h | P1 |
| T12 | C端溯源页 | 3h | P1 |
| T13 | 统计分析 | 2h | P2 |
| T14 | 部署配置 | 1h | P2 |

---

## T01: 项目初始化

### 任务描述
搭建 Next.js 14+ 项目骨架，配置开发环境

### 验收标准 (AC)
- [ ] 使用 `create-next-app` 创建项目 (TypeScript, Tailwind, App Router)
- [ ] 安装 Shadcn UI 并初始化
- [ ] 安装 Prisma 及 PostgreSQL 驱动
- [ ] 安装 NextAuth.js
- [ ] 配置 `pnpm` 或 `npm` 包管理器
- [ ] `pnpm dev` 可启动开发服务器 (localhost:3000)

### 执行命令参考
```bash
npx create-next-app@latest coffee-traceability --typescript --tailwind --eslint --app
cd coffee-traceability
npx shadcn-ui@latest init
pnpm add @prisma/client next-auth bcryptjs
pnpm add -D prisma @types/bcryptjs
```

---

## T02: 数据库建模

### 任务描述
基于 PLAN.md 设计，创建 Prisma Schema 并执行迁移

### 验收标准 (AC)
- [ ] 创建 `prisma/schema.prisma` 文件
- [ ] 定义 User, Batch, PlantingRecord, ProcessingRecord, StorageRecord, RoastingRecord 模型
- [ ] 定义 UserRole, ProcessMethod 枚举
- [ ] 配置模型间关系 (1对1)
- [ ] 执行 `pnpm prisma migrate dev --name init` 成功
- [ ] 生成 Prisma Client

### 文件路径
- `prisma/schema.prisma`
- `.env` (数据库连接字符串)

---

## T03: 用户认证

### 任务描述
实现用户注册、登录、Session 管理

### 验收标准 (AC)
- [ ] 配置 NextAuth.js (Credentials Provider)
- [ ] 实现注册 API (`/api/auth/register`)
- [ ] 实现登录 API (`/api/auth/signin`)
- [ ] 实现登出功能
- [ ] Session 中包含用户角色信息
- [ ] 登录后页面显示用户角色

### API 端点
- `POST /api/auth/register` - 注册
- `POST /api/auth/signin` - 登录

### 文件路径
- `src/lib/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/register/route.ts`

---

## T04: 批次管理

### 任务描述
实现批次 (Batch) 的 CRUD 操作

### 验收标准 (AC)
- [ ] 创建批次 API (生成唯一 batchNumber: CF-YYYYMMDD-XXXX)
- [ ] 列表查询 API (分页、筛选)
- [ ] 详情查询 API
- [ ] 更新批次 API
- [ ] 删除批次 API (软删除或硬删除)
- [ ] 创建时自动关联当前用户

### API 端点
- `POST /api/batches` - 创建
- `GET /api/batches` - 列表
- `GET /api/batches/[id]` - 详情
- `PATCH /api/batches/[id]` - 更新
- `DELETE /api/batches/[id]` - 删除

### 核心逻辑
```typescript
// batchNumber 生成逻辑
function generateBatchNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CF-${date}-${random}`;
}
```

---

## T05: 种植记录

### 任务描述
实现种植与采收数据管理

### 验收标准 (AC)
- [ ] 创建种植记录 API (关联 Batch)
- [ ] 查询种植记录 API (按 Batch ID)
- [ ] 更新种植记录 API
- [ ] 支持 JSONB 字段 (soilData)
- [ ] 权限控制: 仅 FARMER 可创建/更新

### API 端点
- `POST /api/planting` - 创建
- `GET /api/planting/[batchId]` - 查询
- `PATCH /api/planting/[id]` - 更新

### 数据字段
- farmLocation, altitude, sunlightHours, tempDifference, rainfall
- soilData (JSONB), harvestTime, harvestQuantity, qualityGrade

---

## T06: 加工记录

### 任务描述
实现初加工与发酵数据管理

### 验收标准 (AC)
- [ ] 创建加工记录 API (关联 Batch)
- [ ] 选择处理法 (枚举: WASHED/NATURAL/HONEY/CARBONIC_MACERATION/OTHER)
- [ ] 记录发酵参数 (durationHours, phValue, temperature)
- [ ] 权限控制: 仅 PROCESSOR 可操作

### API 端点
- `POST /api/processing` - 创建
- `GET /api/processing/[batchId]` - 查询
- `PATCH /api/processing/[id]` - 更新

---

## T07: 仓储记录

### 任务描述
实现仓储数据管理

### 验收标准 (AC)
- [ ] 创建仓储记录 API
- [ ] 记录物理参数 (temperature, humidity, moisture, waterActivity, density)
- [ ] 权限控制: 仅 PROCESSOR 可操作

### API 端点
- `POST /api/storage` - 创建
- `GET /api/storage/[batchId]` - 查询
- `PATCH /api/storage/[id]` - 更新

---

## T08: 烘焙记录

### 任务描述
实现烘焙与杯测数据管理

### 验收标准 (AC)
- [ ] 创建烘焙记录 API
- [ ] 记录烘焙曲线 (图片 URL 或 JSON 数据)
- [ ] 记录 Agtron 值 (豆值/粉值)
- [ ] 记录杯测评分 (SCAA 80分制)
- [ ] 记录风味描述与标签
- [ ] 权限控制: 仅 ROASTER 可操作

### API 端点
- `POST /api/roasting` - 创建
- `GET /api/roasting/[batchId]` - 查询
- `PATCH /api/roasting/[id]` - 更新

---

## T09: 溯源查询

### 任务描述
实现核心溯源时间线查询接口

### 验收标准 (AC)
- [ ] 公开接口: `GET /api/trace/[batchNumber]`
- [ ] 联表查询: Batch → Planting → Processing → Storage → Roasting
- [ ] 返回标准化时间线格式 (Timeline JSON)
- [ ] 处理空数据 (未完成的环节)
- [ ] 响应时间 < 200ms

### 响应格式
```json
{
  "success": true,
  "data": {
    "batchNumber": "CF-20260228-0001",
    "currentStage": "ROASTING",
    "timeline": [
      { "stage": "PLANTING", "title": "种植与采收", "date": "...", "data": {...} },
      { "stage": "PROCESSING", "title": "初加工", "date": "...", "data": {...} },
      { "stage": "STORAGE", "title": "仓储", "date": "...", "data": {...} },
      { "stage": "ROASTING", "title": "烘焙与杯测", "date": "...", "data": {...} }
    ]
  }
}
```

---

## T10: 权限控制

### 任务描述
实现基于角色的 API 鉴权中间件

### 验收标准 (AC)
- [ ] 创建权限检查中间件/工具函数
- [ ] 实现角色权限矩阵 (PLAN.md Section 5.1)
- [ ] 写操作需登录验证
- [ ] 非授权角色调用接口返回 403
- [ ] 跨角色数据隔离 (Own 验证)

### 实现位置
- `src/lib/auth-utils.ts` - 权限检查函数
- 各 API Route 中集成权限检查

---

## T11: B端后台

### 任务描述
开发管理后台前端界面

### 验收标准 (AC)
- [ ] 登录页面 (美化)
- [ ] 仪表盘 (数据卡片)
- [ ] 批次列表页 (分页、筛选)
- [ ] 批次详情页 (关联各环节记录)
- [ ] 各环节表单页 (Planting/Processing/Storage/Roasting)
- [ ] 响应式布局 (支持移动端)

### 页面路由
- `/login`
- `/dashboard`
- `/dashboard/batches`
- `/dashboard/batches/[id]`
- `/dashboard/planting/new?batchId=xxx`
- `/dashboard/processing/new?batchId=xxx`
- `/dashboard/roasting/new?batchId=xxx`

---

## T12: C端溯源页

### 任务描述
开发面向消费者的溯源展示页面

### 验收标准 (AC)
- [ ] 溯源首页 (`/trace`) - 搜索框入口
- [ ] 溯源结果页 (`/trace/[batchNumber]`)
- [ ] 时间线组件可视化
- [ ] 各环节数据卡片展示
- [ ] SEO 优化 (Meta 标签)
- [ ] 移动端适配

### 页面路由
- `/trace` - 首页
- `/trace/[batchNumber]` - 结果页

---

## T13: 统计分析

### 任务描述
开发数据统计与分析功能 (Government/Admin)

### 验收标准 (AC)
- [ ] 全局概览 (总批次、各阶段数量)
- [ ] 区域统计 (按产地分布)
- [ ] 品质分析 (杯测评分分布)
- [ ] 图表展示 (可选 Recharts / Tremor)

### API 端点
- `GET /api/stats/overview`
- `GET /api/stats/region`
- `GET /api/stats/quality`

---

## T14: 部署配置

### 任务描述
配置生产环境部署

### 验收标准 (AC)
- [ ] Dockerfile 编写
- [ ] Vercel 部署配置 (可选)
- [ ] 环境变量配置示例 (.env.example)
- [ ] Prisma 生产迁移
- [ ] 构建验证 (`pnpm build`)

---

## 任务依赖关系

```
T01 (项目初始化)
    │
    ▼
T02 (数据库建模) ──► T03 (用户认证)
    │                     │
    │                     ▼
    │               T10 (权限控制)
    │                     │
    ▼                     ▼
T04 (批次管理) ◄──────► T05-T08 (各环节记录)
    │                     │
    │                     ▼
    │               T09 (溯源查询)
    │                     │
    ▼                     ▼
T11 (B端后台) ◄──────► T12 (C端溯源页)
    │
    ▼
T13 (统计分析)
    │
    ▼
T14 (部署配置)
```

---

*文档版本: v1.0*
*创建日期: 2026-02-28*
