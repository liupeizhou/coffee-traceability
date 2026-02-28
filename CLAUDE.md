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

---

## 工作流规范

### 1. 计划节点默认规则
- 任何非平凡任务 (3+ 步骤或架构决策) 进入计划模式
- 如果出现问题，立即停止并重新规划
- 使用计划模式进行验证步骤，而不仅仅是构建
- 提前编写详细规格以减少歧义

### 2. 子代理策略
- 广泛使用子代理保持主上下文窗口清晰
- 将研究、探索和并行分析委托给子代理
- 对于复杂问题，通过子代理投入更多计算
- 每个子代理一个方向，专注执行

### 3. 自我改进循环
- 用户任何纠正后: 更新 `tasks/lessons.md` 中的模式
- 为自己编写规则防止相同错误
- 无情地迭代这些教训直到错误率下降
- 会话开始时查看相关项目的教训

### 4. 完成前验证
- 不经证明它有效就不标记任务完成
- 在相关时对比主分支和行为差异
- 问自己: "高级工程师会批准这个吗?"
- 运行测试、检查日志、展示正确性

### 5. 追求优雅 (平衡)
- 对于非平凡变化: 暂停并问"有更优雅的方式吗?"
- 如果修复感觉是权宜之计: "以我现在知道的，实现优雅的解决方案"
- 对于简单明显的修复跳过这个 - 不要过度工程
- 在展示之前挑战自己的工作

### 6. 自主 Bug 修复
- 收到 bug 报告: 直接修复。不要请求帮助
- 指向日志、错误、失败的测试 - 然后解决它们
- 用户无需切换上下文
- 去修复失败的 CI 测试，无需告知如何做

---

## 任务管理

1. **计划优先**: 将计划写入 `tasks/todo.md`，包含可检查项
2. **验证计划**: 开始实现前检查确认
3. **跟踪进度**: 完成后标记项目
4. **解释变更**: 每步高层次总结
5. **记录结果**: 在 `tasks/todo.md` 添加审查部分
6. **捕获教训**: 纠正后在 `tasks/lessons.md` 更新

---

## 核心原则

- **简单优先**: 使每项更改尽可能简单。影响最小化。
- **不偷懒**: 寻找根本原因。不要临时修复。高级开发者标准。
- **最小影响**: 更改只应触及必要内容。避免引入 bug。