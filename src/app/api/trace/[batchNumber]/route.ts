import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/api-response";

// 安全解析 JSON
function safeJsonParse(str: string | null): Record<string, unknown> | string | null {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ batchNumber: string }> }
) {
  try {
    const { batchNumber } = await params;

    const batch = await prisma.batch.findUnique({
      where: { batchNumber },
      include: {
        plantingRecord: true,
        processingRecord: true,
        storageRecord: true,
        roastingRecord: true,
        createdBy: {
          select: { name: true, organization: true },
        },
      },
    });

    if (!batch) {
      return errorResponse("Not found", 404);
    }

    // 构建时间线
    const timeline: Array<{
      stage: string;
      title: string;
      date: string | null;
      data: Record<string, unknown>;
    }> = [];

    // 种植阶段
    if (batch.plantingRecord) {
      timeline.push({
        stage: "PLANTING",
        title: "种植与采收",
        date: batch.plantingRecord.harvestTime?.toISOString() || null,
        data: {
          farmLocation: batch.plantingRecord.farmLocation,
          altitude: batch.plantingRecord.altitude,
          sunlightHours: batch.plantingRecord.sunlightHours,
          tempDifference: batch.plantingRecord.tempDifference,
          rainfall: batch.plantingRecord.rainfall,
          soilData: safeJsonParse(batch.plantingRecord.soilData),
          harvestTime: batch.plantingRecord.harvestTime,
          harvestQuantity: batch.plantingRecord.harvestQuantity,
          qualityGrade: batch.plantingRecord.qualityGrade,
        },
      });
    }

    // 加工阶段
    if (batch.processingRecord) {
      timeline.push({
        stage: "PROCESSING",
        title: "初加工",
        date: batch.processingRecord.startDate?.toISOString() || null,
        data: {
          method: batch.processingRecord.method,
          startDate: batch.processingRecord.startDate,
          endDate: batch.processingRecord.endDate,
          durationHours: batch.processingRecord.durationHours,
          phValue: safeJsonParse(batch.processingRecord.phValue),
          temperature: batch.processingRecord.temperature,
          notes: batch.processingRecord.notes,
        },
      });
    }

    // 仓储阶段
    if (batch.storageRecord) {
      timeline.push({
        stage: "STORAGE",
        title: "仓储",
        date: null,
        data: {
          conditions: batch.storageRecord.conditions,
          temperature: batch.storageRecord.temperature,
          humidity: batch.storageRecord.humidity,
          storageDuration: batch.storageRecord.storageDuration,
          moisture: batch.storageRecord.moisture,
          waterActivity: batch.storageRecord.waterActivity,
          density: batch.storageRecord.density,
        },
      });
    }

    // 烘焙阶段
    if (batch.roastingRecord) {
      timeline.push({
        stage: "ROASTING",
        title: "烘焙与杯测",
        date: batch.roastingRecord.roastDate?.toISOString() || null,
        data: {
          machineName: batch.roastingRecord.machineName,
          roastDate: batch.roastingRecord.roastDate,
          roastCurveImg: batch.roastingRecord.roastCurveImg,
          roastCurveData: safeJsonParse(batch.roastingRecord.roastCurveData),
          agtronBean: batch.roastingRecord.agtronBean,
          agtronGround: batch.roastingRecord.agtronGround,
          cuppingScore: batch.roastingRecord.cuppingScore,
          cuppingNotes: batch.roastingRecord.cuppingNotes,
          cuppingFlavors: batch.roastingRecord.cuppingFlavors,
        },
      });
    }

    return successResponse({
      batchNumber: batch.batchNumber,
      skuName: batch.skuName,
      currentStage: batch.currentStage,
      status: batch.status,
      producer: batch.createdBy?.organization || batch.createdBy?.name || "未知",
      timeline,
    });
  } catch (error) {
    console.error("Error fetching trace:", error);
    return serverErrorResponse();
  }
}
