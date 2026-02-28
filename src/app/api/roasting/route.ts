import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const createRoastingSchema = z.object({
  batchId: z.string(),
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

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const validatedData = createRoastingSchema.parse(body);

    const batch = await prisma.batch.findUnique({ where: { id: validatedData.batchId } });
    if (!batch) {
      return errorResponse("Not found", 404);
    }

    // 检查是否已有烘焙记录
    if (batch.roastingId) {
      return errorResponse("Bad request", 400);
    }

    // 允许 ADMIN、ROASTER 或批次创建者添加烘焙记录
    if (user.role !== "ADMIN" && user.role !== "ROASTER" && batch.createdById !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    const roastingRecord = await prisma.roastingRecord.create({
      data: {
        machineName: validatedData.machineName,
        roastDate: validatedData.roastDate ? new Date(validatedData.roastDate) : null,
        roastCurveImg: validatedData.roastCurveImg,
        roastCurveData: validatedData.roastCurveData,
        agtronBean: validatedData.agtronBean,
        agtronGround: validatedData.agtronGround,
        cuppingScore: validatedData.cuppingScore,
        cuppingNotes: validatedData.cuppingNotes,
        cuppingFlavors: validatedData.cuppingFlavors,
      },
    });

    await prisma.batch.update({
      where: { id: validatedData.batchId },
      data: { roastingId: roastingRecord.id, currentStage: "COMPLETED" },
    });

    return successResponse(roastingRecord, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data", 400);
    }
    console.error("Error creating roasting record:", error);
    return serverErrorResponse();
  }
}
