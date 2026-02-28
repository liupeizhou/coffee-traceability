import { NextResponse } from "next/server";

/**
 * 成功响应
 * @param data 响应数据
 * @param status HTTP 状态码，默认 200
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * 错误响应
 * @param error 错误信息
 * @param status HTTP 状态码，默认 400
 */
export function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * 服务器错误响应
 * @param error 错误信息
 */
export function serverErrorResponse(error: string = "Internal server error") {
  return NextResponse.json({ success: false, error }, { status: 500 });
}