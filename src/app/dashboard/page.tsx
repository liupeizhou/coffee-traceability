import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col">
      <header className="bg-amber-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">☕ 咖啡溯源管理</h1>
          <div className="flex items-center gap-4">
            <span className="text-amber-200">
              {user.name || user.email} ({user.role})
            </span>
            <Link href="/api/auth/signout" className="bg-amber-800 hover:bg-amber-700 px-3 py-1 rounded transition-colors">
              退出
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/dashboard/batches" className="block group">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border-t-4 border-amber-600 group-hover:-translate-y-1">
              <div className="text-4xl mb-4">📦</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">批次管理</h2>
              <p className="text-gray-700">查看和管理咖啡批次</p>
            </div>
          </Link>

          <Link href="/trace" className="block group">
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border-t-4 border-amber-600 group-hover:-translate-y-1">
              <div className="text-4xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">溯源查询</h2>
              <p className="text-gray-700">查询咖啡全生命周期</p>
            </div>
          </Link>

          {(user.role === "ADMIN" || user.role === "PROCESSOR" || user.role === "WAREHOUSE_MANAGER") && (
            <Link href="/dashboard/warehouses" className="block group">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border-t-4 border-amber-600 group-hover:-translate-y-1">
                <div className="text-4xl mb-4">🏭</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">仓库管理</h2>
                <p className="text-gray-700">管理仓储仓库信息</p>
              </div>
            </Link>
          )}

          {user.role === "ADMIN" && (
            <>
              <Link href="/dashboard/users" className="block group">
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border-t-4 border-green-600 group-hover:-translate-y-1">
                  <div className="text-4xl mb-4">👥</div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">用户管理</h2>
                  <p className="text-gray-700">审批新注册用户</p>
                </div>
              </Link>
              <Link href="/dashboard/audit" className="block group">
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border-t-4 border-amber-600 group-hover:-translate-y-1">
                  <div className="text-4xl mb-4">⚙️</div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">系统控制面板</h2>
                  <p className="text-gray-700">删除审核与操作日志</p>
                </div>
              </Link>
            </>
          )}

          {(user.role === "ADMIN" || user.role === "GOVERNMENT") && (
            <Link href="/dashboard/stats" className="block group">
              <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 border-t-4 border-amber-600 group-hover:-translate-y-1">
                <div className="text-4xl mb-4">📊</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">统计分析</h2>
                <p className="text-gray-700">全局数据统计与分析</p>
              </div>
            </Link>
          )}
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-md p-6 border-t-4 border-amber-600">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">欢迎使用</h2>
          <p className="text-gray-600 mb-4">
            您的角色是: <span className="font-semibold text-amber-600">{user.role}</span>
          </p>
          {user.organization && (
            <p className="text-gray-700">
              所属机构: <span className="font-semibold text-amber-600">{user.organization}</span>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
