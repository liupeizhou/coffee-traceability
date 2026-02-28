# 待办事项

## 当前任务

- [x] 创建统一 API 响应格式工具函数
- [x] 修复 any 类型问题
- [x] 修改 API 响应格式
- [ ] 创建 tasks 目录
- [ ] 验证构建

## 完成项

### 2026-03-01

1. **创建 api-response.ts**
   - 创建 `/Users/liupeizhou/coffee-traceability/src/lib/api-response.ts`
   - 包含 successResponse, errorResponse, serverErrorResponse 函数

2. **修复 any 类型问题**
   - 修复 auth.ts 中的 3 处 any
   - 修复 auth-utils.ts 中的 2 处 any
   - 修复 trace/[batchNumber]/page.tsx 中的 1 处 any
   - 修复 api/stats/route.ts 中的 1 处 any
   - 修复 api/batches/route.ts 中的 1 处 any
   - 修复 dashboard/batches/[id]/page.tsx 中的 4 处 any
   - 修复 api/trace/[batchNumber]/route.ts 中的 2 处 any
   - 修复 api/logs/route.ts 中的 1 处 any
   - 修复 api/delete-requests/route.ts 中的 1 处 any
   - 修复 api/processing/update/[id]/route.ts 中的 1 处 any
   - 修复 api/roasting/update/[id]/route.ts 中的 1 处 any
   - 修复 api/planting/update/[id]/route.ts 中的 1 处 any

3. **修改 API 响应格式**
   - 更新 24 个 API route 文件
   - 统一使用 { success: boolean, data?: T, error?: string } 格式