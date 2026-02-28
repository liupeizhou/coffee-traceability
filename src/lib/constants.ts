// Region codes for batch numbers (with English for UI display)
export const regionCodes: Record<string, string> = {
  BS: "保山 (Baoshan)",
  PE: "普洱 (Puer)",
  DH: "德宏芒市 (Dehong)",
  LC: "临沧 (Lincang)",
  BN: "西双版纳 (Xishuangbanna)",
  OT: "其他 (Other)",
};

// Region codes for API (Chinese only)
export const regionCodesCN: Record<string, string> = {
  BS: "保山",
  PE: "普洱",
  DH: "德宏芒市",
  LC: "临沧",
  BN: "西双版纳",
  OT: "其他",
};

// Stage labels - basic form (used in most places)
export const stageLabels: Record<string, string> = {
  PLANTING: "种植",
  PROCESSING: "加工",
  STORAGE: "仓储",
  ROASTING: "烘焙",
  COMPLETED: "完成",
};

// Stage labels with emoji (used in stats page dropdowns and display)
export const stageLabelsWithEmoji: Record<string, string> = {
  PLANTING: "🌱 种植",
  PROCESSING: "⚙️ 加工",
  STORAGE: "📦 仓储",
  ROASTING: "🔥 烘焙",
  COMPLETED: "✅ 完成",
};

// Stage labels with English (used in batch detail page)
export const stageLabelsWithEnglish: Record<string, string> = {
  PLANTING: "种植 (Planting)",
  PROCESSING: "加工 (Processing)",
  STORAGE: "仓储 (Storage)",
  ROASTING: "烘焙 (Roasting)",
  COMPLETED: "完成 (Completed)",
};

// Stage labels with "记录" suffix (used in audit page)
export const stageLabelsWithRecord: Record<string, string> = {
  PLANTING: "种植记录",
  PROCESSING: "加工记录",
  STORAGE: "仓储记录",
  ROASTING: "烘焙记录",
  BATCH: "批次",
};

// Processing method labels
export const methodLabels: Record<string, string> = {
  WASHED: "水洗 (Washed)",
  NATURAL: "日晒 (Natural)",
  HONEY: "蜜处理 (Honey)",
  CARBONIC_MACERATION: "二氧化碳浸渍 (Carbonic Maceration)",
  OTHER: "其他 (Other)",
};

// Role labels
export const roleLabels: Record<string, string> = {
  ADMIN: "管理员",
  FARMER: "农户",
  PROCESSOR: "加工商",
  ROASTER: "烘焙师",
  WAREHOUSE_MANAGER: "仓库管理员",
  GOVERNMENT: "政府",
};

// Status labels
export const statusLabels: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已批准",
  REJECTED: "已拒绝",
  ACTIVE: "活跃",
};

// Permission maps for stage editing/deleting
export const stageEditRoles: Record<string, string> = {
  PLANTING: "FARMER",
  PROCESSING: "PROCESSOR",
  STORAGE: "WAREHOUSE_MANAGER",
  ROASTING: "ROASTER",
};

export const stageDeleteRoles: Record<string, string> = {
  PLANTING: "FARMER",
  PROCESSING: "PROCESSOR",
  STORAGE: "WAREHOUSE_MANAGER",
  ROASTING: "ROASTER",
};

// Helper to check if user can edit a stage
export const canEditStage = (userRole: string, stage: string): boolean => {
  if (userRole === "ADMIN" || userRole === "GOVERNMENT") return true;
  return stageEditRoles[stage] === userRole;
};

// Helper to check if user can delete a stage
export const canDeleteStage = (userRole: string, stage: string): boolean => {
  if (userRole === "ADMIN") return true;
  return stageDeleteRoles[stage] === userRole;
};
