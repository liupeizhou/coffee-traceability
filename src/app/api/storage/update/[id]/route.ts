import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateStorageSchema = z.object({
  conditions: z.string().optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  storageDuration: z.number().optional(),
  moisture: z.number().optional(),
  waterActivity: z.number().optional(),
  density: z.number().optional(),
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

    if (user.role !== "ADMIN" && user.role !== "PROCESSOR") {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const record = await prisma.storageRecord.findUnique({ where: { id }, include: { batch: true } });

    if (!record) {
      return errorResponse("Not found", 404);
    }

    if (user.role !== "ADMIN" && record.batch?.createdById !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const validatedData = updateStorageSchema.parse(body);

    const updatedRecord = await prisma.storageRecord.update({ where: { id }, data: validatedData });
    return successResponse(updatedRecord);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data", 400);
    }
    console.error("Error updating storage record:", error);
    return serverErrorResponse();
  }
}
