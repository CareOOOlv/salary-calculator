import type { DeductionMonthsMode } from '@/calc'

// 专项附加扣除配置
export interface DeductionItemConfig {
  key: string
  label: string
  amount: number
  unit: string
}

export interface DeductionItems {
  [key: string]: boolean
}

export interface EmployeeInput {
  name: string
  baseSalary: string
  positionAllowance: string
  communication: string
  transport: string
  meal: string
  performance: string
  attendance: string
  otherDeduction: string
  sickLeaveDays: string
  personalLeaveDays: string
  sickLeavePayRate: string
  workDaysTotal: string     // 月应出勤天数，不填默认21.75
  skipSocial: boolean       // 批量模式：不缴纳社保
  socialBase: string
  targetNetSalary: string  // 税后倒推模式：目标到手工资
  deductionItems: DeductionItems
  seriousIllnessAmount: string
  cashSubsidy: string
  enableHousingFund: boolean
  housingFundSameAsSocial: boolean
  housingFundBase: string
  housingFundRate: string
}

export interface EmployeeData {
  id: string
  input: EmployeeInput
}

// 内部版：某员工某月的薪酬录入（与 EmployeeInput 相同，按员工id+月份存储）
export interface MonthRecord {
  [empId: string]: EmployeeInput
}

// 全部月份数据：{ '2026-05': { chen: {...}, li: {...} } }
export interface PayrollData {
  [yearMonth: string]: MonthRecord
}

// 累计预扣结果
export interface CumulativeResult extends EmployeeResult {
  cumulativeIncome: number        // 累计收入（截止当月）
  cumulativeDeductionMonths: number // 累计减除费用月数（5000×该月数=减除费用）
  deductionMode: DeductionMonthsMode // 减除费用月份基数口径
  cumulativeTaxable: number       // 累计应纳税所得额
  cumulativeTax: number           // 累计应缴个税
  priorPaidTax: number            // 之前月份已缴个税
}

// 批量计算模式的一行
export interface BatchRow {
  id: string
  name: string
  baseSalary: string
  performance: string
  workDays: string
  social: boolean      // 是否缴纳社保
  housingFund: boolean // 是否缴纳公积金
}

export interface EmployeeResult {
  id: string
  name: string
  socialBase: number             // 实际用于计算的社保基数（skipSocial 时为 0）
  baseSalary: number
  positionAllowance: number
  communication: number
  transport: number
  meal: number
  performance: number
  attendance: number
  otherDeduction: number
  sickLeaveDeduction: number
  personalLeaveDeduction: number
  leaveTotalDeduction: number
  workDaysTotal: number
  actualWorkDays: number
  grossSalary: number
  cashSubsidy: number
  totalIncome: number
  personalPension: number
  personalMedical: number
  personalUnemployment: number
  personalSocialTotal: number
  companyPension: number
  companyMedical: number
  companyUnemployment: number
  companyInjury: number
  companySocialTotal: number
  personalHousingFund: number
  companyHousingFund: number
  specialDeductionTotal: number
  taxableIncome: number
  taxRate: number
  quickDeduction: number
  tax: number
  monthlyTax: number
  netSalary: number
  isReversed?: boolean
}
