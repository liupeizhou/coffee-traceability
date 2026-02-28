"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { stageLabels, roleLabels } from "@/lib/constants";

interface Batch {
  id: string;
  batchNumber: string;
  currentStage: string;
  createdAt: string;
  createdBy: { name: string | null; email: string | null; role: string } | null;
}

interface Stats {
  totalBatches: number;
  totalUsers: number;
  completedRoasting: number;
  pendingProcessing: number;
  batchesByStage: { currentStage: string; _count: { currentStage: number } }[];
  batchesByCreator: { createdById: string | null; _count: { createdById: number } }[];
  batches: Batch[];
  users: { id: string; name: string | null; email: string | null; role: string }[];
}

export default function StatsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // 筛选状态
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    stage: "",
    username: "",
    role: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set("startDate", filters.startDate);
    if (filters.endDate) params.set("endDate", filters.endDate);
    if (filters.stage) params.set("stage", filters.stage);
    if (filters.username) params.set("username", filters.username);
    if (filters.role) params.set("role", filters.role);

    fetch(`/api/stats?${params.toString()}`)
      .then((res) => res.json())
      .then(setStats);
  };

  const resetFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      stage: "",
      username: "",
      role: "",
    });
    fetchStats();
  };

  const exportToMarkdown = () => {
    if (!stats?.batches) return;

    const headers = ["批次号", "创建者", "角色", "阶段", "创建时间"];
    const rows = stats.batches.map((b) => [
      b.batchNumber,
      b.createdBy?.name || "-",
      b.createdBy?.role || "-",
      stageLabels[b.currentStage] || b.currentStage,
      new Date(b.createdAt).toLocaleString("zh-CN"),
    ]);

    // 构建 Markdown 表格
    const headerRow = `| ${headers.join(" | ")} |`;
    const separatorRow = `| ${headers.map(() => "---").join(" | ")} |`;
    const dataRows = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");

    const markdownContent = `# 咖啡批次统计\n\n生成时间: ${new Date().toLocaleString("zh-CN")}\n\n${headerRow}\n${separatorRow}\n${dataRows}`;

    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `咖啡批次统计_${new Date().toISOString().split("T")[0]}.md`;
    link.click();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">加载中...</p>
      </div>
    );
  }

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "GOVERNMENT")) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center">
        <p>无权限访问</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <header className="bg-amber-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="bg-amber-800 hover:bg-amber-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-2">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold">📊 统计分析</h1>
          </div>
          <button
            onClick={exportToMarkdown}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            导出 Markdown
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* 筛选条件 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">筛选条件</h2>
          <div className="grid md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">开始日期</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">结束日期</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">阶段</label>
              <select
                value={filters.stage}
                onChange={(e) => setFilters({ ...filters, stage: e.target.value })}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">全部</option>
                <option value="PLANTING">🌱 种植</option>
                <option value="PROCESSING">⚙️ 加工</option>
                <option value="STORAGE">📦 仓储</option>
                <option value="ROASTING">🔥 烘焙</option>
                <option value="COMPLETED">✅ 完成</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">用户名</label>
              <input
                type="text"
                placeholder="搜索用户名"
                value={filters.username}
                onChange={(e) => setFilters({ ...filters, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">管理组</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="">全部</option>
                <option value="ADMIN">管理员</option>
                <option value="FARMER">农户</option>
                <option value="PROCESSOR">加工商</option>
                <option value="ROASTER">烘焙师</option>
                <option value="WAREHOUSE_MANAGER">仓库管理员</option>
                <option value="GOVERNMENT">政府</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={applyFilters}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
            >
              应用筛选
            </button>
            <button
              onClick={resetFilters}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              重置
            </button>
          </div>
        </div>

        {/* 概览卡片 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-amber-600">{stats?.totalBatches || 0}</div>
            <div className="text-gray-700">总批次数量</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-blue-600">{stats?.totalUsers || 0}</div>
            <div className="text-gray-700">系统用户数</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-green-600">{stats?.completedRoasting || 0}</div>
            <div className="text-gray-700">已完成烘焙</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-3xl font-bold text-orange-600">{stats?.pendingProcessing || 0}</div>
            <div className="text-gray-700">待处理批次</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 阶段分布 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">批次阶段分布</h2>
            <div className="space-y-3">
              {stats?.batchesByStage.map((stage) => (
                <div key={stage.currentStage} className="flex items-center justify-between">
                  <span className="text-gray-700">
                    {stage.currentStage === "PLANTING" && "🌱 种植"}
                    {stage.currentStage === "PROCESSING" && "⚙️ 加工"}
                    {stage.currentStage === "STORAGE" && "📦 仓储"}
                    {stage.currentStage === "ROASTING" && "🔥 烘焙"}
                    {stage.currentStage === "COMPLETED" && "✅ 完成"}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-amber-600 h-2 rounded-full"
                        style={{
                          width: `${stats.totalBatches > 0 ? (stage._count.currentStage / stats.totalBatches) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{stage._count.currentStage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 农户分布 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">农户分布</h2>
            <div className="space-y-3">
              {stats?.batchesByCreator.slice(0, 5).map((creator) => (
                <div key={creator.createdById || "unknown"} className="flex items-center justify-between">
                  <span className="text-gray-700">{creator.createdById ? "农户" : "未知"}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${stats.totalBatches > 0 ? (creator._count.createdById / stats.totalBatches) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">{creator._count.createdById}</span>
                  </div>
                </div>
              ))}
              {stats?.batchesByCreator.length === 0 && (
                <p className="text-gray-600 text-center py-4">暂无数据</p>
              )}
            </div>
          </div>

          {/* 批次列表 */}
          <div className="bg-white rounded-xl shadow-md p-6 col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">批次列表</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">批次号</th>
                    <th className="text-left py-2">创建者</th>
                    <th className="text-left py-2">角色</th>
                    <th className="text-left py-2">阶段</th>
                    <th className="text-left py-2">创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.batches.map((batch) => (
                    <tr key={batch.id} className="border-b">
                      <td className="py-2">{batch.batchNumber}</td>
                      <td className="py-2">{batch.createdBy?.name || batch.createdBy?.email || "-"}</td>
                      <td className="py-2">{batch.createdBy?.role || "-"}</td>
                      <td className="py-2">
                        {batch.currentStage === "PLANTING" && "🌱 种植"}
                        {batch.currentStage === "PROCESSING" && "⚙️ 加工"}
                        {batch.currentStage === "STORAGE" && "📦 仓储"}
                        {batch.currentStage === "ROASTING" && "🔥 烘焙"}
                        {batch.currentStage === "COMPLETED" && "✅ 完成"}
                      </td>
                      <td className="py-2">{new Date(batch.createdAt).toLocaleString("zh-CN")}</td>
                    </tr>
                  ))}
                  {stats?.batches.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-gray-700">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
