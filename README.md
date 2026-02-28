☕ 咖啡溯源管理系统

给你的咖啡装上"身份证"

MIT License  TypeScript  Next.js 16  GitHub Stars

云南咖啡溯源解决方案 · 在线演示

为什么需要咖啡溯源系统？

咖啡从种植到杯中，每一步都值得关注——但传统的管理模式让消费者无法了解咖啡的来源和品质：

🌱 "这批咖啡豆是哪里种的？" → 查不到，种植信息散落各地
🏭 "加工过程是否符合标准？" → 无记录，品质无法追溯
📦 "仓储条件怎么样？" → 不清楚，运输过程黑箱
🔥 "烘焙曲线如何？" → 没有数据，无法评估品质
☕ "这杯咖啡的完整故事是什么？" → 消费者一无所知
咖啡溯源系统让你的咖啡每一步都有记录：

🌱 种植记录 — 产地、海拔、品种、采收时间
⚙️ 加工记录 — 处理法、发酵参数、品质等级
📦 仓储记录 — 仓库位置、温湿度、储藏时长
🔥 烘焙记录 — 烘焙曲线、Agtron 值、杯测评分
🔍 溯源查询 — 消费者扫码即知全程

⭐ 系统功能

�批次管理
创建和管理咖啡批次，自动生成唯一追溯码
支持按产区（普洱、保山、德宏、临沧、西双版纳）分类
支持跳过阶段，灵活调整批次状态

🌱 种植记录
记录种植位置、海拔、日照、温差、降雨量
记录土壤数据、采收时间、采收量、品质等级

⚙️ 加工记录
支持多种处理法（水洗、日晒、蜜处理、二氧化碳浸渍等）
记录发酵温度、时长、pH 值变化

📦 仓储管理
仓库 CRUD 操作，入库出库记录
温湿度、水活性、含水率、密度等物理参数

🔥 烘焙记录
上传烘焙曲线图片或 URL
记录 Agtron 值（豆值/粉值）、杯测评分、风味标签

🔍 溯源查询
消费者扫码或输入批次号即可查看完整溯源链条
公开查询，无需登录

👥 用户权限
用户注册需管理员审批通过后才能登录
基于角色的权限控制（管理员、咖农、加工商、烘焙师、仓库管理、政府等）

📊 统计分析
按时间、阶段、用户筛选统计数据
Markdown 格式导出报告

⚙️ 系统控制
删除申请审核（种植、加工、仓储、烘焙、整批次）
操作日志记录（IP、操作人、操作时长、状态）

🔧 技术栈

Next.js 16 (App Router)
TypeScript
Prisma ORM + SQLite
NextAuth.js 认证
Tailwind CSS
☕ 快速开始

克隆项目

git clone https://github.com/liupeizhou/coffee-traceability.git
cd coffee-traceability
安装依赖

pnpm install
# 或 npm install
初始化数据库

npx prisma db push
创建管理员账号

首次运行后，数据库会自动创建默认用户：
邮箱: admin@example.com
密码: admin123
启动开发服务器

pnpm dev
打开 http://localhost:3000

📝 使用流程

1. 管理员登录后台
2. 在"用户管理"中审批新注册用户
3. 用户登录后创建批次
4. 按流程添加种植、加工、仓储、烘焙记录
5. 消费者通过溯源页面查询

🔐 默认账号

管理员: admin@example.com / admin123

🎯 角色说明

角色 权限
ADMIN 管理员，审批用户、审核删除、全功能
FARMER 咖农，管理种植记录
PROCESSOR 加工商，管理加工和仓储记录
ROASTER 烘焙师，管理烘焙记录
WAREHOUSE_MANAGER 仓库管理，管理仓储
GOVERNMENT 农业局，查看统计数据

🌐 产区代码

代码 产区
PE 普洱
BS 保山
DH 德宏芒市
LC 临沧
BN 西双版纳
OT 其他

📄 项目结构

src/
├── app/
│   ├── api/           # API 路由
│   ├── dashboard/     # 管理后台
│   ├── trace/        # 溯源查询
│   ├── login/        # 登录
│   └── register/     # 注册
├── lib/
│   ├── auth.ts       # NextAuth 配置
│   ├── constants.ts  # 常量定义
│   └── prisma.ts     # 数据库客户端
└── components/       # 公共组件
🔄 更新日志

v1.0.0 - 初始版本
批次全流程管理（种植、加工、仓储、烘焙）
用户注册审批
删除审核工作流
操作日志
Markdown 导出
欢迎 Star ⭐

如果你有帮助，请 Star 觉得这个项目对你一下！

https://github.com/liupeizhou/coffee-traceability

License

MIT
About

云南咖啡溯源管理系统 - 从种植到杯中的全程可追溯

Topics
nextjs  typescript  coffee  traceability  supply-chain  agriculture  prisma  sqlite
Resources

 Readme
 Stars
License
 MIT license
Activity

Stars
 1 star
Watchers
 1 watching
Forks
Forks
Report repository
