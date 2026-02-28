import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const createStorageSchema = z.object({
  batchId: z.string(),
  warehouseName: z.string().optional(),
  warehouseAddress: z.string().optional(),
  entryDate: z.string().optional(),
  exitDate: z.string().optional(),
  conditions: z.string().optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  storageDuration: z.number().optional(),
  moisture: z.number().optional(),
  waterActivity: z.number().optional(),
  density: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const validatedData = createStorageSchema.parse(body);

    const batch = await prisma.batch.findUnique({ where: { id: validatedData.batchId } });
    if (!batch) {
      return errorResponse("Not found", 404);
    }

    // 检查是否已有仓储记录
    if (batch.storageId) {
      return errorResponse("Bad request", 400);
    }

    // 允许 ADMIN、PROCESSOR 或批次创建者添加仓储记录
    if (user.role !== "ADMIN" && user.role !== "PROCESSOR" && batch.createdById !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    const storageRecord = await prisma.storageRecord.create({
      data: {
        warehouseName: validatedData.warehouseName,
        warehouseAddress: validatedData.warehouseAddress,
        entryDate: validatedData.entryDate ? new Date(validatedData.entryDate) : null,
        exitDate: validatedData.exitDate ? new Date(validatedData.exitDate) : null,
        conditions: validatedData.conditions,
        temperature: validatedData.temperature,
        humidity: validatedData.humidity,
        storageDuration: validatedData.storageDuration,
        moisture: validatedData.moisture,
        waterActivity: validatedData.waterActivity,
        density: validatedData.density,
      },
    });

    await prisma.batch.update({
      where: { id: validatedData.batchId },
      data: { storageId: storageRecord.id, currentStage: "ROASTING" },
    });

    return successResponse(storageRecord, 201);
  } catch (error) {
    console.error("Error creating storage record:", error);
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data", 400);
    }
    return serverErrorResponse();
  }
}
