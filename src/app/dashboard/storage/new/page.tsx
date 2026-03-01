"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Warehouse {
  readonly id: string;
  readonly name: string;
  readonly address: string | null;
}

function NewStorageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const batchId = searchParams.get("batchId");

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [formData, setFormData] = useState({
    useExistingWarehouse: true,
    warehouseId: "",
    warehouseName: "",
    warehouseAddress: "",
    entryDate: "",
    exitDate: "",
    conditions: "",
    temperature: "",
    humidity: "",
    moisture: "",
    waterActivity: "",
    density: "",
  });

  // 计算储藏天数
  const calculateDuration = () => {
    if (formData.entryDate && formData.exitDate) {
      const entry = new Date(formData.entryDate);
      const exit = new Date(formData.exitDate);
      const diffTime = Math.abs(exit.getTime() - entry.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    return "";
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch("/api/warehouses");
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const storageDuration = calculateDuration();

    // 获取仓库信息
    let warehouseName = formData.warehouseName;
    let warehouseAddress = formData.warehouseAddress;

    if (formData.useExistingWarehouse && formData.warehouseId) {
      const selectedWarehouse = warehouses.find(w => w.id === formData.warehouseId);
      if (selectedWarehouse) {
        warehouseName = selectedWarehouse.name;
        warehouseAddress = selectedWarehouse.address || "";
      }
    }

    try {
      const res = await fetch("/api/storage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          warehouseName: warehouseName || undefined,
          warehouseAddress: warehouseAddress || undefined,
          entryDate: formData.entryDate,
          exitDate: formData.exitDate || undefined,
          storageDuration: storageDuration || undefined,
          conditions: formData.conditions,
          temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
          humidity: formData.humidity ? parseFloat(formData.humidity) : undefined,
          moisture: formData.moisture ? parseFloat(formData.moisture) : undefined,
          waterActivity: formData.waterActivity ? parseFloat(formData.waterActivity) : undefined,
          density: formData.density ? parseFloat(formData.density) : undefined,
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
          <h1 className="text-xl font-bold">📦 添加仓储记录</h1>
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

          {/* 仓库选择 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">仓库信息</h3>
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="warehouseType"
                    checked={formData.useExistingWarehouse}
                    onChange={() => setFormData({ ...formData, useExistingWarehouse: true })}
                    className="text-amber-600"
                  />
                  <span>选择已有仓库</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="warehouseType"
                    checked={!formData.useExistingWarehouse}
                    onChange={() => setFormData({ ...formData, useExistingWarehouse: false })}
                    className="text-amber-600"
                  />
                  <span>自定义仓库</span>
                </label>
              </div>

              {formData.useExistingWarehouse ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">选择仓库 *</label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                    required={formData.useExistingWarehouse}
                  >
                    <option value="">请选择仓库</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} {warehouse.address ? `(${warehouse.address})` : ""}
                      </option>
                    ))}
                  </select>
                  {warehouses.length === 0 && (
                    <p className="text-sm text-gray-600 mt-1">暂无仓库，请选择"自定义仓库"</p>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">仓库名称 *</label>
                    <input
                      type="text"
                      value={formData.warehouseName}
                      onChange={(e) => setFormData({ ...formData, warehouseName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                      placeholder="例如: 普洱一号仓库"
                      required={!formData.useExistingWarehouse}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">仓库地址</label>
                    <input
                      type="text"
                      value={formData.warehouseAddress}
                      onChange={(e) => setFormData({ ...formData, warehouseAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                      placeholder="例如: 云南省普洱市思茅区"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 入库和出库时间 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">仓储时间</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  入库时间 *
                </label>
                <input
                  type="date"
                  value={formData.entryDate}
                  onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  出库时间
                </label>
                <input
                  type="date"
                  value={formData.exitDate}
                  onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  储藏天数
                </label>
                <div className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700">
                  {calculateDuration() ? `${calculateDuration()} 天` : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* 储藏条件 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">储藏条件</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">储藏条件</label>
                <input
                  type="text"
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                  placeholder="例如: 恒温恒湿"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">存储温度 (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                  placeholder="例如: 18"
                />
              </div>
            </div>
          </div>

          {/* 物理参数 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">物理参数</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">相对湿度 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.humidity}
                  onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                  placeholder="例如: 55"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">含水率 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.moisture}
                  onChange={(e) => setFormData({ ...formData, moisture: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                  placeholder="例如: 10.5"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">水活性 (Aw)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.waterActivity}
                  onChange={(e) => setFormData({ ...formData, waterActivity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                  placeholder="例如: 0.65"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">密度</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.density}
                  onChange={(e) => setFormData({ ...formData, density: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                  placeholder="例如: 0.72"
                />
              </div>
            </div>
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

export default function NewStoragePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>加载中...</p></div>}>
      <NewStorageContent />
    </Suspense>
  );
}
