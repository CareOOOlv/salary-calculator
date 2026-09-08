import type { DeductionItemConfig } from '@/types'
import type { CityConfig } from '@/data/cityData'
import { DEFAULT_CITY_ID, getCityById } from '@/data/cityData'

export const TAX_THRESHOLD = 5000

export function getCompanyRates(cityId: string) {
  const city = getCityById(cityId)
  return city?.companyRates ?? getCityById(DEFAULT_CITY_ID)!.companyRates
}

export function getPersonalRates(cityId: string) {
  const city = getCityById(cityId)
  return city?.personalRates ?? getCityById(DEFAULT_CITY_ID)!.personalRates
}

export function getHousingFundRateOptions(cityId: string) {
  const city = getCityById(cityId) ?? getCityById(DEFAULT_CITY_ID)!
  return city.housingFundRateRange.map(r => ({
    value: String(r),
    label: `${r}%`,
  }))
}

export function getCityConfig(cityId: string): CityConfig {
  return getCityById(cityId) ?? getCityById(DEFAULT_CITY_ID)!
}

export const DEDUCTION_ITEMS: DeductionItemConfig[] = [
  { key: 'childEducation', label: '子女教育', amount: 2000, unit: '元/月/孩' },
  { key: 'continuingEducation', label: '继续教育', amount: 400, unit: '元/月' },
  { key: 'housingLoan', label: '住房贷款利息', amount: 1000, unit: '元/月' },
  { key: 'housingRent', label: '住房租金', amount: 1500, unit: '元/月' },
  { key: 'elderlyCare', label: '赡养老人', amount: 3000, unit: '元/月' },
  { key: 'seriousIllness', label: '大病医疗', amount: 0, unit: '据实扣除' },
]

export const TAX_BRACKETS = [
  { limit: 3000, rate: 0.03, deduction: 0 },
  { limit: 12000, rate: 0.10, deduction: 210 },
  { limit: 25000, rate: 0.20, deduction: 1410 },
  { limit: 35000, rate: 0.25, deduction: 2660 },
  { limit: 55000, rate: 0.30, deduction: 4410 },
  { limit: 80000, rate: 0.35, deduction: 7160 },
  { limit: Infinity, rate: 0.45, deduction: 15160 },
]

export const INCOME_FIELDS: [keyof import('@/types').EmployeeInput, string][] = [
  ['baseSalary', '基本工资'],
  ['positionAllowance', '岗位补贴'],
  ['communication', '通迅费'],
  ['transport', '交通费'],
  ['meal', '餐费'],
  ['performance', '绩效工资'],
  ['attendance', '全勤奖'],
  ['otherDeduction', '其他扣款'],
]
