"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function NewPlantingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const batchId = searchParams.get("batchId");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/planting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <header className="bg-amber-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">🌱 添加种植记录</h1>
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
              placeholder="例如: 云南普洱"
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
                placeholder="例如: 1500"
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
                placeholder="例如: 8"
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
                placeholder="例如: 12"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">年降雨量 (mm)</label>
              <input
                type="number"
                value={formData.rainfall}
                onChange={(e) => setFormData({ ...formData, rainfall: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                placeholder="例如: 1800"
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
              placeholder='{"ph": 6.2, "nitrogen": "medium"}'
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
                placeholder="例如: 500"
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
              placeholder="例如: AA"
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

export default function NewPlantingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>加载中...</p></div>}>
      <NewPlantingContent />
    </Suspense>
  );
}
