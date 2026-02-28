"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { stageLabels } from "@/lib/constants";

interface TraceData {
  batchNumber: string;
  skuName: string | null;
  currentStage: string;
  status: string;
  producer: string;
  timeline: Array<{
    stage: string;
    title: string;
    date: string | null;
    data: Record<string, unknown>;
  }>;
}

export default function TraceResultPage() {
  const params = useParams();
  const [data, setData] = useState<TraceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (params.batchNumber) {
      fetchTrace();
    }
  }, [params.batchNumber]);

  const fetchTrace = async () => {
    try {
      const res = await fetch(`/api/trace/${params.batchNumber}`);
      const result = await res.json();
      if (res.ok) {
        setData(result.data);
      } else {
        setError(result.error || "查询失败");
      }
    } catch {
      setError("查询失败");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <p className="text-amber-800">查询中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50">
        <header className="bg-amber-900 text-white py-6 px-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">☕ 咖啡溯源查询</h1>
            <Link href="/trace" className="hover:underline">返回</Link>
          </div>
        </header>
        <main className="max-w-2xl mx-auto py-16 px-4">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">未找到该批次</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/trace"
              className="inline-block bg-amber-600 text-white px-6 py-2 rounded-xl hover:bg-amber-700"
            >
              重新查询
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <header className="bg-amber-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-4xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">☕ 咖啡溯源查询</h1>
          <Link href="/" className="bg-amber-800 hover:bg-amber-700 px-3 py-2 rounded-lg transition-colors">
            ← 首页
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">批次号</p>
            <p className="text-2xl font-mono font-bold text-amber-900">{data.batchNumber}</p>
            {data.skuName && (
              <p className="text-lg text-gray-700 mt-2">{data.skuName}</p>
            )}
            <div className="flex justify-center gap-4 mt-4">
              <span className="px-3 py-1 text-sm rounded-full bg-amber-100 text-amber-800">
                {stageLabels[data.currentStage] || data.currentStage}
              </span>
              <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-800">
                {data.status}
              </span>
            </div>
            {data.producer && (
              <p className="text-sm text-gray-600 mt-4">生产者: {data.producer}</p>
            )}
          </div>
        </div>

        <div className="relative">
          {/* 时间线 */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-amber-200"></div>

          <div className="space-y-6">
            {data.timeline.map((item, index) => (
              <div key={item.stage} className="relative flex gap-6">
                <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl z-10 flex-shrink-0">
                  {index === 0 ? "🌱" : index === 1 ? "🏭" : index === 2 ? "📦" : "☕"}
                </div>
                <div className="bg-white rounded-xl shadow-md p-6 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                    {item.date && (
                      <span className="text-sm text-gray-600">
                        {new Date(item.date).toLocaleDateString("zh-CN")}
                      </span>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {Object.entries(item.data).map(([key, value]) => {
                      if (value === null || value === undefined || value === "") return null;
                      return (
                        <div key={key}>
                          <span className="text-gray-600">{key}:</span>{" "}
                          <span className="text-gray-800">{String(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data.timeline.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              暂无溯源数据
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <Link
            href="/trace"
            className="inline-block bg-gray-200 text-gray-800 px-6 py-2 rounded-xl hover:bg-gray-300"
          >
            ← 继续查询
          </Link>
          <Link
            href="/dashboard/batches"
            className="inline-block bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700"
          >
            批次管理
          </Link>
          <Link
            href="/dashboard"
            className="inline-block bg-amber-100 text-amber-800 px-6 py-2 rounded-xl hover:bg-amber-200"
          >
            返回后台
          </Link>
        </div>
      </main>

      <footer className="bg-amber-900 text-amber-200 py-6 text-center mt-8">
        <p>© 2026 咖啡溯源系统. All rights reserved.</p>
      </footer>
    </div>
  );
}
