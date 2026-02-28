import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateRoastingSchema = z.object({
  machineName: z.string().optional(),
  roastDate: z.string().optional(),
  roastCurveImg: z.string().optional(),
  roastCurveData: z.string().optional(),
  agtronBean: z.number().optional(),
  agtronGround: z.number().optional(),
  cuppingScore: z.number().optional(),
  cuppingNotes: z.string().optional(),
  cuppingFlavors: z.string().optional(),
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

    if (user.role !== "ADMIN" && user.role !== "ROASTER") {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const record = await prisma.roastingRecord.findUnique({ where: { id }, include: { batch: true } });

    if (!record) {
      return errorResponse("Not found", 404);
    }

    if (user.role !== "ADMIN" && record.batch?.createdById !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const validatedData = updateRoastingSchema.parse(body);

    const dataToUpdate: Prisma.RoastingRecordUpdateInput = { ...validatedData };
    if (validatedData.roastDate) (dataToUpdate as Record<string, unknown>).roastDate = new Date(validatedData.roastDate);

    const updatedRecord = await prisma.roastingRecord.update({ where: { id }, data: dataToUpdate });
    return successResponse(updatedRecord);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data", 400);
    }
    console.error("Error updating roasting record:", error);
    return serverErrorResponse();
  }
}
