"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { stageLabelsWithRecord } from "@/lib/constants";

interface DeleteRequest {
  id: string;
  batchId: string;
  batchNumber: string;
  stage: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  reason: string | null;
  status: string;
  reviewerName: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface OperationLog {
  id: string;
  batchId: string;
  batchNumber: string;
  stage: string;
  action: string;
  module: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: string;
  ipAddress: string | null;
  userAgent: string | null;
  oldData: string | null;
  newData: string | null;
  description: string | null;
  status: string | null;
  errorMessage: string | null;
  duration: number | null;
  createdAt: string;
}

export default function AuditPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"delete" | "logs">("delete");
  const [deleteRequests, setDeleteRequests] = useState<DeleteRequest[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  // 获取当前用户ID
  const currentUserId = session?.user?.id || "";

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "delete") {
        const res = await fetch("/api/delete-requests");
        if (res.ok) {
          const data = await res.json();
          setDeleteRequests(data);
        }
      } else {
        const res = await fetch("/api/logs?limit=50");
        if (res.ok) {
          const data = await res.json();
          setLogs(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId: string, approved: boolean) => {
    setProcessing(requestId);
    try {
      const res = await fetch(`/api/delete-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved,
          reviewNote: reviewNote,
        }),
      });

      if (res.ok) {
        fetchData();
        setReviewNote("");
      }
    } catch (error) {
      console.error("Error reviewing:", error);
    } finally {
      setProcessing(null);
    }
  };

  // 撤回删除请求
  const handleRevoke = async (requestId: string) => {
    if (!confirm("确定要撤回此删除申请吗？")) return;
    setProcessing(requestId);
    try {
      const res = await fetch(`/api/delete-requests?id=${requestId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("已撤回删除申请");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "撤回失败");
      }
    } catch (error) {
      console.error("Error revoking:", error);
      alert("撤回失败");
    } finally {
      setProcessing(null);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>请先 <Link href="/login" className="text-amber-600">登录</Link></p>
      </div>
    );
  }

  const userRole = session.user?.role || "";
  if (userRole !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>无权限访问</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <header className="bg-amber-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">⚙️ 系统控制面板</h1>
          <Link href="/dashboard" className="bg-amber-800 hover:bg-amber-700 px-3 py-2 rounded-lg transition-colors">
            ← 返回
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("delete")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "delete"
                ? "bg-amber-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            删除审核 ({deleteRequests.filter(r => r.status === "PENDING").length})
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === "logs"
                ? "bg-amber-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            操作日志
          </button>
        </div>

        {loading ? (
          <p className="text-gray-700">加载中...</p>
        ) : activeTab === "delete" ? (
          <div className="space-y-4">
            {deleteRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-700">暂无删除审核请求</p>
              </div>
            ) : (
              deleteRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-lg">
                        批次号: {request.batchNumber}
                      </p>
                      <p className="text-gray-700">
                        要删除: {stageLabelsWithRecord[request.stage] || request.stage}
                      </p>
                      <p className="text-sm text-gray-700">
                        申请人: {request.userName || request.userEmail} ({request.userEmail})
                      </p>
                      {request.reason && (
                        <p className="text-sm text-gray-600 mt-2">
                          删除原因: {request.reason}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        申请时间: {new Date(request.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm rounded-full ${
                        request.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : request.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {request.status === "PENDING" ? "待审核" : request.status === "APPROVED" ? "已批准" : "已拒绝"}
                    </span>
                  </div>

                  {request.status === "PENDING" && (
                    <div className="border-t pt-4 mt-4">
                      <textarea
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="审核备注 (可选)"
                        className="w-full px-3 py-2 border border-gray-400 rounded-lg text-sm mb-3"
                        rows={2}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleReview(request.id, true)}
                          disabled={processing === request.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          批准删除
                        </button>
                        <button
                          onClick={() => handleReview(request.id, false)}
                          disabled={processing === request.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          拒绝
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 撤回按钮：申请人本人可以撤回 */}
                  {request.status === "PENDING" && request.userId === currentUserId && (
                    <div className="border-t pt-4 mt-4">
                      <button
                        onClick={() => handleRevoke(request.id)}
                        disabled={processing === request.id}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                      >
                        撤回申请
                      </button>
                    </div>
                  )}

                  {request.status !== "PENDING" && request.reviewNote && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-sm text-gray-700">
                        审核备注: {request.reviewNote}
                      </p>
                      <p className="text-xs text-gray-400">
                        审核人: {request.reviewerName} | 审核时间: {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString("zh-CN") : "-"}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      批次号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      模块
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      阶段
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      操作
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      操作人
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      IP
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      耗时
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      描述
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                        {new Date(log.createdAt).toLocaleString("zh-CN")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-semibold text-amber-700">
                        {log.batchNumber || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {log.module || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {stageLabelsWithRecord[log.stage] || log.stage || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            log.action === "CREATE"
                              ? "bg-green-100 text-green-800"
                              : log.action === "UPDATE"
                              ? "bg-blue-100 text-blue-800"
                              : log.action === "DELETE"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {log.action === "CREATE" ? "创建" : log.action === "UPDATE" ? "更新" : log.action === "DELETE" ? "删除" : log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            log.status === "SUCCESS"
                              ? "bg-green-100 text-green-800"
                              : log.status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {log.status === "SUCCESS" ? "成功" : log.status === "FAILED" ? "失败" : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {log.userName || log.userEmail || "-"}
                        <span className="text-gray-400 text-xs ml-1">({log.userRole})</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                        {log.ipAddress || "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                        {log.duration ? `${log.duration}ms` : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate" title={log.description || undefined}>
                        {log.errorMessage ? (
                          <span className="text-red-500">{log.errorMessage}</span>
                        ) : (
                          log.description || "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
