"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function NewProcessingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const batchId = searchParams.get("batchId");

  const [formData, setFormData] = useState({
    method: "WASHED",
    startDate: "",
    endDate: "",
    durationHours: "",
    phValue: "",
    temperature: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/processing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          ...formData,
          durationHours: formData.durationHours ? parseFloat(formData.durationHours) : undefined,
          temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
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
          <h1 className="text-xl font-bold">⚙️ 添加加工记录</h1>
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
            <label className="block text-sm font-semibold text-gray-800 mb-2">处理法 *</label>
            <select
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
            >
              <option value="WASHED">水洗 (Washed)</option>
              <option value="NATURAL">日晒 (Natural)</option>
              <option value="HONEY">蜜处理 (Honey)</option>
              <option value="CARBONIC_MACERATION">二氧化碳浸渍 (Carbonic Maceration)</option>
              <option value="OTHER">其他 (Other)</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">开始时间 *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">结束时间</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">处理时长 (小时)</label>
              <input
                type="number"
                step="0.1"
                value={formData.durationHours}
                onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                placeholder="例如: 24"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">发酵温度 (°C)</label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                placeholder="例如: 20"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">pH值变化 (JSON)</label>
            <textarea
              value={formData.phValue}
              onChange={(e) => setFormData({ ...formData, phValue: e.target.value })}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-sm"
              rows={3}
              placeholder='{"start": 5.5, "end": 4.2}'
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">备注</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              rows={3}
              placeholder="特殊工艺说明..."
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

export default function NewProcessingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>加载中...</p></div>}>
      <NewProcessingContent />
    </Suspense>
  );
}
