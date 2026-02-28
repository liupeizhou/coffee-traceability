import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const updateUserSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
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

    // 只有管理员可以审批用户
    if (user.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateUserSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return errorResponse("Not found", 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        status: validatedData.status,
      },
    });

    return successResponse({
      id: updatedUser.id,
      email: updatedUser.email,
      status: updatedUser.status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data", 400);
    }
    console.error("Error updating user:", error);
    return serverErrorResponse();
  }
}
