import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateProcessingSchema = z.object({
  method: z.enum(["WASHED", "NATURAL", "HONEY", "CARBONIC_MACERATION", "OTHER"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  durationHours: z.number().optional(),
  phValue: z.string().optional(),
  temperature: z.number().optional(),
  notes: z.string().optional(),
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

    const record = await prisma.processingRecord.findUnique({
      where: { id },
      include: { batch: true },
    });

    if (!record) {
      return errorResponse("Not found", 404);
    }

    if (user.role !== "ADMIN" && record.batch?.createdById !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const validatedData = updateProcessingSchema.parse(body);

    const dataToUpdate: Prisma.ProcessingRecordUpdateInput = { ...validatedData };
    if (validatedData.startDate) (dataToUpdate as Record<string, unknown>).startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) (dataToUpdate as Record<string, unknown>).endDate = new Date(validatedData.endDate);

    const updatedRecord = await prisma.processingRecord.update({
      where: { id },
      data: dataToUpdate,
    });

    return successResponse(updatedRecord);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data", 400);
    }
    console.error("Error updating processing record:", error);
    return serverErrorResponse();
  }
}
