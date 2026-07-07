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
  socialBase: string
  deductionItems: DeductionItems
  seriousIllnessAmount: string
  cashSubsidy: string
}

export interface EmployeeData {
  id: string
  input: EmployeeInput
}

export interface EmployeeResult {
  id: string
  name: string
  baseSalary: number
  positionAllowance: number
  communication: number
  transport: number
  meal: number
  performance: number
  attendance: number
  otherDeduction: number
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
  specialDeductionTotal: number
  taxableIncome: number
  taxRate: number
  quickDeduction: number
  tax: number
  monthlyTax: number // renamed from taxRefund (tax - paidTax, paidTax always 0 for monthly calc)
  netSalary: number
}
