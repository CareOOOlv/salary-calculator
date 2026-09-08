import { TAX_THRESHOLD, TAX_BRACKETS, DEDUCTION_ITEMS, getCompanyRates, getPersonalRates } from '@/constants'
import type { EmployeeInput, EmployeeData, EmployeeResult } from '@/types'

let _idCounter = 0
export function genId() {
  return 'emp_' + Date.now() + '_' + (_idCounter++)
}

export function getDefaultInput(): EmployeeInput {
  return {
    name: '',
    baseSalary: '',
    positionAllowance: '',
    communication: '',
    transport: '',
    meal: '',
    performance: '',
    attendance: '',
    otherDeduction: '',
    sickLeaveDays: '',
    personalLeaveDays: '',
    sickLeavePayRate: '60',
    workDaysTotal: '',
    skipSocial: false,
    socialBase: '',
    targetNetSalary: '',
    deductionItems: {},
    seriousIllnessAmount: '',
    cashSubsidy: '',
    enableHousingFund: false,
    housingFundSameAsSocial: true,
    housingFundBase: '',
    housingFundRate: '12',
  }
}

export function calcTax(taxableIncome: number): { tax: number; rate: number; quickDeduction: number } {
  if (taxableIncome <= 0) return { tax: 0, rate: 0, quickDeduction: 0 }
  for (const b of TAX_BRACKETS) {
    if (taxableIncome <= b.limit) {
      return { tax: Math.max(0, taxableIncome * b.rate - b.deduction), rate: b.rate, quickDeduction: b.deduction }
    }
  }
  const last = TAX_BRACKETS[TAX_BRACKETS.length - 1]
  return { tax: Math.max(0, taxableIncome * last.rate - last.deduction), rate: last.rate, quickDeduction: last.deduction }
}

export function calcSpecialDeduction(input: EmployeeInput): number {
  let total = 0
  for (const item of DEDUCTION_ITEMS) {
    if (input.deductionItems[item.key]) {
      if (item.key === 'seriousIllness') {
        total += parseFloat(input.seriousIllnessAmount) || 0
      } else {
        total += item.amount
      }
    }
  }
  return total
}

export function calcEmployee(data: EmployeeData, cityId: string): EmployeeResult {
  const input = data.input
  const baseSalary = parseFloat(input.baseSalary) || 0
  const positionAllowance = parseFloat(input.positionAllowance) || 0
  const communication = parseFloat(input.communication) || 0
  const transport = parseFloat(input.transport) || 0
  const meal = parseFloat(input.meal) || 0
  const performance = parseFloat(input.performance) || 0
  const attendance = parseFloat(input.attendance) || 0
  const otherDeduction = parseFloat(input.otherDeduction) || 0
  const sickLeaveDays = parseFloat(input.sickLeaveDays) || 0
  const personalLeaveDays = parseFloat(input.personalLeaveDays) || 0
  const sickLeavePayRate = Math.min(100, Math.max(0, parseFloat(input.sickLeavePayRate) || 60)) / 100
  const workDaysTotal = parseFloat(input.workDaysTotal) || 21.75  // 默认法定计薪天数
  const cashSubsidy = parseFloat(input.cashSubsidy) || 0

  const C_RATES = getCompanyRates(cityId)
  const P_RATES = getPersonalRates(cityId)

  const specialDeductionTotal = calcSpecialDeduction(input)
  const grossSalary = baseSalary + positionAllowance + communication + transport + meal + performance + attendance - otherDeduction

  // 考勤扣款：日工资 = 应发工资 / 月计薪天数，病假按比例扣，事假全额扣
  const dailyRate = grossSalary / workDaysTotal
  const sickLeaveDeduction = sickLeaveDays > 0 ? Math.round(dailyRate * sickLeaveDays * (1 - sickLeavePayRate) * 100) / 100 : 0
  const personalLeaveDeduction = personalLeaveDays > 0 ? Math.round(dailyRate * personalLeaveDays * 100) / 100 : 0
  const leaveTotalDeduction = sickLeaveDeduction + personalLeaveDeduction
  const actualWorkDays = workDaysTotal - sickLeaveDays - personalLeaveDays

  // 实发前应纳税工资 = 应发工资 - 考勤扣款
  const effectiveGross = grossSalary - leaveTotalDeduction

  // 社保基数：不填时默认等于应发工资；批量模式可选不缴纳（skipSocial）
  const socialBase = input.skipSocial ? 0 : (parseFloat(input.socialBase) || grossSalary || 0)

  const personalPension = Math.round(socialBase * P_RATES.pension * 100) / 100
  const personalMedical = Math.round(socialBase * P_RATES.medical * 100) / 100
  const personalUnemployment = Math.round(socialBase * P_RATES.unemployment * 100) / 100
  const personalSocialTotal = Math.round((personalPension + personalMedical + personalUnemployment) * 100) / 100

  const companyPension = Math.round(socialBase * C_RATES.pension * 100) / 100
  const companyMedical = Math.round(socialBase * C_RATES.medical * 100) / 100
  const companyUnemployment = Math.round(socialBase * C_RATES.unemployment * 100) / 100
  const companyInjury = Math.round(socialBase * C_RATES.injury * 100) / 100
  const companySocialTotal = Math.round((companyPension + companyMedical + companyUnemployment + companyInjury) * 100) / 100

  const housingFundRate = parseFloat(input.housingFundRate) / 100 || 0.12
  const housingFundBase = input.enableHousingFund
    ? (input.housingFundSameAsSocial ? socialBase : (parseFloat(input.housingFundBase) || 0))
    : 0
  const personalHousingFund = input.enableHousingFund ? Math.round(housingFundBase * housingFundRate * 100) / 100 : 0
  const companyHousingFund = input.enableHousingFund ? Math.round(housingFundBase * housingFundRate * 100) / 100 : 0

  const taxableIncome = Math.max(0, effectiveGross - TAX_THRESHOLD - personalSocialTotal - personalHousingFund - specialDeductionTotal)
  const { tax, rate: taxRate, quickDeduction } = calcTax(taxableIncome)
  const monthlyTax = Math.round(tax * 100) / 100
  const netSalary = Math.round((effectiveGross - personalSocialTotal - personalHousingFund - monthlyTax) * 100) / 100
  const totalIncome = Math.round((netSalary + cashSubsidy) * 100) / 100

  return {
    id: data.id,
    name: input.name || '未命名',
    baseSalary, positionAllowance, communication, transport, meal, performance, attendance, otherDeduction,
    sickLeaveDeduction, personalLeaveDeduction, leaveTotalDeduction,
    workDaysTotal, actualWorkDays: Math.max(0, actualWorkDays),
    grossSalary: Math.round(grossSalary * 100) / 100,
    cashSubsidy, totalIncome,
    personalPension, personalMedical, personalUnemployment, personalSocialTotal,
    companyPension, companyMedical, companyUnemployment, companyInjury, companySocialTotal,
    personalHousingFund, companyHousingFund,
    specialDeductionTotal,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    taxRate, quickDeduction,
    tax: Math.round(tax * 100) / 100, monthlyTax, netSalary,
  }
}

// 税后倒推：给定目标到手工资，倒算应发工资
// socialBase 不填时默认等于倒推出的应发工资；housingFund 可独立填写
export function reverseCalcEmployee(data: EmployeeData, cityId: string): EmployeeResult | null {
  const input = data.input
  const targetNet = parseFloat(input.targetNetSalary)
  if (!targetNet || targetNet <= 0) return null

  const C_RATES = getCompanyRates(cityId)
  const P_RATES = getPersonalRates(cityId)
  const specialDeductionTotal = calcSpecialDeduction(input)
  const housingFundRate = parseFloat(input.housingFundRate) / 100 || 0.12

  // 用户填了就用用户的；没填就在迭代中自动跟随
  const userSocialBase = parseFloat(input.socialBase) || 0
  const userHousingFundBase = input.enableHousingFund ? (parseFloat(input.housingFundBase) || 0) : 0

  // 迭代查找：用户没填社保基数时，用倒推结果作为新的社保基数重算
  // 2-3 轮就能收敛
  let socialBase = userSocialBase
  let housingFundBase = userHousingFundBase
  let gross = 0

  for (let iter = 0; iter < 4; iter++) {
    const personalPension = Math.round(socialBase * P_RATES.pension * 100) / 100
    const personalMedical = Math.round(socialBase * P_RATES.medical * 100) / 100
    const personalUnemployment = Math.round(socialBase * P_RATES.unemployment * 100) / 100
    const personalSocialTotal = Math.round((personalPension + personalMedical + personalUnemployment) * 100) / 100
    const personalHousingFund = input.enableHousingFund ? Math.round(housingFundBase * housingFundRate * 100) / 100 : 0
    const fixedDeductions = personalSocialTotal + personalHousingFund + specialDeductionTotal

    // 二分查找应发工资
    let lo = targetNet + fixedDeductions
    let hi = lo * 3
    let foundGross = lo

    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2
      const taxableIncome = Math.max(0, mid - TAX_THRESHOLD - fixedDeductions)
      const { tax } = calcTax(taxableIncome)
      const net = mid - fixedDeductions - tax
      if (Math.abs(net - targetNet) < 0.01) { foundGross = mid; break }
      if (net < targetNet) lo = mid; else hi = mid
      foundGross = mid
    }

    gross = Math.round(foundGross * 100) / 100

    // 用户没填社保基数：自动设为倒推出的应发工资
    if (!userSocialBase) {
      socialBase = gross
    }
    // 用户没填公积金基数且勾选同社保：跟随
    if (input.enableHousingFund && input.housingFundSameAsSocial && !userHousingFundBase) {
      housingFundBase = socialBase
    }

    // 收敛：填了用户值则不需要再迭代
    if (userSocialBase) break
  }

  // 最终结果
  const personalPension = Math.round(socialBase * P_RATES.pension * 100) / 100
  const personalMedical = Math.round(socialBase * P_RATES.medical * 100) / 100
  const personalUnemployment = Math.round(socialBase * P_RATES.unemployment * 100) / 100
  const personalSocialTotal = Math.round((personalPension + personalMedical + personalUnemployment) * 100) / 100
  const personalHousingFund = input.enableHousingFund ? Math.round(housingFundBase * housingFundRate * 100) / 100 : 0
  const taxableIncome = Math.max(0, gross - TAX_THRESHOLD - personalSocialTotal - personalHousingFund - specialDeductionTotal)
  const { tax, rate: taxRate, quickDeduction } = calcTax(taxableIncome)
  const monthlyTax = Math.round(tax * 100) / 100
  const netSalary = Math.round((gross - personalSocialTotal - personalHousingFund - monthlyTax) * 100) / 100

  const companyPension = Math.round(socialBase * C_RATES.pension * 100) / 100
  const companyMedical = Math.round(socialBase * C_RATES.medical * 100) / 100
  const companyUnemployment = Math.round(socialBase * C_RATES.unemployment * 100) / 100
  const companyInjury = Math.round(socialBase * C_RATES.injury * 100) / 100
  const companySocialTotal = Math.round((companyPension + companyMedical + companyUnemployment + companyInjury) * 100) / 100
  const companyHousingFund = input.enableHousingFund ? Math.round(housingFundBase * housingFundRate * 100) / 100 : 0

  return {
    id: data.id,
    name: input.name || '未命名',
    baseSalary: gross, positionAllowance: 0, communication: 0, transport: 0, meal: 0, performance: 0, attendance: 0, otherDeduction: 0,
    sickLeaveDeduction: 0, personalLeaveDeduction: 0, leaveTotalDeduction: 0,
    workDaysTotal: 21.75, actualWorkDays: 21.75,
    grossSalary: gross,
    cashSubsidy: 0, totalIncome: netSalary,
    personalPension, personalMedical, personalUnemployment, personalSocialTotal,
    companyPension, companyMedical, companyUnemployment, companyInjury, companySocialTotal,
    personalHousingFund, companyHousingFund,
    specialDeductionTotal,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    taxRate, quickDeduction,
    tax: Math.round(tax * 100) / 100, monthlyTax, netSalary,
    isReversed: true,
  }
}

export function fmt(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtRaw(n: number): number {
  return Math.round(n * 100) / 100
}

export function getDeductionAmount(input: EmployeeInput, key: string): number {
  if (!input.deductionItems[key]) return 0
  const item = DEDUCTION_ITEMS.find(d => d.key === key)
  if (!item) return 0
  if (key === 'seriousIllness') return parseFloat(input.seriousIllnessAmount) || 0
  return item.amount
}