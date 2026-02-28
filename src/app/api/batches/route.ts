import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";
import { regionCodesCN } from "@/lib/constants";

const createBatchSchema = z.object({
  skuName: z.string().optional(),
  regionCode: z.string().optional(),
});

/**
 * 生成批次号
 * 格式: [产区代码]-[YYMMDD]-[序号]
 * 例如: PE-260228-001
 */
async function generateBatchNumber(regionCode: string = "PE"): Promise<string> {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const dd = now.getDate().toString().padStart(2, "0");

  // 获取当天该产区已创建的批次数量
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const count = await prisma.batch.count({
    where: {
      batchNumber: {
        startsWith: `${regionCode}-${yy}${mm}${dd}`,
      },
      createdAt: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
  });

  const sequence = (count + 1).toString().padStart(3, "0");

  return `${regionCode}-${yy}${mm}${dd}-${sequence}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const stage = searchParams.get("stage");

    const where: Prisma.BatchWhereInput = {};

    // 非管理员只能查看自己创建的批次
    if (user.role !== "ADMIN") {
      where.createdById = user.id;
    }

    if (status) where.status = status;
    if (stage) where.currentStage = stage;

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          createdBy: {
            select: { id: true, name: true, organization: true },
          },
          deleteRequests: {
            where: { status: "PENDING" },
            select: { id: true, status: true },
          },
        },
      }),
      prisma.batch.count({ where }),
    ]);

    return successResponse({
      data: batches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching batches:", error);
    return serverErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // 检查权限
    if (user.role !== "ADMIN" && user.role !== "FARMER") {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const validatedData = createBatchSchema.parse(body);

    // 验证产区代码
    const regionCode = validatedData.regionCode?.toUpperCase() || "PE";
    if (!regionCodesCN[regionCode]) {
      return errorResponse("无效的产区代码");
    }

    const batchNumber = await generateBatchNumber(regionCode);

    const batch = await prisma.batch.create({
      data: {
        batchNumber,
        skuName: validatedData.skuName,
        currentStage: "PLANTING",
        status: "ACTIVE",
        createdById: user.id,
      },
    });

    return successResponse(batch, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data");
    }
    console.error("Error creating batch:", error);
    return serverErrorResponse();
  }
}
