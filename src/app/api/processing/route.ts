import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const createProcessingSchema = z.object({
  batchId: z.string(),
  method: z.enum(["WASHED", "NATURAL", "HONEY", "CARBONIC_MACERATION", "OTHER"]),
  startDate: z.string(),
  endDate: z.string().optional(),
  durationHours: z.number().optional(),
  phValue: z.string().optional(),
  temperature: z.number().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // 检查批次是否存在
    const body = await req.json();
    const validatedData = createProcessingSchema.parse(body);

    const batch = await prisma.batch.findUnique({
      where: { id: validatedData.batchId },
    });

    if (!batch) {
      return errorResponse("Not found", 404);
    }

    if (user.role !== "ADMIN" && batch.createdById !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    const processingRecord = await prisma.processingRecord.create({
      data: {
        method: validatedData.method,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        durationHours: validatedData.durationHours,
        phValue: validatedData.phValue,
        temperature: validatedData.temperature,
        notes: validatedData.notes,
      },
    });

    await prisma.batch.update({
      where: { id: validatedData.batchId },
      data: {
        processingId: processingRecord.id,
        currentStage: "STORAGE",
      },
    });

    return successResponse(processingRecord, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data", 400);
    }
    console.error("Error creating processing record:", error);
    return serverErrorResponse();
  }
}
