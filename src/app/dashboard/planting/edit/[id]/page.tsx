"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface PlantingRecord {
  id: string;
  farmLocation: string;
  altitude: number | null;
  sunlightHours: number | null;
  tempDifference: number | null;
  rainfall: number | null;
  soilData: string | null;
  harvestTime: string;
  harvestQuantity: number | null;
  qualityGrade: string | null;
}

function EditPlantingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const batchId = searchParams.get("batchId");
  const recordId = useParams().id as string;

  const [formData, setFormData] = useState({
    farmLocation: "",
    altitude: "",
    sunlightHours: "",
    tempDifference: "",
    rainfall: "",
    soilData: "",
    harvestTime: "",
    harvestQuantity: "",
    qualityGrade: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPendingDelete, setHasPendingDelete] = useState(false);

  useEffect(() => {
    // 检查是否有待审核的删除请求
    checkPendingDelete();
    fetchRecord();
  }, [recordId, batchId]);

  const checkPendingDelete = async () => {
    if (!batchId) return;
    try {
      const res = await fetch(`/api/batches/${batchId}`);
      const data = await res.json();
      if (res.ok && data.deleteRequests && data.deleteRequests.length > 0) {
        setHasPendingDelete(true);
      }
    } catch (err) {
      console.error("Error checking delete requests:", err);
    }
  };

  const fetchRecord = async () => {
    try {
      const res = await fetch(`/api/planting/${batchId}`);
      const data = await res.json();
      if (data) {
        setFormData({
          farmLocation: data.farmLocation || "",
          altitude: data.altitude?.toString() || "",
          sunlightHours: data.sunlightHours?.toString() || "",
          tempDifference: data.tempDifference?.toString() || "",
          rainfall: data.rainfall?.toString() || "",
          soilData: data.soilData || "",
          harvestTime: data.harvestTime?.split("T")[0] || "",
          harvestQuantity: data.harvestQuantity?.toString() || "",
          qualityGrade: data.qualityGrade || "",
        });
      }
    } catch (err) {
      console.error("Error fetching record:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/planting/update/${recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          altitude: formData.altitude ? parseFloat(formData.altitude) : undefined,
          sunlightHours: formData.sunlightHours ? parseFloat(formData.sunlightHours) : undefined,
          tempDifference: formData.tempDifference ? parseFloat(formData.tempDifference) : undefined,
          rainfall: formData.rainfall ? parseFloat(formData.rainfall) : undefined,
          harvestQuantity: formData.harvestQuantity ? parseFloat(formData.harvestQuantity) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "保存失败");
        return;
      }

      router.push(`/dashboard/batches/${batchId}`);
    } catch {
      setError("保存失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>请先 <Link href="/login" className="text-amber-600">登录</Link></p>
      </div>
    );
  }

  if (hasPendingDelete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">无法编辑</h2>
          <p className="text-gray-600 mb-4">此批次有待处理的删除申请，暂时无法编辑</p>
          <Link href={`/dashboard/batches/${batchId}`} className="text-amber-600 hover:underline">
            返回批次详情
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <header className="bg-amber-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">🌱 编辑种植记录</h1>
          <Link href={`/dashboard/batches/${batchId}`} className="bg-amber-800 hover:bg-amber-700 px-3 py-2 rounded-lg transition-colors">
            ← 返回
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              种植地点 *
            </label>
            <input
              type="text"
              value={formData.farmLocation}
              onChange={(e) => setFormData({ ...formData, farmLocation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">海拔 (m)</label>
              <input
                type="number"
                value={formData.altitude}
                onChange={(e) => setFormData({ ...formData, altitude: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">日照时长 (小时/天)</label>
              <input
                type="number"
                step="0.1"
                value={formData.sunlightHours}
                onChange={(e) => setFormData({ ...formData, sunlightHours: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">昼夜温差 (°C)</label>
              <input
                type="number"
                step="0.1"
                value={formData.tempDifference}
                onChange={(e) => setFormData({ ...formData, tempDifference: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">年降雨量 (mm)</label>
              <input
                type="number"
                value={formData.rainfall}
                onChange={(e) => setFormData({ ...formData, rainfall: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">土壤数据 (JSON)</label>
            <textarea
              value={formData.soilData}
              onChange={(e) => setFormData({ ...formData, soilData: e.target.value })}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-sm"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">采收时间 *</label>
              <input
                type="date"
                value={formData.harvestTime}
                onChange={(e) => setFormData({ ...formData, harvestTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">采收量 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.harvestQuantity}
                onChange={(e) => setFormData({ ...formData, harvestQuantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">品质等级</label>
            <input
              type="text"
              value={formData.qualityGrade}
              onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? "保存中..." : "保存"}
            </button>
            <Link
              href={`/dashboard/batches/${batchId}`}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 text-center"
            >
              取消
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function EditPlantingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>加载中...</p></div>}>
      <EditPlantingContent />
    </Suspense>
  );
}
