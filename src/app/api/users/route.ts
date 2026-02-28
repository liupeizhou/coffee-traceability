import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // 只有管理员可以查看所有用户
    if (user.role !== "ADMIN") {
      return errorResponse("Forbidden", 403);
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        organization: true,
        status: true,
        createdAt: true,
      },
    });

    return successResponse(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return serverErrorResponse();
  }
}
