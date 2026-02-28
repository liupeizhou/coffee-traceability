import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // 只有 ADMIN 和 GOVERNMENT 可以查看日志
    if (user.role !== "ADMIN" && user.role !== "GOVERNMENT") {
      return errorResponse("Forbidden", 403);
    }

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const batchNumber = searchParams.get("batchNumber");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Prisma.OperationLogWhereInput = {};
    if (batchId) where.batchId = batchId;
    if (batchNumber) where.batchNumber = batchNumber;

    const [logs, total] = await Promise.all([
      prisma.operationLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.operationLog.count({ where }),
    ]);

    return successResponse({
      data: logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return serverErrorResponse();
  }
}
