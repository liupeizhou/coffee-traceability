"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TracePage() {
  const router = useRouter();
  const [batchNumber, setBatchNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchNumber.trim()) return;
    router.push(`/trace/${batchNumber.trim()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <header className="bg-amber-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">☕ 咖啡溯源查询</h1>
          <div className="flex gap-2">
            <Link href="/" className="bg-amber-800 hover:bg-amber-700 px-3 py-2 rounded-lg transition-colors">
              ← 首页
            </Link>
            <Link href="/login" className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors">
              管理登录
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-16 px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-amber-900 mb-4">
            输入批次号查询
          </h2>
          <p className="text-amber-700">
            输入咖啡包装上的批次追溯码，查看全生命周期信息
          </p>
        </div>

        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              批次号 (Batch Number)
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
              placeholder="例如: CF-20260228-0001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg font-mono"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !batchNumber.trim()}
            className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            {loading ? "查询中..." : "查询"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            批次号格式: CF-YYYYMMDD-XXXX
          </p>
        </div>
      </main>

      <footer className="bg-amber-900 text-amber-200 py-6 text-center mt-auto">
        <p>© 2026 咖啡溯源系统. All rights reserved.</p>
      </footer>
    </div>
  );
}
