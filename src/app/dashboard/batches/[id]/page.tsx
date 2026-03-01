"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { methodLabels, stageLabelsWithEnglish, canEditStage, canDeleteStage } from "@/lib/constants";

interface PlantingRecord {
  readonly id: string;
  readonly farmLocation: string;
  readonly altitude: number | null;
  readonly sunlightHours: number | null;
  readonly tempDifference: number | null;
  readonly rainfall: number | null;
  readonly soilData: string | null;
  readonly harvestTime: Date;
  readonly harvestQuantity: number | null;
  readonly qualityGrade: string | null;
}

interface ProcessingRecord {
  readonly id: string;
  readonly method: string;
  readonly startDate: Date;
  readonly endDate: Date | null;
  readonly durationHours: number | null;
  readonly phValue: string | null;
  readonly temperature: number | null;
  readonly notes: string | null;
}

interface StorageRecord {
  readonly id: string;
  readonly warehouseName: string | null;
  readonly warehouseAddress: string | null;
  readonly entryDate: Date | null;
  readonly exitDate: Date | null;
  readonly conditions: string | null;
  readonly temperature: number | null;
  readonly humidity: number | null;
  readonly storageDuration: number | null;
  readonly moisture: number | null;
  readonly waterActivity: number | null;
  readonly density: number | null;
}

interface RoastingRecord {
  readonly id: string;
  readonly machineName: string | null;
  readonly roastDate: Date | null;
  readonly roastCurveImg: string | null;
  readonly roastCurveData: string | null;
  readonly agtronBean: number | null;
  readonly agtronGround: number | null;
  readonly cuppingScore: number | null;
  readonly cuppingNotes: string | null;
  readonly cuppingFlavors: string | null;
}

interface BatchDetail {
  readonly id: string;
  readonly batchNumber: string;
  readonly skuName: string | null;
  readonly currentStage: string;
  readonly status: string;
  readonly plantingRecord: PlantingRecord | null;
  readonly processingRecord: ProcessingRecord | null;
  readonly storageRecord: StorageRecord | null;
  readonly roastingRecord: RoastingRecord | null;
  readonly deleteRequests: readonly { readonly id: string; readonly status: string }[];
}


export default function BatchDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingSku, setEditingSku] = useState(false);
  const [skuName, setSkuName] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // 检查是否有待审核的删除请求
  const hasPendingDelete = batch?.deleteRequests && batch.deleteRequests.length > 0;

  const userRole = session?.user?.role || "";

  useEffect(() => {
    if (params.id) {
      fetchBatch();
    }
  }, [params.id]);

  const fetchBatch = async () => {
    try {
      const res = await fetch(`/api/batches/${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setBatch(data);
        setSkuName(data.skuName || "");
      } else {
        setError(data.error || "获取失败");
      }
    } catch {
      setError("获取失败");
    } finally {
      setLoading(false);
    }
  };

  const updateSkuName = async () => {
    try {
      const res = await fetch(`/api/batches/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skuName }),
      });
      if (res.ok) {
        setBatch({ ...batch!, skuName });
        setEditingSku(false);
      }
    } catch (error) {
      console.error("Error updating skuName:", error);
    }
  };

  const handleStatusChange = async () => {
    if (!batch || !newStatus) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/batches/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStage: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setBatch({ ...batch, currentStage: updated.currentStage });
        setShowStatusModal(false);
        setNewStatus("");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleDeleteRequest = async (stage: string) => {
    if (!batch) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/delete-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          stage,
          reason: deleteReason,
        }),
      });
      if (res.ok) {
        const newRequest = await res.json();
        alert("删除申请已提交，等待管理员审核");
        setShowDeleteModal(null);
        setDeleteReason("");
        // 更新本地状态，添加新的删除请求
        setBatch({
          ...batch,
          deleteRequests: [...batch.deleteRequests, { id: newRequest.id, status: "PENDING" }]
        });
      }
    } catch (error) {
      console.error("Error requesting delete:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const canEdit = (stage: string) => canEditStage(userRole, stage);
  const canDelete = (stage: string) => canDeleteStage(userRole, stage);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>请先 <Link href="/login" className="text-amber-600">登录</Link></p>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{error || "批次不存在"}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <header className="bg-amber-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">📦 批次详情</h1>
            <p className="text-amber-200 font-mono text-sm">{batch.batchNumber}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowStatusModal(true)}
              disabled={hasPendingDelete}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              调整状态
            </button>
            <Link href="/dashboard/batches" className="bg-amber-800 hover:bg-amber-700 px-3 py-2 rounded-lg transition-colors">
              ← 返回
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">商品名称 (Product Name)</p>
              {editingSku ? (
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    value={skuName}
                    onChange={(e) => setSkuName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-400 rounded focus:ring-1 focus:ring-amber-500"
                    placeholder="输入商品名称"
                  />
                  <button onClick={updateSkuName} className="px-3 py-1 bg-amber-600 text-white rounded text-sm">
                    保存
                  </button>
                  <button onClick={() => setEditingSku(false)} className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm">
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg text-gray-900">{batch.skuName || "未设置 (Not Set)"}</p>
                  <button
                    onClick={() => setEditingSku(true)}
                    disabled={hasPendingDelete}
                    className="text-amber-600 hover:underline text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    编辑
                  </button>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">当前阶段 (Current Stage)</p>
              <span className="px-2 py-1 text-sm rounded-full bg-amber-100 text-amber-800">
                {stageLabelsWithEnglish[batch.currentStage] || batch.currentStage}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">状态 (Status)</p>
              <span className="px-2 py-1 text-sm rounded-full bg-green-100 text-green-800">
                {batch.status === "ACTIVE" ? "活跃 (Active)" : batch.status}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 种植记录 */}
          <div className={`bg-white rounded-lg shadow p-6 ${batch.plantingRecord ? 'border-l-4 border-l-amber-500' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">🌱 种植记录 (Planting)</h2>
              <div className="flex gap-2">
                {!batch.plantingRecord && batch.currentStage === "PLANTING" && !hasPendingDelete && (
                  <Link href={`/dashboard/planting/new?batchId=${batch.id}`} className="text-sm text-amber-600 hover:underline">
                    添加记录
                  </Link>
                )}
                {batch.plantingRecord && canEdit("PLANTING") && !hasPendingDelete && (
                  <Link href={`/dashboard/planting/edit/${batch.plantingRecord.id}?batchId=${batch.id}`} className="text-sm text-blue-600 hover:underline">
                    编辑
                  </Link>
                )}
                {batch.plantingRecord && canDelete("PLANTING") && !hasPendingDelete && (
                  <button onClick={() => setShowDeleteModal("PLANTING")} className="text-sm text-red-600 hover:underline">
                    删除
                  </button>
                )}
              </div>
            </div>
            {batch.plantingRecord ? (
              expandedSection === 'planting' ? (
                <div className="space-y-3 text-sm">
                  <p><span className="text-gray-700">产地 (Location):</span> {batch.plantingRecord.farmLocation}</p>
                  <p><span className="text-gray-700">海拔 (Altitude):</span> {batch.plantingRecord.altitude || "-"} m</p>
                  <p><span className="text-gray-700">日照时长 (Sunlight):</span> {batch.plantingRecord.sunlightHours || "-"} 小时/天</p>
                  <p><span className="text-gray-700">昼夜温差 (Temp Diff):</span> {batch.plantingRecord.tempDifference || "-"} °C</p>
                  <p><span className="text-gray-700">年降雨量 (Rainfall):</span> {batch.plantingRecord.rainfall || "-"} mm</p>
                  <p><span className="text-gray-700">土壤pH (Soil pH):</span> {batch.plantingRecord.soilData || "-"}</p>
                  <p><span className="text-gray-700">采收时间 (Harvest Time):</span> {new Date(batch.plantingRecord.harvestTime).toLocaleDateString("zh-CN")}</p>
                  <p><span className="text-gray-700">采收量 (Quantity):</span> {batch.plantingRecord.harvestQuantity || "-"} kg</p>
                  <p><span className="text-gray-700">品质等级 (Grade):</span> {batch.plantingRecord.qualityGrade || "-"}</p>
                  <button onClick={() => setExpandedSection(null)} className="text-amber-600 text-sm mt-2">收起详情</button>
                </div>
              ) : (
                <div className="space-y-2 text-sm cursor-pointer" onClick={() => toggleSection('planting')}>
                  <p><span className="text-gray-700">产地:</span> {batch.plantingRecord.farmLocation}</p>
                  <p><span className="text-gray-700">海拔:</span> {batch.plantingRecord.altitude || "-"}m</p>
                  <p><span className="text-gray-700">采收时间:</span> {new Date(batch.plantingRecord.harvestTime).toLocaleDateString("zh-CN")}</p>
                  <p className="text-amber-600 text-xs mt-2">点击查看详情</p>
                </div>
              )
            ) : (
              <p className="text-gray-700">暂无记录</p>
            )}
          </div>

          {/* 加工记录 */}
          <div className={`bg-white rounded-lg shadow p-6 ${batch.processingRecord ? 'border-l-4 border-l-amber-500' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">🏭 加工记录 (Processing)</h2>
              <div className="flex gap-2">
                {!batch.processingRecord && batch.currentStage === "PROCESSING" && !hasPendingDelete && (
                  <Link href={`/dashboard/processing/new?batchId=${batch.id}`} className="text-sm text-amber-600 hover:underline">
                    添加记录
                  </Link>
                )}
                {batch.processingRecord && canEdit("PROCESSING") && !hasPendingDelete && (
                  // 编辑页面暂未开放
                  <span className="text-gray-400 text-sm">编辑</span>
                )}
                {batch.processingRecord && canDelete("PROCESSING") && !hasPendingDelete && (
                  <button onClick={() => setShowDeleteModal("PROCESSING")} className="text-sm text-red-600 hover:underline">
                    删除
                  </button>
                )}
              </div>
            </div>
            {batch.processingRecord ? (
              expandedSection === 'processing' ? (
                <div className="space-y-3 text-sm">
                  <p><span className="text-gray-700">处理法 (Method):</span> {methodLabels[batch.processingRecord.method] || batch.processingRecord.method}</p>
                  <p><span className="text-gray-700">开始时间 (Start):</span> {new Date(batch.processingRecord.startDate).toLocaleDateString("zh-CN")}</p>
                  <p><span className="text-gray-700">结束时间 (End):</span> {batch.processingRecord.endDate ? new Date(batch.processingRecord.endDate).toLocaleDateString("zh-CN") : "-"}</p>
                  <p><span className="text-gray-700">处理时长 (Duration):</span> {batch.processingRecord.durationHours || "-"} 小时</p>
                  <p><span className="text-gray-700">发酵温度 (Temp):</span> {batch.processingRecord.temperature || "-"} °C</p>
                  <p><span className="text-gray-700">pH值 (pH Value):</span> {batch.processingRecord.phValue || "-"}</p>
                  <p><span className="text-gray-700">备注 (Notes):</span> {batch.processingRecord.notes || "-"}</p>
                  <button onClick={() => setExpandedSection(null)} className="text-amber-600 text-sm mt-2">收起详情</button>
                </div>
              ) : (
                <div className="space-y-2 text-sm cursor-pointer" onClick={() => toggleSection('processing')}>
                  <p><span className="text-gray-700">处理法:</span> {methodLabels[batch.processingRecord.method] || batch.processingRecord.method}</p>
                  <p><span className="text-gray-700">开始时间:</span> {new Date(batch.processingRecord.startDate).toLocaleDateString("zh-CN")}</p>
                  <p className="text-amber-600 text-xs mt-2">点击查看详情</p>
                </div>
              )
            ) : (
              <p className="text-gray-700">暂无记录</p>
            )}
          </div>

          {/* 仓储记录 */}
          <div className={`bg-white rounded-lg shadow p-6 ${batch.storageRecord ? 'border-l-4 border-l-amber-500' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">📦 仓储记录 (Storage)</h2>
              <div className="flex gap-2">
                {!batch.storageRecord && batch.currentStage === "STORAGE" && !hasPendingDelete && (
                  <Link href={`/dashboard/storage/new?batchId=${batch.id}`} className="text-sm text-amber-600 hover:underline">
                    添加记录
                  </Link>
                )}
                {batch.storageRecord && canEdit("STORAGE") && !hasPendingDelete && (
                  <span className="text-gray-400 text-sm">编辑</span>
                )}
                {batch.storageRecord && canDelete("STORAGE") && !hasPendingDelete && (
                  <button onClick={() => setShowDeleteModal("STORAGE")} className="text-sm text-red-600 hover:underline">
                    删除
                  </button>
                )}
              </div>
            </div>
            {batch.storageRecord ? (
              expandedSection === 'storage' ? (
                <div className="space-y-3 text-sm">
                  <p><span className="text-gray-700">仓库名称 (Warehouse):</span> {batch.storageRecord.warehouseName || "-"}</p>
                  <p><span className="text-gray-700">仓库地址 (Address):</span> {batch.storageRecord.warehouseAddress || "-"}</p>
                  <p><span className="text-gray-700">入库时间 (Entry):</span> {batch.storageRecord.entryDate ? new Date(batch.storageRecord.entryDate).toLocaleDateString("zh-CN") : "-"}</p>
                  <p><span className="text-gray-700">出库时间 (Exit):</span> {batch.storageRecord.exitDate ? new Date(batch.storageRecord.exitDate).toLocaleDateString("zh-CN") : "-"}</p>
                  <p><span className="text-gray-700">储藏天数 (Duration):</span> {batch.storageRecord.storageDuration || "-"} 天</p>
                  <p><span className="text-gray-700">温度 (Temperature):</span> {batch.storageRecord.temperature || "-"} °C</p>
                  <p><span className="text-gray-700">湿度 (Humidity):</span> {batch.storageRecord.humidity || "-"} %</p>
                  <button onClick={() => setExpandedSection(null)} className="text-amber-600 text-sm mt-2">收起详情</button>
                </div>
              ) : (
                <div className="space-y-2 text-sm cursor-pointer" onClick={() => toggleSection('storage')}>
                  <p><span className="text-gray-700">仓库:</span> {batch.storageRecord.warehouseName || "-"}</p>
                  <p><span className="text-gray-700">温度:</span> {batch.storageRecord.temperature || "-"}°C</p>
                  <p className="text-amber-600 text-xs mt-2">点击查看详情</p>
                </div>
              )
            ) : (
              <p className="text-gray-700">暂无记录</p>
            )}
          </div>

          {/* 烘焙记录 */}
          <div className={`bg-white rounded-lg shadow p-6 ${batch.roastingRecord ? 'border-l-4 border-l-amber-500' : ''}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">☕ 烘焙记录 (Roasting)</h2>
              <div className="flex gap-2">
                {!batch.roastingRecord && batch.currentStage === "ROASTING" && !hasPendingDelete && (
                  <Link href={`/dashboard/roasting/new?batchId=${batch.id}`} className="text-sm text-amber-600 hover:underline">
                    添加记录
                  </Link>
                )}
                {batch.roastingRecord && canEdit("ROASTING") && !hasPendingDelete && (
                  <span className="text-gray-400 text-sm">编辑</span>
                )}
                {batch.roastingRecord && canDelete("ROASTING") && !hasPendingDelete && (
                  <button onClick={() => setShowDeleteModal("ROASTING")} className="text-sm text-red-600 hover:underline">
                    删除
                  </button>
                )}
              </div>
            </div>
            {batch.roastingRecord ? (
              expandedSection === 'roasting' ? (
                <div className="space-y-3 text-sm">
                  <p><span className="text-gray-700">烘焙设备 (Machine):</span> {batch.roastingRecord.machineName || "-"}</p>
                  <p><span className="text-gray-700">烘焙日期 (Date):</span> {batch.roastingRecord.roastDate ? new Date(batch.roastingRecord.roastDate).toLocaleDateString("zh-CN") : "-"}</p>
                  <p><span className="text-gray-700">Agtron豆值 (Bean):</span> {batch.roastingRecord.agtronBean || "-"}</p>
                  <p><span className="text-gray-700">Agtron粉值 (Ground):</span> {batch.roastingRecord.agtronGround || "-"}</p>
                  <p><span className="text-gray-700">杯测评分 (Score):</span> {batch.roastingRecord.cuppingScore || "-"}</p>
                  <p><span className="text-gray-700">风味标签 (Flavors):</span> {batch.roastingRecord.cuppingFlavors || "-"}</p>
                  <p><span className="text-gray-700">风味描述 (Notes):</span> {batch.roastingRecord.cuppingNotes || "-"}</p>
                  {batch.roastingRecord.roastCurveImg && (
                    <div className="mt-2">
                      <p className="text-gray-600 mb-1">烘焙曲线 (Curve):</p>
                      <img src={batch.roastingRecord.roastCurveImg} alt="烘焙曲线" className="max-w-full h-40 object-contain border rounded" />
                    </div>
                  )}
                  <button onClick={() => setExpandedSection(null)} className="text-amber-600 text-sm mt-2">收起详情</button>
                </div>
              ) : (
                <div className="space-y-2 text-sm cursor-pointer" onClick={() => toggleSection('roasting')}>
                  <p><span className="text-gray-700">设备:</span> {batch.roastingRecord.machineName || "-"}</p>
                  <p><span className="text-gray-700">杯测评分:</span> {batch.roastingRecord.cuppingScore || "-"}</p>
                  <p className="text-amber-600 text-xs mt-2">点击查看详情</p>
                </div>
              )
            ) : (
              <p className="text-gray-700">暂无记录</p>
            )}
          </div>
        </div>
      </main>

      {/* 删除确认弹窗 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">申请删除 {stageLabelsWithEnglish[showDeleteModal]}</h2>
            <p className="text-gray-600 mb-4">删除申请需要管理员审核，审核通过后将无法恢复。</p>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="请输入删除原因 (可选)"
              className="w-full px-4 py-2 border border-gray-400 rounded-lg mb-4"
              rows={3}
            />
            <div className="flex gap-4">
              <button
                onClick={() => handleDeleteRequest(showDeleteModal)}
                disabled={submitting}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? "提交中..." : "确认申请删除"}
              </button>
              <button
                onClick={() => { setShowDeleteModal(null); setDeleteReason(""); }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 状态调整弹窗 */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold mb-4">调整批次状态</h2>
            <p className="text-gray-600 mb-4">
              当前状态: <span className="font-semibold">{stageLabelsWithEnglish[batch?.currentStage || ""]}</span>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                选择新状态 *
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              >
                <option value="">请选择</option>
                <option value="PLANTING">🌱 种植</option>
                <option value="PROCESSING">⚙️ 加工</option>
                <option value="STORAGE">📦 仓储</option>
                <option value="ROASTING">🔥 烘焙</option>
                <option value="COMPLETED">✅ 完成</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleStatusChange}
                disabled={submitting || !newStatus}
                className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50"
              >
                {submitting ? "保存中..." : "确认修改"}
              </button>
              <button
                onClick={() => { setShowStatusModal(false); setNewStatus(""); }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 待审核警告 */}
      {hasPendingDelete && (
        <div className="fixed top-20 right-4 z-40 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-bold">待审核中</p>
              <p className="text-sm">此批次有待处理的删除申请，暂时无法编辑</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
