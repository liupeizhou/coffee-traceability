import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, logOperation } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const reviewSchema = z.object({
  approved: z.boolean(),
  reviewNote: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // 只有 ADMIN 可以审核
    if (user.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const { approved, reviewNote } = reviewSchema.parse(body);

    const deleteRequest = await prisma.deleteRequest.findUnique({
      where: { id },
    });

    if (!deleteRequest) {
      return errorResponse("Not found", 404);
    }

    if (deleteRequest.status !== "PENDING") {
      return errorResponse("Bad request", 400);
    }

    // 更新审核状态
    const updated = await prisma.deleteRequest.update({
      where: { id },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        reviewerId: user.id,
        reviewerName: user.name,
        reviewNote: reviewNote,
        reviewedAt: new Date(),
      },
    });

    // 如果批准了删除，执行实际的删除操作
    if (approved) {
      const { batchId, stage } = deleteRequest;

      // 根据阶段删除对应的记录
      if (stage === "PLANTING") {
        await prisma.plantingRecord.deleteMany({ where: { batch: { id: batchId } } });
        await prisma.batch.update({ where: { id: batchId }, data: { plantingId: null, currentStage: "PLANTING" } });
      } else if (stage === "PROCESSING") {
        await prisma.processingRecord.deleteMany({ where: { batch: { id: batchId } } });
        await prisma.batch.update({ where: { id: batchId }, data: { processingId: null, currentStage: "PROCESSING" } });
      } else if (stage === "STORAGE") {
        await prisma.storageRecord.deleteMany({ where: { batch: { id: batchId } } });
        await prisma.batch.update({ where: { id: batchId }, data: { storageId: null, currentStage: "STORAGE" } });
      } else if (stage === "ROASTING") {
        await prisma.roastingRecord.deleteMany({ where: { batch: { id: batchId } } });
        await prisma.batch.update({ where: { id: batchId }, data: { roastingId: null, currentStage: "ROASTING" } });
      } else if (stage === "BATCH") {
        // 删除整个批次
        await prisma.roastingRecord.deleteMany({ where: { batch: { id: batchId } } });
        await prisma.storageRecord.deleteMany({ where: { batch: { id: batchId } } });
        await prisma.processingRecord.deleteMany({ where: { batch: { id: batchId } } });
        await prisma.plantingRecord.deleteMany({ where: { batch: { id: batchId } } });
        await prisma.deleteRequest.deleteMany({ where: { batchId } });
        await prisma.batch.delete({ where: { id: batchId } });
      }

      // 记录删除日志
      await logOperation({
        batchId,
        batchNumber: deleteRequest.batchNumber,
        stage,
        action: "DELETE",
        description: `审核通过，删除${stage === "BATCH" ? "整个批次" : stage + "记录"}`,
      });
    }

    return successResponse(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data", 400);
    }
    console.error("Error reviewing delete request:", error);
    return serverErrorResponse();
  }
}
