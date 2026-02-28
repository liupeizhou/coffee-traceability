"use client";

import { useState, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function NewRoastingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const batchId = searchParams.get("batchId");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    machineName: "",
    roastDate: "",
    roastCurveImg: "",
    roastCurveData: "",
    agtronBean: "",
    agtronGround: "",
    cuppingScore: "",
    cuppingNotes: "",
    cuppingFlavors: "",
  });

  const [useUrl, setUseUrl] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "上传失败");
        return;
      }

      setFormData((prev) => ({ ...prev, roastCurveImg: data.url }));
    } catch {
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/roasting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          ...formData,
          agtronBean: formData.agtronBean ? parseFloat(formData.agtronBean) : undefined,
          agtronGround: formData.agtronGround ? parseFloat(formData.agtronGround) : undefined,
          cuppingScore: formData.cuppingScore ? parseFloat(formData.cuppingScore) : undefined,
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
          <h1 className="text-xl font-bold">🔥 添加烘焙记录</h1>
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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">烘焙设备 (Roasting Machine)</label>
              <input
                type="text"
                value={formData.machineName}
                onChange={(e) => setFormData({ ...formData, machineName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                placeholder="例如: Probat 12"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">烘焙日期 (Roast Date)</label>
              <input
                type="date"
                value={formData.roastDate}
                onChange={(e) => setFormData({ ...formData, roastDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* 烘焙曲线图片上传 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">烘焙曲线图 (Roast Curve Image)</label>

            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="curveType"
                  checked={!useUrl}
                  onChange={() => { setUseUrl(false); setFormData({ ...formData, roastCurveImg: "" }); }}
                  className="text-amber-600"
                />
                <span>上传本地图片 (Upload)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="curveType"
                  checked={useUrl}
                  onChange={() => { setUseUrl(true); setFormData({ ...formData, roastCurveImg: "" }); }}
                  className="text-amber-600"
                />
                <span>输入图片链接 (URL)</span>
              </label>
            </div>

            {useUrl ? (
              <input
                type="url"
                value={formData.roastCurveImg}
                onChange={(e) => setFormData({ ...formData, roastCurveImg: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                placeholder="https://example.com/curve.jpg"
              />
            ) : (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
                {uploading && <p className="text-sm text-gray-700">上传中...</p>}
                {formData.roastCurveImg && (
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.roastCurveImg}
                      alt="烘焙曲线"
                      className="h-32 object-contain border rounded"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, roastCurveImg: "" })}
                      className="text-red-600 text-sm hover:underline"
                    >
                      移除
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">烘焙曲线数据 (Roast Curve Data) - JSON</label>
            <textarea
              value={formData.roastCurveData}
              onChange={(e) => setFormData({ ...formData, roastCurveData: e.target.value })}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-sm"
              rows={3}
              placeholder='[{"time": 0, "temp": 150}, {"time": 5, "temp": 180}]'
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Agtron 豆值 (Bean)</label>
              <input
                type="number"
                step="0.1"
                value={formData.agtronBean}
                onChange={(e) => setFormData({ ...formData, agtronBean: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                placeholder="例如: 65"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Agtron 粉值 (Ground)</label>
              <input
                type="number"
                step="0.1"
                value={formData.agtronGround}
                onChange={(e) => setFormData({ ...formData, agtronGround: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                placeholder="例如: 55"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">杯测评分 (Cupping Score)</label>
              <input
                type="number"
                step="0.1"
                max="100"
                value={formData.cuppingScore}
                onChange={(e) => setFormData({ ...formData, cuppingScore: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                placeholder="例如: 86.5"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">风味标签 (Flavors)</label>
              <input
                type="text"
                value={formData.cuppingFlavors}
                onChange={(e) => setFormData({ ...formData, cuppingFlavors: e.target.value })}
                className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
                placeholder="柑橘,茉莉花,坚果 (逗号分隔)"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">风味描述 (Tasting Notes)</label>
            <textarea
              value={formData.cuppingNotes}
              onChange={(e) => setFormData({ ...formData, cuppingNotes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-400 rounded-lg focus:ring-2 focus:ring-amber-500 placeholder:text-gray-500"
              rows={3}
              placeholder="详细的风味描述..."
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

export default function NewRoastingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>加载中...</p></div>}>
      <NewRoastingContent />
    </Suspense>
  );
}
