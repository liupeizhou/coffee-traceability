import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const updatePlantingSchema = z.object({
  farmLocation: z.string().optional(),
  altitude: z.number().optional(),
  sunlightHours: z.number().optional(),
  tempDifference: z.number().optional(),
  rainfall: z.number().optional(),
  soilData: z.string().optional(),
  harvestTime: z.string().optional(),
  harvestQuantity: z.number().optional(),
  qualityGrade: z.string().optional(),
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

    if (user.role !== "ADMIN" && user.role !== "FARMER") {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;

    const plantingRecord = await prisma.plantingRecord.findUnique({
      where: { id },
      include: { batch: true },
    });

    if (!plantingRecord) {
      return errorResponse("Not found", 404);
    }

    if (user.role !== "ADMIN" && plantingRecord.batch?.createdById !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const validatedData = updatePlantingSchema.parse(body);

    const dataToUpdate: Prisma.PlantingRecordUpdateInput = { ...validatedData };
    if (validatedData.harvestTime) {
      (dataToUpdate as Record<string, unknown>).harvestTime = new Date(validatedData.harvestTime);
    }

    const updatedRecord = await prisma.plantingRecord.update({
      where: { id },
      data: dataToUpdate,
    });

    return successResponse(updatedRecord);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data", 400);
    }
    console.error("Error updating planting record:", error);
    return serverErrorResponse();
  }
}
