"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string | null;
  phone: string;
  role: string;
  organization: string | null;
  status: string;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: "管理员",
  GOVERNMENT: "农业局",
  FARMER: "咖农",
  PROCESSOR: "加工厂",
  ROASTER: "烘焙师",
  CAFE: "门店",
  WAREHOUSE_MANAGER: "仓库管理",
};

const statusLabels: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已批准",
  REJECTED: "已拒绝",
};

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "PENDING" | "APPROVED" | "REJECTED">("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessing(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error approving user:", error);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    setProcessing(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error("Error rejecting user:", error);
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

  const filteredUsers = filter === "all" ? users : users.filter(u => u.status === filter);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <header className="bg-amber-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">👥 用户管理</h1>
          <Link href="/dashboard" className="bg-amber-800 hover:bg-amber-700 px-3 py-2 rounded-lg transition-colors">
            ← 返回
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {/* 筛选 */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === "all" ? "bg-amber-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            全部 ({users.length})
          </button>
          <button
            onClick={() => setFilter("PENDING")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === "PENDING" ? "bg-amber-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            待审核 ({users.filter(u => u.status === "PENDING").length})
          </button>
          <button
            onClick={() => setFilter("APPROVED")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === "APPROVED" ? "bg-amber-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            已批准 ({users.filter(u => u.status === "APPROVED").length})
          </button>
          <button
            onClick={() => setFilter("REJECTED")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              filter === "REJECTED" ? "bg-amber-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            已拒绝 ({users.filter(u => u.status === "REJECTED").length})
          </button>
        </div>

        {loading ? (
          <p className="text-gray-700">加载中...</p>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">暂无用户</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      邮箱
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      姓名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      手机号
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      角色
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      机构
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      注册时间
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {user.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {user.name || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {user.phone || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {roleLabels[user.role] || user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                        {user.organization || "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            user.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : user.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {statusLabels[user.status] || user.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {user.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(user.id)}
                              disabled={processing === user.id}
                              className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                            >
                              批准
                            </button>
                            <button
                              onClick={() => handleReject(user.id)}
                              disabled={processing === user.id}
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                            >
                              拒绝
                            </button>
                          </div>
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
