import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, logOperation } from "@/lib/auth-utils";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";
import { z } from "zod";

const createWarehouseSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  description: z.string().optional(),
  capacity: z.number().optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(warehouses);
  } catch (error) {
    console.error("Error fetching warehouses:", error);
    return serverErrorResponse();
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // 允许 ADMIN、PROCESSOR、WAREHOUSE_MANAGER 创建仓库
    if (user.role !== "ADMIN" && user.role !== "PROCESSOR" && user.role !== "WAREHOUSE_MANAGER") {
      return errorResponse("Forbidden", 403);
    }

    const body = await req.json();
    const validatedData = createWarehouseSchema.parse(body);

    const warehouse = await prisma.warehouse.create({
      data: {
        ...validatedData,
        createdById: user.id,
      },
    });

    // 记录操作日志
    await logOperation({
      action: "CREATE",
      module: "WAREHOUSE",
      description: `创建仓库 - ${validatedData.name}`,
      newData: validatedData,
    });

    return successResponse(warehouse, 201);
  } catch (error) {
    console.error("Error creating warehouse:", error);
    if (error instanceof z.ZodError) {
      return errorResponse("Invalid data", 400);
    }
    return serverErrorResponse();
  }
}
