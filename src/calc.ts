import { TAX_THRESHOLD, TAX_BRACKETS, ANNUAL_TAX_BRACKETS, DEDUCTION_ITEMS, getCompanyRates, getPersonalRates } from '@/constants'
import type { EmployeeInput, EmployeeData, EmployeeResult, CumulativeResult } from '@/types'

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

  // 公积金比例：显式填 0 表示不缴（0 不再被兜底成 12%）；只有未填/非法时才默认 12%
  const hfRateParsed = parseFloat(input.housingFundRate)
  const housingFundRate = Number.isFinite(hfRateParsed) ? hfRateParsed / 100 : 0.12
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
    socialBase,
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
  // 公积金比例：显式填 0 表示不缴（0 不再被兜底成 12%）；只有未填/非法时才默认 12%
  const hfRateParsed = parseFloat(input.housingFundRate)
  const housingFundRate = Number.isFinite(hfRateParsed) ? hfRateParsed / 100 : 0.12

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
    socialBase,
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

// 年度综合所得税（累计预扣法）
export function calcAnnualTax(taxableIncome: number): { tax: number; rate: number; deduction: number } {
  if (taxableIncome <= 0) return { tax: 0, rate: 0, deduction: 0 }
  for (const b of ANNUAL_TAX_BRACKETS) {
    if (taxableIncome <= b.limit) {
      return { tax: Math.max(0, taxableIncome * b.rate - b.deduction), rate: b.rate, deduction: b.deduction }
    }
  }
  const last = ANNUAL_TAX_BRACKETS[ANNUAL_TAX_BRACKETS.length - 1]
  return { tax: Math.max(0, taxableIncome * last.rate - last.deduction), rate: last.rate, deduction: last.deduction }
}

// 计算某月从指定日期到月末的实际工作日数（不含周末）
function countWorkDaysFromDay(year: number, month: number, startDay: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = startDay; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return count
}

// 首月折算：入职当月按实际工作天数折算工资
// 社保公积金不再因入职日自动跳过：默认正常缴纳，需要不缴时手动勾选"不缴纳社保"
function adjustFirstMonthInput(inp: EmployeeInput, hireDay: number, hireMonth: string): EmployeeInput {
  const [year, month] = hireMonth.split('-').map(Number)
  const workDaysFromHire = countWorkDaysFromDay(year, month, hireDay)
  const totalWorkDays = parseFloat(inp.workDaysTotal) || 21.75
  const notWorkedDays = Math.max(0, totalWorkDays - workDaysFromHire)

  const existingLeave = parseFloat(inp.personalLeaveDays) || 0

  return {
    ...inp,
    personalLeaveDays: String(Math.round((existingLeave + notWorkedDays) * 100) / 100),
  }
}

// ============ 累计减除费用月份基数口径 ============
// 'tenure'：5000 × 在本单位任职受雇月份数（入职月起算）—— 61 号公告第六条默认口径
// 'yearToDate'：5000 × 当年截至本月月份数（从 1 月 1 日起算）—— 仅适用于
//   「一个纳税年度内首次取得工资、薪金所得」的居民个人（国家税务总局公告 2020 年第 13 号）
export type DeductionMonthsMode = 'tenure' | 'yearToDate'

/**
 * 解析累计减除费用的月份基数。
 * @param mode 口径开关
 * @param hireMonth 入职月'YYYY-MM'
 * @param monthsWorked 从入职月到当前计算月实际参与的月份数
 */
export function resolveDeductionMonths(
  mode: DeductionMonthsMode,
  hireMonth: string | undefined,
  monthsWorked: number,
): number {
  if (mode !== 'yearToDate' || !hireMonth) return monthsWorked
  const [y, m] = hireMonth.split('-').map(Number)
  if (!y || !m) return monthsWorked
  // 当年截至本月 = 本月的自然月序号（1 月 = 1，8 月 = 8）
  const targetMonth = m + monthsWorked - 1
  const base = targetMonth > 12 ? targetMonth - 12 : targetMonth
  return Math.min(12, Math.max(monthsWorked, base))
}

// 内部版：按月份序列计算单个员工某月的工资（累计预扣法）
// monthInputs: 该员工从入职月到目标月的所有月度输入（按时间顺序）
// staffId: 员工 ID（写入结果方便查找 STAFF 记录）
// hireDay: 入职日（用于首月折算，选填）
// hireMonth: 入职月'YYYY-MM'（用于首月折算，选填）
// deductionBaseMonths: 累计减除费用的月份基数口径（见下方 resolveDeductionMonths）
export function calcPayrollMonth(
  monthInputs: EmployeeInput[],
  cityId: string,
  name: string,
  staffId: string,
  hireDay?: number,
  hireMonth?: string,
  deductionMonthsMode: DeductionMonthsMode = 'tenure',
): CumulativeResult {
  // 首月折算：入职当月按实际工作天数折算
  const adjustedInputs = monthInputs.map((inp, idx) => {
    if (idx === 0 && hireDay && hireMonth) {
      return adjustFirstMonthInput(inp, hireDay, hireMonth)
    }
    return inp
  })

  const cur = calcEmployee({ id: staffId, input: adjustedInputs[adjustedInputs.length - 1] }, cityId)

  // 累计到目标月
  let cumulativeIncome = 0
  let cumulativeSocial = 0
  let cumulativeHousing = 0
  let cumulativeSpecial = 0
  for (const inp of adjustedInputs) {
    const r = calcEmployee({ id: name, input: inp }, cityId)
    cumulativeIncome += r.grossSalary - r.leaveTotalDeduction
    cumulativeSocial += r.personalSocialTotal
    cumulativeHousing += r.personalHousingFund
    cumulativeSpecial += r.specialDeductionTotal
  }

  // 累计减除费用口径（见resolveDeductionMonths）：返回截至 currentMonth 的月数
  const deductionMonths = resolveDeductionMonths(deductionMonthsMode, hireMonth, monthInputs.length)
  const cumulativeTaxable = Math.max(0,
    cumulativeIncome
    - TAX_THRESHOLD * deductionMonths   // 减除费用 5000 × 月数
    - cumulativeSocial
    - cumulativeHousing
    - cumulativeSpecial
  )
  const cumulativeTax = calcAnnualTax(cumulativeTaxable).tax

  // 累计到上一个月（用于算本月应补缴 = 累计应缴 - 上月累计已缴）
  let priorTaxable = 0
  let priorTax = 0
  if (adjustedInputs.length > 1) {
    let pIncome = 0, pSocial = 0, pHousing = 0, pSpecial = 0
    for (const inp of adjustedInputs.slice(0, -1)) {
      const r = calcEmployee({ id: name, input: inp }, cityId)
      pIncome += r.grossSalary - r.leaveTotalDeduction
      pSocial += r.personalSocialTotal
      pHousing += r.personalHousingFund
      pSpecial += r.specialDeductionTotal
    }
    const priorDeductionMonths = resolveDeductionMonths(deductionMonthsMode, hireMonth, adjustedInputs.length - 1)
    priorTaxable = Math.max(0, pIncome - TAX_THRESHOLD * priorDeductionMonths - pSocial - pHousing - pSpecial)
    priorTax = calcAnnualTax(priorTaxable).tax
  }

  const monthTax = Math.max(0, Math.round((cumulativeTax - priorTax) * 100) / 100)
  const netSalary = Math.round((cur.grossSalary - cur.leaveTotalDeduction - cur.personalSocialTotal - cur.personalHousingFund - monthTax) * 100) / 100
  const totalIncome = Math.round((netSalary + cur.cashSubsidy) * 100) / 100

  return {
    ...cur,
    monthlyTax: monthTax,
    tax: monthTax,
    netSalary,
    totalIncome,
    cumulativeIncome: Math.round(cumulativeIncome * 100) / 100,
    cumulativeDeductionMonths: deductionMonths,
    deductionMode: deductionMonthsMode,
    cumulativeTaxable: Math.round(cumulativeTaxable * 100) / 100,
    cumulativeTax: Math.round(cumulativeTax * 100) / 100,
    priorPaidTax: Math.round(priorTax * 100) / 100,
  }
}