// 许可证管理模块
// 纯前端实现，localStorage 存储 + 密钥验证

export type PlanTier = 'free' | 'basic' | 'pro'

export interface LicenseInfo {
  tier: PlanTier
  key: string
  expiresAt: number | null // Unix timestamp, null = 永久
  activatedAt: number
}

const LICENSE_STORAGE_KEY = 'salary_calc_license'

// 免费版限制
export const FREE_LIMITS = {
  maxEmployees: 3,
  canExport: false,
  canUseHousingFund: false,
}

// 基础版限制
export const BASIC_LIMITS = {
  maxEmployees: 10,
  canExport: true,
  canUseHousingFund: true,
}

// 专业版限制
export const PRO_LIMITS = {
  maxEmployees: Infinity,
  canExport: true,
  canUseHousingFund: true,
}

// 定价信息
export const PRICING = {
  basic: {
    monthly: 2.9,
    buyout: 9.9,
    label: '基础版',
    description: '≤10人 · 导出Excel · 公积金计算',
  },
  pro: {
    yearly: 29.9,
    label: '专业版',
    description: '无限人数 · 批量导入 · 多城市费率',
  },
}

// 密钥格式：tier:timestamp:hash
// 简单验证（生产环境应换为后端验证）
function generateKeyHash(tier: PlanTier, timestamp: number): string {
  // 简单混淆：用 btoa 编码避免一眼看穿
  const raw = `${tier}:${timestamp}:salary2026`
  return btoa(raw).replace(/=/g, '')
}

function parseKey(key: string): { tier: PlanTier; timestamp: number } | null {
  try {
    // 还原 base64
    const padded = key + '='.repeat((4 - key.length % 4) % 4)
    const decoded = atob(padded)
    const [tier, timestamp, secret] = decoded.split(':')
    if (secret !== 'salary2026') return null
    if (!['free', 'basic', 'pro'].includes(tier)) return null
    return { tier: tier as PlanTier, timestamp: parseInt(timestamp) }
  } catch {
    return null
  }
}

// 获取当前许可证
export function getLicense(): LicenseInfo | null {
  try {
    const stored = localStorage.getItem(LICENSE_STORAGE_KEY)
    if (!stored) return null
    const info = JSON.parse(stored) as LicenseInfo
    // 验证密钥
    const parsed = parseKey(info.key)
    if (!parsed) {
      localStorage.removeItem(LICENSE_STORAGE_KEY)
      return null
    }
    // 检查过期（买断无过期）
    if (info.expiresAt && info.expiresAt < Date.now()) {
      localStorage.removeItem(LICENSE_STORAGE_KEY)
      return null
    }
    return info
  } catch {
    localStorage.removeItem(LICENSE_STORAGE_KEY)
    return null
  }
}

// 激活许可证（用户输入密钥）
export function activateLicense(key: string): LicenseInfo | null {
  const parsed = parseKey(key)
  if (!parsed) return null

  const info: LicenseInfo = {
    tier: parsed.tier,
    key,
    expiresAt: parsed.tier === 'free' ? null : null, // 目前所有版本都是买断
    activatedAt: Date.now(),
  }

  localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(info))
  return info
}

// 生成激活密钥（管理员/开发用）
export function generateLicenseKey(tier: PlanTier): string {
  return generateKeyHash(tier, Date.now())
}

// 获取当前套餐
export function getCurrentTier(): PlanTier {
  const license = getLicense()
  return license?.tier ?? 'free'
}

// 获取当前限制
export function getLimits() {
  const tier = getCurrentTier()
  switch (tier) {
    case 'basic': return BASIC_LIMITS
    case 'pro': return PRO_LIMITS
    default: return FREE_LIMITS
  }
}

// 检查是否可添加员工
export function canAddEmployee(currentCount: number): boolean {
  const limits = getLimits()
  return currentCount < limits.maxEmployees
}

// 检查是否可导出
export function canExport(): boolean {
  return getLimits().canExport
}

// 检查是否可使用公积金
export function canUseHousingFund(): boolean {
  return getLimits().canUseHousingFund
}

// 移除许可证
export function deactivateLicense(): void {
  localStorage.removeItem(LICENSE_STORAGE_KEY)
}
