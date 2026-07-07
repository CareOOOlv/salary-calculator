import { TAX_THRESHOLD, COMPANY_RATES, PERSONAL_RATES, TAX_BRACKETS, DEDUCTION_ITEMS } from '@/constants'
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
    socialBase: '',
    deductionItems: {},
    seriousIllnessAmount: '',
    cashSubsidy: '',
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

export function calcEmployee(data: EmployeeData): EmployeeResult {
  const input = data.input
  const baseSalary = parseFloat(input.baseSalary) || 0
  const positionAllowance = parseFloat(input.positionAllowance) || 0
  const communication = parseFloat(input.communication) || 0
  const transport = parseFloat(input.transport) || 0
  const meal = parseFloat(input.meal) || 0
  const performance = parseFloat(input.performance) || 0
  const attendance = parseFloat(input.attendance) || 0
  const otherDeduction = parseFloat(input.otherDeduction) || 0
  const socialBase = parseFloat(input.socialBase) || 0
  const cashSubsidy = parseFloat(input.cashSubsidy) || 0

  const specialDeductionTotal = calcSpecialDeduction(input)
  const grossSalary = baseSalary + positionAllowance + communication + transport + meal + performance + attendance - otherDeduction

  const personalPension = Math.round(socialBase * PERSONAL_RATES.pension * 100) / 100
  const personalMedical = Math.round(socialBase * PERSONAL_RATES.medical * 100) / 100
  const personalUnemployment = Math.round(socialBase * PERSONAL_RATES.unemployment * 100) / 100
  const personalSocialTotal = Math.round((personalPension + personalMedical + personalUnemployment) * 100) / 100

  const companyPension = Math.round(socialBase * COMPANY_RATES.pension * 100) / 100
  const companyMedical = Math.round(socialBase * COMPANY_RATES.medical * 100) / 100
  const companyUnemployment = Math.round(socialBase * COMPANY_RATES.unemployment * 100) / 100
  const companyInjury = Math.round(socialBase * COMPANY_RATES.injury * 100) / 100
  const companySocialTotal = Math.round((companyPension + companyMedical + companyUnemployment + companyInjury) * 100) / 100

  const taxableIncome = Math.max(0, grossSalary - TAX_THRESHOLD - personalSocialTotal - specialDeductionTotal)
  const { tax, rate: taxRate, quickDeduction } = calcTax(taxableIncome)
  const monthlyTax = Math.round(tax * 100) / 100 // 月度应扣个税
  const netSalary = Math.round((grossSalary - personalSocialTotal - monthlyTax) * 100) / 100
  const totalIncome = Math.round((netSalary + cashSubsidy) * 100) / 100

  return {
    id: data.id,
    name: input.name || '未命名',
    baseSalary, positionAllowance, communication, transport, meal, performance, attendance, otherDeduction,
    grossSalary: Math.round(grossSalary * 100) / 100,
    cashSubsidy, totalIncome,
    personalPension, personalMedical, personalUnemployment, personalSocialTotal,
    companyPension, companyMedical, companyUnemployment, companyInjury, companySocialTotal,
    specialDeductionTotal,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    taxRate, quickDeduction,
    tax: Math.round(tax * 100) / 100, monthlyTax, netSalary,
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
