import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, logOperation } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateBatchSchema = z.object({
  skuName: z.string().optional(),
  currentStage: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;

    const batch = await prisma.batch.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, organization: true },
        },
        plantingRecord: true,
        processingRecord: true,
        storageRecord: true,
        roastingRecord: true,
        deleteRequests: {
          where: { status: "PENDING" },
        },
      },
    });

    if (!batch) {
      return errorResponse("Batch not found", 404);
    }

    // 检查权限
    if (user.role !== "ADMIN" && batch.createdById !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    return successResponse({ data: batch });
  } catch (error) {
    console.error("Error fetching batch:", error);
    return serverErrorResponse();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;

    const batch = await prisma.batch.findUnique({
      where: { id },
    });

    if (!batch) {
      return errorResponse("Batch not found", 404);
    }

    // 检查权限
    if (user.role !== "ADMIN" && batch.createdById !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const validatedData = updateBatchSchema.parse(body);

    const updatedBatch = await prisma.batch.update({
      where: { id },
      data: validatedData,
    });

    // 记录操作日志
    await logOperation({
      batchId: id,
      batchNumber: batch.batchNumber,
      stage: "BATCH",
      action: "UPDATE",
      oldData: { currentStage: batch.currentStage, status: batch.status },
      newData: validatedData,
      description: `更新批次状态 - 操作人: ${user.name || user.email}`,
    });

    return successResponse(updatedBatch);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data");
    }
    console.error("Error updating batch:", error);
    return serverErrorResponse();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // 只有 ADMIN 可以删除
    if (user.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;

    const batch = await prisma.batch.findUnique({
      where: { id },
    });

    if (!batch) {
      return errorResponse("Batch not found", 404);
    }

    // 删除关联记录
    await prisma.$transaction([
      prisma.plantingRecord.deleteMany({ where: { batch: { id } } }),
      prisma.processingRecord.deleteMany({ where: { batch: { id } } }),
      prisma.storageRecord.deleteMany({ where: { batch: { id } } }),
      prisma.roastingRecord.deleteMany({ where: { batch: { id } } }),
      prisma.batch.delete({ where: { id } }),
    ]);

    return successResponse({ success: true });
  } catch (error) {
    console.error("Error deleting batch:", error);
    return serverErrorResponse();
  }
}
