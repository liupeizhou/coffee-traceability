import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      <header className="bg-amber-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">☕ 咖啡溯源系统</h1>
          <div className="flex gap-2">
            <Link href="/trace" className="bg-amber-800 hover:bg-amber-700 px-3 py-2 rounded-lg transition-colors">
              溯源查询
            </Link>
            <Link href="/login" className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg transition-colors">
              登录
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-16 px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-amber-900 mb-4">
            追溯每一杯咖啡的来源
          </h2>
          <p className="text-xl text-amber-700 max-w-2xl mx-auto">
            从种植到杯中，我们记录咖啡的每一个重要时刻。让每一颗咖啡豆都有迹可循。
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🌱</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">种植</h3>
            <p className="text-gray-600">记录产地、海拔、采收时间等种植信息</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🏭</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">加工</h3>
            <p className="text-gray-600">追踪处理法、发酵参数和加工工艺</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">☕</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">烘焙</h3>
            <p className="text-gray-600">记录烘焙曲线、杯测评分和风味描述</p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/trace"
            className="inline-block bg-amber-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-amber-700 transition-colors"
          >
            开始溯源查询
          </Link>
        </div>
      </main>

      <footer className="bg-amber-900 text-amber-200 py-6 text-center">
        <p>© 2026 咖啡溯源系统. All rights reserved.</p>
      </footer>
    </div>
  );
}
