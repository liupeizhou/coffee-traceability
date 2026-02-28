import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, logOperation, hasPermission } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const createDeleteRequestSchema = z.object({
  batchId: z.string(),
  batchNumber: z.string(),
  stage: z.enum(["PLANTING", "PROCESSING", "STORAGE", "ROASTING", "BATCH"]),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Prisma.DeleteRequestWhereInput = {};

    // 非管理员只能查看自己申请的
    if (user.role !== "ADMIN") {
      where.userId = user.id;
    }

    if (status) where.status = status;

    const requests = await prisma.deleteRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return successResponse(requests);
  } catch (error) {
    console.error("Error fetching delete requests:", error);
    return serverErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const validatedData = createDeleteRequestSchema.parse(body);

    // 检查删除权限
    const resource = validatedData.stage.toLowerCase();
    if (!hasPermission(user.role, resource, "delete")) {
      return errorResponse("Forbidden", 403);
    }

    // 检查批次是否存在
    const batch = await prisma.batch.findUnique({
      where: { id: validatedData.batchId },
    });

    if (!batch) {
      return errorResponse("Not found", 404);
    }

    // 创建删除请求
    const deleteRequest = await prisma.deleteRequest.create({
      data: {
        batchId: validatedData.batchId,
        batchNumber: validatedData.batchNumber,
        stage: validatedData.stage,
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        reason: validatedData.reason,
        status: "PENDING",
      },
    });

    return successResponse(deleteRequest, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data", 400);
    }
    console.error("Error creating delete request:", error);
    return serverErrorResponse();
  }
}

// 撤回删除请求
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("id");

    if (!requestId) {
      return errorResponse("Bad request", 400);
    }

    // 查找删除请求
    const deleteRequest = await prisma.deleteRequest.findUnique({
      where: { id: requestId },
    });

    if (!deleteRequest) {
      return errorResponse("Not found", 404);
    }

    // 检查权限：只有申请人本人或管理员可以撤回
    if (deleteRequest.userId !== user.id && user.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    // 检查状态
    if (deleteRequest.status !== "PENDING") {
      return errorResponse("Bad request", 400);
    }

    // 删除请求
    await prisma.deleteRequest.delete({
      where: { id: requestId },
    });

    return successResponse({ success: true });
  } catch (error) {
    console.error("Error revoking delete request:", error);
    return serverErrorResponse();
  }
}
