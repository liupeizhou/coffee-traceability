import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const { batchId } = await params;
    const batch = await prisma.batch.findUnique({ where: { id: batchId }, include: { roastingRecord: true } });

    if (!batch) {
      return errorResponse("Not found", 404);
    }

    if (user.role !== "ADMIN" && batch.createdById !== user.id) {
      return errorResponse("Forbidden", 403);
    }

    return successResponse(batch.roastingRecord);
  } catch (error) {
    console.error("Error fetching roasting record:", error);
    return serverErrorResponse();
  }
}
