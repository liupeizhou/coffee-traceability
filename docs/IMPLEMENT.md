# ☕ 咖啡溯源系统 - AI 执行指南 (IMPLEMENT)

> 本文档整合了 SPEC.md、PLAN.md、TASKS.md 的全部规范，是给 AI 编程助手的完整执行指令。

---

## 一、项目概述

### 产品名称
咖啡全生命周期溯源系统 (Coffee Traceability Platform)

### 核心功能
覆盖咖啡从种植、采收、初加工、仓储、烘焙到杯测的全链路溯源管理

### 技术栈
- **全栈框架**: Next.js 14+ (App Router)
- **数据库**: PostgreSQL
- **ORM**: Prisma
- **UI**: Shadcn UI + Tailwind CSS
- **认证**: NextAuth.js

---

## 二、数据库设计

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

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
  password     String    // 加密存储
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
  currentStage    String            @default("PLANTING") // 当前阶段
  status          String            @default("ACTIVE")

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

  @@index([batchNumber])
  @@index([createdById])
  @@index([currentStage])
}

// 种植记录
model PlantingRecord {
  id              String    @id @default(cuid())
  farmLocation    String
  altitude        Float?
  sunlightHours   Float?
  tempDifference  Float?
  rainfall        Float?
  soilData        Json?
  harvestTime     DateTime
  harvestQuantity Float?
  qualityGrade    String?
  batch           Batch?    @relation
}

// 加工记录
model ProcessingRecord {
  id              String         @id @default(cuid())
  method          ProcessMethod
  startDate       DateTime
  endDate         DateTime?
  durationHours   Float?
  phValue         Json?
  temperature     Float?
  notes           String?
  batch           Batch?         @relation
}

// 仓储记录
model StorageRecord {
  id              String    @id @default(cuid())
  conditions      String?
  temperature     Float?
  humidity        Float?
  storageDuration Int?
  moisture        Float?
  waterActivity   Float?
  density         Float?
  batch           Batch?    @relation
}

// 烘焙记录
model RoastingRecord {
  id              String    @id @default(cuid())
  machineName     String?
  roastDate       DateTime?
  roastCurveImg   String?
  roastCurveData  Json?
  agtronBean      Float?
  agtronGround    Float?
  cuppingScore    Float?
  cuppingNotes    String?
  cuppingFlavors  String[]
  batch           Batch?    @relation
}
```

---

## 三、API 设计

### 认证接口

| Method | Endpoint | 描述 |
|--------|----------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/signin | 用户登录 |
| GET | /api/auth/session | 获取当前会话 |

### 批次接口

| Method | Endpoint | 描述 | 权限 |
|--------|----------|------|------|
| POST | /api/batches | 创建批次 | FARMER+ |
| GET | /api/batches | 列表查询 | 登录 |
| GET | /api/batches/[id] | 详情 | 登录 |
| PATCH | /api/batches/[id] | 更新 | Owner |
| DELETE | /api/batches/[id] | 删除 | ADMIN |

### 种植/加工/仓储/烘焙接口

| 模块 | POST | GET | PATCH |
|------|------|-----|-------|
| Planting | /api/planting | /api/planting/[batchId] | /api/planting/[id] |
| Processing | /api/processing | /api/processing/[batchId] | /api/processing/[id] |
| Storage | /api/storage | /api/storage/[batchId] | /api/storage/[id] |
| Roasting | /api/roasting | /api/roasting/[batchId] | /api/roasting/[id] |

### 溯源接口 (核心)

| Method | Endpoint | 描述 | 权限 |
|--------|----------|------|------|
| GET | /api/trace/[batchNumber] | 溯源时间线 | 公开 |

### 统计接口

| Method | Endpoint | 描述 | 权限 |
|--------|----------|------|------|
| GET | /api/stats/overview | 全局概览 | GOVERNMENT/ADMIN |
| GET | /api/stats/region | 区域统计 | GOVERNMENT/ADMIN |
| GET | /api/stats/quality | 品质分析 | GOVERNMENT/ADMIN |

---

## 四、权限规则

### 角色权限矩阵

| 操作 | ADMIN | GOVERNMENT | FARMER | PROCESSOR | ROASTER | CAFE |
|------|-------|------------|--------|-----------|---------|------|
| 溯源查询(公开) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 批次创建 | ✓ | - | ✓ | - | - | - |
| 种植记录 CRUD | ✓ | R | Own | - | - | - |
| 加工记录 CRUD | ✓ | R | - | Own | - | - |
| 仓储记录 CRUD | ✓ | R | - | Own | - | - |
| 烘焙记录 CRUD | ✓ | R | - | - | Own | - |
| 全局统计 | ✓ | ✓ | - | - | - | - |

---

## 五、执行顺序

请按以下顺序实现：

### Phase 1: 基础搭建 (T01 + T02)
1. 创建 Next.js 项目
2. 配置 Prisma Schema
3. 执行数据库迁移

### Phase 2: 认证与权限 (T03 + T10)
1. 实现用户注册/登录
2. 实现权限检查中间件

### Phase 3: 核心业务 (T04 - T08)
1. 批次管理 CRUD
2. 种植记录 CRUD
3. 加工记录 CRUD
4. 仓储记录 CRUD
5. 烘焙记录 CRUD

### Phase 4: 溯源核心 (T09)
1. 实现 `/api/trace/[batchNumber]` 接口

### Phase 5: 前端页面 (T11 + T12)
1. B端后台 (Dashboard)
2. C端溯源页

### Phase 6: 扩展功能 (T13 + T14)
1. 统计分析
2. 部署配置

---

## 六、关键代码片段

### batchNumber 生成
```typescript
function generateBatchNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CF-${date}-${random}`;
}
```

### 溯源查询
```typescript
// src/services/trace.service.ts
async function getTraceByBatchNumber(batchNumber: string) {
  const batch = await prisma.batch.findUnique({
    where: { batchNumber },
    include: {
      plantingRecord: true,
      processingRecord: true,
      storageRecord: true,
      roastingRecord: true,
    },
  });

  if (!batch) return null;

  // 构建时间线
  const timeline = [];
  if (batch.plantingRecord) {
    timeline.push({
      stage: 'PLANTING',
      title: '种植与采收',
      date: batch.plantingRecord.harvestTime,
      data: batch.plantingRecord,
    });
  }
  // ... 其他阶段

  return {
    batchNumber: batch.batchNumber,
    skuName: batch.skuName,
    currentStage: batch.currentStage,
    timeline,
  };
}
```

### 权限检查
```typescript
// src/lib/auth-utils.ts
const ROLE_PERMISSIONS = {
  ADMIN: ['*'],
  GOVERNMENT: ['trace:read', 'stats:read'],
  FARMER: ['batch:create', 'planting:*'],
  PROCESSOR: ['processing:*', 'storage:*'],
  ROASTER: ['roasting:*'],
  CAFE: ['trace:read'],
};

export function hasPermission(role: UserRole, resource: string, action: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (perms.includes('*')) return true;
  return perms.includes(`${resource}:${action}`) || perms.includes(`${resource}:*`);
}
```

---

## 七、验收检查点

完成每个 Phase 后，请验证：

| Phase | 检查点 |
|-------|--------|
| Phase 1 | `pnpm dev` 启动成功，数据库迁移完成 |
| Phase 2 | 可注册/登录，Session 包含角色信息 |
| Phase 3 | 各模块 CRUD 正常，可关联到批次 |
| Phase 4 | 溯源接口返回完整时间线 |
| Phase 5 | 后台和前端页面可正常访问 |
| Phase 6 | 构建成功，可部署 |

---

## 八、环境变量

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/coffee_traceability"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 九、参考文档

- SPEC.md - 产品需求
- PLAN.md - 技术规划
- TASKS.md - 任务拆解

---

*文档版本: v1.0*
*创建日期: 2026-02-28*
*提示: 将本文件连同 SPEC.md、PLAN.md、TASKS.md 一并提供给 AI 编程助手执行*
