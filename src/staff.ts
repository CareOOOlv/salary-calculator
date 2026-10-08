// 员工档案与人事变动记录
import type { EmployeeInput } from '@/types'
import { getDefaultInput } from '@/calc'

// ============ 固定员工列表（人员增加时在此添加） ============
export interface StaffMember {
  id: string
  name: string
  hireDate: string // 入职年月 '2026-05'
  hireDay?: number // 入职日（用于首月按天折算，选填）
}

export const STAFF: StaffMember[] = [
  { id: 'chen', name: '陈崇磐', hireDate: '2026-05' },
  { id: 'li', name: '李攀', hireDate: '2026-05' },
  { id: 'hu', name: '胡博凯', hireDate: '2026-05' },
  { id: 'jia', name: '贾万里', hireDate: '2026-07', hireDay: 27 },
]

// 公司成立运营月份
export const COMPANY_START_MONTH = '2026-05'

// 默认城市
export const COMPANY_CITY = 'hangzhou'

// 该员工在某月是否在职（入职月之后都算；离职当月仍算在职，社保缴到离职当月，次月停缴）
export function isActiveInMonth(staff: StaffMember, yearMonth: string): boolean {
  return yearMonth >= staff.hireDate
}

// 从离职日期取所属月份 'YYYY-MM-DD' | 'YYYY-MM' → 'YYYY-MM'
export function resignMonthOf(resignDate?: string): string | undefined {
  if (!resignDate) return undefined
  const parts = resignDate.split('-')
  if (parts.length < 2) return undefined
  return `${parts[0]}-${parts[1]}`
}

// 员工在某月是否在职：入职月 ≤ 该月 ≤ 离职月（离职当月仍在职并缴社保）
export function isStaffActiveInMonth(profile: StaffProfile, yearMonth: string): boolean {
  if (yearMonth < profile.hireDate) return false
  const rm = resignMonthOf(profile.resignDate)
  if (rm && yearMonth > rm) return false
  return true
}

// 生成可用月份列表（从公司成立到当前月）
export function getMonthList(): string[] {
  const months: string[] = []
  const [startY, startM] = COMPANY_START_MONTH.split('-').map(Number)
  const now = new Date()
  let y = startY
  let m = startM
  while (y < now.getFullYear() || (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }
  return months
}

// ============ 员工档案（当前生效值） ============
export interface StaffProfile {
  id: string
  name: string
  hireDate: string   // 入职年月 '2026-05'
  hireDay?: number   // 入职日
  resignDate?: string // 离职日期 'YYYY-MM-DD'（空=在职；离职当月仍缴社保，次月停缴）
  /**
   * 当年首次取得工资薪金所得（国家税务总局公告2020年第13号）。
   * 勾选后累计减除费用按 5000 × 当年截至本月月份数（从1月起算）。
   * 前提：该员工自纳税年度首月起至入职时，未取得过工资薪金所得，
   *也未按累计预扣法预扣过连续性劳务报酬所得。
   */
  firstIncomeThisYear?: boolean
  baseSalary: string
  positionAllowance: string
  communication: string
  transport: string
  meal: string
  performance: string
  attendance: string
  socialBase: string        // 社保基数（空=按应发工资）
  housingFundBase: string   // 公积金基数（空=同社保基数）
  housingFundRate: string
  enableHousingFund: boolean
  workDaysTotal: string
}

// ============ 人事变动记录 ============
export type ChangeType =
  | 'hire'                 // 入职（入职时间调整）
  | 'resign'               // 离职（设置离职日期）
  | 'salary'               // 调薪（基本工资等）
  | 'social_base'          // 社保基数设定
  | 'housing_fund_base'    // 公积金基数
  | 'housing_fund_rate'    // 公积金比例
  | 'first_income'         // 当年首次取得工资（13号公告减除费用口径）
  | 'other'

export interface PersonnelChange {
  id: string
  staffId: string
  type: ChangeType
  effectiveMonth: string   // 生效月份，该月起按新值计算
  field: string            // 受影响字段名
  oldValue: string
  newValue: string
  reason: string           // 变动原因
  createdAt: string        // 记录时间
}

// ============ localStorage 键 ============
export const PROFILES_KEY = 'toolpro_internal_profiles_v1'
export const CHANGES_KEY = 'toolpro_internal_changes_v1'

// ============ 13 号公告：当年首次取得工资薪金的员工 ============
// 适用前提：该员工自纳税年度首月起至入职时，未取得过工资薪金所得，
// 也未按累计预扣法预扣过连续性劳务报酬所得。
// 勾选后累计减除费用按 5000 × 当年截至本月月份数（从 1 月起算）。
export const FIRST_INCOME_THIS_YEAR: Record<string, boolean> = {
  chen: true,   // 陈崇磐：2026 年 1—4 月无工作，适用
  li:   true,   // 李攀：2026 年 1—4 月无工作，适用
  hu:   true,   // 胡博凯：2026 年 1—4 月无工作，适用
  jia:  false,  // 贾万里：入职前有工作，不适用（从入职月起算）
}

// ============ 初始档案（默认值） ============
// 初始默认薪资（新员工/无数据时使用）
const DEFAULT_SALARY: Record<string, { base: string; social: string; fund: string }> = {
  chen: { base: '25000', social: '18000', fund: '18000' },
  li:   { base: '20000', social: '16000', fund: '16000' },
  hu:   { base: '18000', social: '15000', fund: '15000' },
  jia:  { base: '15000', social: '13200', fund: '13200' },
}

export function getDefaultProfile(staffId: string): StaffProfile {
  const staff = STAFF.find(s => s.id === staffId)
  const ds = DEFAULT_SALARY[staffId] ?? { base: '0', social: '', fund: '' }
  return {
    id: staffId,
    name: staff?.name ?? '',
    hireDate: staff?.hireDate ?? COMPANY_START_MONTH,
    hireDay: staff?.hireDay,
    resignDate: undefined,
    firstIncomeThisYear: FIRST_INCOME_THIS_YEAR[staffId] ?? false,
    baseSalary: ds.base,
    positionAllowance: '',
    communication: '',
    transport: '',
    meal: '',
    performance: '',
    attendance: '',
    socialBase: ds.social,
    housingFundBase: ds.fund,
    housingFundRate: '12',
    enableHousingFund: true,
    workDaysTotal: '',
  }
}

// 初始变动记录：入职记录
export function getInitialChanges(): PersonnelChange[] {
  return STAFF.map(s => ({
    id: 'chg_hire_' + s.id,
    staffId: s.id,
    type: 'hire' as ChangeType,
    effectiveMonth: s.hireDate,
    field: 'hireDate',
    oldValue: '',
    newValue: s.hireDate + (s.hireDay ? `-${String(s.hireDay).padStart(2, '0')}` : ''),
    reason: '入职',
    createdAt: s.hireDate + '-01',
  }))
}

// ============ 工具函数 ============
export function genChangeId(): string {
  return 'chg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)
}

// 把档案转成某月的默认输入（用于工资计算表预填）
export function profileToInput(profile: StaffProfile): EmployeeInput {
  const input = getDefaultInput()
  // 档案公积金比例为 0 视为未开通公积金，新月份默认关闭，无需每月手动取消
  const fundEnabled = profile.enableHousingFund && (parseFloat(profile.housingFundRate) || 0) > 0
  return {
    ...input,
    name: profile.name,
    baseSalary: profile.baseSalary,
    positionAllowance: profile.positionAllowance,
    communication: profile.communication,
    transport: profile.transport,
    meal: profile.meal,
    performance: profile.performance,
    attendance: profile.attendance,
    socialBase: profile.socialBase,
    housingFundBase: profile.housingFundBase,
    housingFundRate: profile.housingFundRate,
    enableHousingFund: fundEnabled,
    workDaysTotal: profile.workDaysTotal,
  }
}

// 根据变动记录，计算某员工在某月生效的档案（回放变动历史）
export function replayProfile(changes: PersonnelChange[], staffId: string, month: string): StaffProfile {
  const profile = getDefaultProfile(staffId)
  // 只回放 effectiveMonth <= month 的变动（按生效月排序）
  const relevant = changes
    .filter(c => c.staffId === staffId && c.effectiveMonth <= month)
    .sort((a, b) => a.effectiveMonth.localeCompare(b.effectiveMonth) || a.createdAt.localeCompare(b.createdAt))

  for (const c of relevant) {
    switch (c.type) {
      case 'hire':
        if (c.field === 'hireDate') {
          // newValue 格式：'YYYY-MM' 或 'YYYY-MM-DD'
          const parts = c.newValue.split('-')
          profile.hireDate = `${parts[0]}-${parts[1]}`
          profile.hireDay = parts[2] ? Number(parts[2]) : undefined
        }
        break
      case 'resign':
        // newValue 格式：'YYYY-MM' 或 'YYYY-MM-DD'，空字符串表示撤销离职（复职）
        profile.resignDate = c.newValue || undefined
        break
      case 'first_income':
        // newValue: 'true' / 'false' —— 切换 13 号公告减除费用口径
        profile.firstIncomeThisYear = c.newValue === 'true'
        break
      case 'salary':
        profile.baseSalary = c.newValue
        break
      case 'social_base':
        profile.socialBase = c.newValue
        break
      case 'housing_fund_base':
        profile.housingFundBase = c.newValue
        break
      case 'housing_fund_rate':
        profile.housingFundRate = c.newValue
        break
    }
  }
  return profile
}
