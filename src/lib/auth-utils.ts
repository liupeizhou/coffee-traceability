import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type UserRole = "ADMIN" | "GOVERNMENT" | "FARMER" | "PROCESSOR" | "ROASTER" | "CAFE" | "WAREHOUSE_MANAGER";

// 角色权限矩阵
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ["*"],
  GOVERNMENT: ["trace:read", "stats:read"],
  FARMER: ["batch:create", "planting:create", "planting:read", "planting:update", "planting:delete"],
  PROCESSOR: ["processing:create", "processing:read", "processing:update", "processing:delete", "storage:create", "storage:read", "storage:update", "storage:delete"],
  ROASTER: ["roasting:create", "roasting:read", "roasting:update", "roasting:delete"],
  CAFE: ["trace:read"],
  WAREHOUSE_MANAGER: ["warehouse:create", "warehouse:read", "warehouse:update", "storage:create", "storage:read", "storage:update"],
};

export type ResourceAction =
  | "batch:create" | "batch:read" | "batch:update" | "batch:delete"
  | "planting:create" | "planting:read" | "planting:update"
  | "processing:create" | "processing:read" | "processing:update"
  | "storage:create" | "storage:read" | "storage:update"
  | "roasting:create" | "roasting:read" | "roasting:update"
  | "stats:read"
  | "trace:read"
  | "user:manage";

/**
 * 检查用户是否有权限执行某个操作
 */
export function hasPermission(role: UserRole | string, resource: string, action: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.includes("*")) return true;
  return perms.includes(`${resource}:${action}`) || perms.includes(`${resource}:*`);
}

/**
 * 获取当前会话用户
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email!,
    name: session.user.name,
    role: session.user.role as UserRole,
    organization: session.user.organization,
  };
}

/**
 * 验证用户是否有权限
 */
export async function requirePermission(resource: string, action: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (!hasPermission(user.role, resource, action)) {
    throw new Error("Forbidden");
  }
  return user;
}

/**
 * 验证用户是否是资源的所有者
 */
export async function verifyOwnership(userId: string, resourceUserId: string, allowAdmin = true) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");

  if (allowAdmin && user.role === "ADMIN") return true;
  if (userId === resourceUserId) return true;

  throw new Error("Forbidden");
}

/**
 * 生成批次号 (batchNumber)
 * 格式: CF-XXXXXXXXXX (10位字母数字混合，不含特殊符号)
 */
export function generateBatchNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 排除易混淆的字符
  let result = "CF-";
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 操作数据类型
 */
export interface OperationData {
  [key: string]: unknown;
}

/**
 * 记录操作日志
 */
export async function logOperation(params: {
  batchId?: string;
  batchNumber?: string;
  stage?: string;
  action: string;
  module?: string;
  oldData?: OperationData;
  newData?: OperationData;
  description?: string;
  status?: string;
  errorMessage?: string;
  duration?: number;
  ipAddress?: string;
  userAgent?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return;

  await prisma.operationLog.create({
    data: {
      batchId: params.batchId || "",
      batchNumber: params.batchNumber || "",
      stage: params.stage || "",
      action: params.action,
      module: params.module,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      oldData: params.oldData ? JSON.stringify(params.oldData) : null,
      newData: params.newData ? JSON.stringify(params.newData) : null,
      description: params.description,
      status: params.status || "SUCCESS",
      errorMessage: params.errorMessage,
      duration: params.duration,
    },
  });
}
