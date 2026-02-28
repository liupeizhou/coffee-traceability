"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { regionCodes, stageLabels } from "@/lib/constants";

interface Batch {
  id: string;
  batchNumber: string;
  skuName: string | null;
  currentStage: string;
  status: string;
  createdAt: string;
  createdBy: {
    name: string | null;
    organization: string | null;
  } | null;
  deleteRequests: { id: string; status: string }[];
}

type SortField = "batchNumber" | "currentStage" | "status" | "createdAt";
type SortOrder = "asc" | "desc";

export default function BatchesPage() {
  const { data: session } = useSession();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [regionCode, setRegionCode] = useState("PE");
  const [creating, setCreating] = useState(false);

  // 排序状态
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // 删除弹窗
  const [deleteModal, setDeleteModal] = useState<{ batch: Batch | null; loading: boolean }>({
    batch: null,
    loading: false,
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/batches");
      const data = await res.json();
      if (res.ok) {
        setBatches(data.data);
      } else {
        setError(data.error || "获取失败");
      }
    } catch {
      setError("获取失败");
    } finally {
      setLoading(false);
    }
  };

  const createBatch = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regionCode }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchBatches();
        setShowModal(false);
      } else {
        setError(data.error || "创建失败");
      }
    } catch {
      setError("创建失败");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.batch) return;
    setDeleteModal({ ...deleteModal, loading: true });

    try {
      const res = await fetch("/api/delete-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: deleteModal.batch.id,
          batchNumber: deleteModal.batch.batchNumber,
          stage: "BATCH",
          reason: "删除批次",
        }),
      });

      if (res.ok) {
        setDeleteModal({ batch: null, loading: false });
        alert("删除请求已提交，等待管理员审核");
      } else {
        const data = await res.json();
        setError(data.error || "删除失败");
        setDeleteModal({ batch: null, loading: false });
      }
    } catch {
      setError("删除失败");
      setDeleteModal({ batch: null, loading: false });
    }
  };

  // 排序功能
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // 过滤掉有待处理删除请求的批次，然后排序
  const activeBatches = batches.filter(b => b.deleteRequests.length === 0);
  const sortedBatches = [...activeBatches].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "batchNumber":
        comparison = a.batchNumber.localeCompare(b.batchNumber);
        break;
      case "currentStage":
        comparison = a.currentStage.localeCompare(b.currentStage);
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "createdAt":
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="ml-1">
      {sortField === field ? (sortOrder === "asc" ? "↑" : "↓") : "↕"}
    </span>
  );

  const canDelete = session?.user?.role === "ADMIN";

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center">
        <p>请先 <Link href="/login" className="text-amber-600">登录</Link></p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <header className="bg-amber-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">📦 批次管理</h1>
          <div className="flex gap-2">
            <Link href="/dashboard" className="bg-amber-800 hover:bg-amber-700 px-3 py-2 rounded-lg transition-colors">
              ← 返回
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
            >
              + 创建批次
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>
        )}

        {/* 创建批次弹窗 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">创建新批次</h2>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  产区代码 (Region Code) *
                </label>
                <select
                  value={regionCode}
                  onChange={(e) => setRegionCode(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                >
                  {Object.entries(regionCodes).map(([code, name]) => (
                    <option key={code} value={code}>
                      {code} - {name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-600 mt-1">
                  批次号将以此产区代码开头
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  生成的批次号示例:
                </p>
                <p className="font-mono text-lg font-bold text-amber-600 mt-1">
                  {regionCode}-260228-001
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={createBatch}
                  disabled={creating}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50"
                >
                  {creating ? "创建中..." : "确认创建"}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 删除确认弹窗 */}
        {deleteModal.batch && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4 text-red-600">确认删除</h2>
              <p className="text-gray-600 mb-4">
                确定要删除批次 <span className="font-mono font-bold">{deleteModal.batch.batchNumber}</span> 吗？
              </p>
              <p className="text-sm text-gray-600 mb-4">
                删除需要管理员审核，审核通过后将无法恢复。
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleDelete}
                  disabled={deleteModal.loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteModal.loading ? "提交中..." : "确认删除"}
                </button>
                <button
                  onClick={() => setDeleteModal({ batch: null, loading: false })}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-gray-700">加载中...</p>
        ) : batches.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">暂无批次</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-amber-600 hover:underline"
            >
              创建第一个批次
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("batchNumber")}
                    >
                      批次号 <SortIcon field="batchNumber" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      商品名称
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("currentStage")}
                    >
                      当前阶段 <SortIcon field="currentStage" />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("status")}
                    >
                      状态 <SortIcon field="status" />
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("createdAt")}
                    >
                      创建时间 <SortIcon field="createdAt" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedBatches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-mono font-semibold text-amber-700">
                        {batch.batchNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                        {batch.skuName || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">
                          {stageLabels[batch.currentStage] || batch.currentStage}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            batch.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {batch.status === "ACTIVE" ? "活跃" : batch.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(batch.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/batches/${batch.id}`}
                            className="text-amber-600 hover:underline"
                          >
                            查看
                          </Link>
                          {canDelete && (
                            <button
                              onClick={() => setDeleteModal({ batch, loading: false })}
                              className="text-red-600 hover:underline"
                            >
                              删除
                            </button>
                          )}
                        </div>
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
