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

    // 只有 ADMIN 和 GOVERNMENT 可以访问
    if (user.role !== "ADMIN" && user.role !== "GOVERNMENT") {
      return errorResponse("Forbidden", 403);
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const stage = searchParams.get("stage");
    const username = searchParams.get("username");
    const role = searchParams.get("role");

    // 构建筛选条件
    const where: Prisma.BatchWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + "T23:59:59");
    }

    if (stage) {
      where.currentStage = stage;
    }

    if (username || role) {
      where.createdBy = {};
      if (username) {
        where.createdBy.OR = [
          { name: { contains: username } },
          { email: { contains: username } },
        ];
      }
      if (role) {
        where.createdBy.role = role;
      }
    }

    // 获取统计数据
    const [
      totalBatches,
      totalUsers,
      batchesByStage,
      batchesByCreator,
      batches,
      users,
    ] = await Promise.all([
      prisma.batch.count({ where }),
      prisma.user.count(),
      prisma.batch.groupBy({
        by: ["currentStage"],
        _count: { currentStage: true },
      }),
      prisma.batch.groupBy({
        by: ["createdById"],
        _count: { createdById: true },
      }),
      prisma.batch.findMany({
        where,
        take: 100,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: { select: { name: true, email: true, role: true } },
        },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
      }),
    ]);

    return successResponse({
      totalBatches,
      totalUsers,
      completedRoasting: batchesByStage.find((s) => s.currentStage === "ROASTING")?._count.currentStage || 0,
      pendingProcessing: batchesByStage.find((s) => s.currentStage === "PLANTING")?._count.currentStage || 0,
      batchesByStage,
      batchesByCreator,
      batches,
      users,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return serverErrorResponse();
  }
}
