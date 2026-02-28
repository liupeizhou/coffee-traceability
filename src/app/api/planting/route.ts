import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, logOperation } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const createPlantingSchema = z.object({
  batchId: z.string(),
  farmLocation: z.string(),
  altitude: z.number().optional(),
  sunlightHours: z.number().optional(),
  tempDifference: z.number().optional(),
  rainfall: z.number().optional(),
  soilData: z.string().optional(),
  harvestTime: z.string(),
  harvestQuantity: z.number().optional(),
  qualityGrade: z.string().optional(),
});

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
    const validatedData = createPlantingSchema.parse(body);

    // 检查批次是否存在
    const batch = await prisma.batch.findUnique({
      where: { id: validatedData.batchId },
    });

    if (!batch) {
      return errorResponse("Not found", 404);
    }

    // 检查是否已有种植记录
    if (batch.plantingId) {
      return errorResponse("Bad request", 400);
    }

    // 检查权限
    if (user.role !== "ADMIN" && batch.createdById !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    // 创建种植记录
    const plantingRecord = await prisma.plantingRecord.create({
      data: {
        farmLocation: validatedData.farmLocation,
        altitude: validatedData.altitude,
        sunlightHours: validatedData.sunlightHours,
        tempDifference: validatedData.tempDifference,
        rainfall: validatedData.rainfall,
        soilData: validatedData.soilData,
        harvestTime: new Date(validatedData.harvestTime),
        harvestQuantity: validatedData.harvestQuantity,
        qualityGrade: validatedData.qualityGrade,
      },
    });

    // 更新批次关联
    await prisma.batch.update({
      where: { id: validatedData.batchId },
      data: {
        plantingId: plantingRecord.id,
        currentStage: "PROCESSING",
      },
    });

    // 记录操作日志
    await logOperation({
      batchId: validatedData.batchId,
      batchNumber: batch.batchNumber,
      stage: "PLANTING",
      action: "CREATE",
      newData: validatedData,
      description: `创建种植记录 - 操作人: ${user.name || user.email}`,
    });

    return successResponse(plantingRecord, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data", 400);
    }
    console.error("Error creating planting record:", error);
    return serverErrorResponse();
  }
}
