import * as XLSX from 'xlsx'
import { fmtRaw, getDeductionAmount } from '@/calc'
import { TAX_THRESHOLD, COMPANY_RATES, PERSONAL_RATES } from '@/constants'
import type { EmployeeResult, EmployeeData } from '@/types'

export function exportExcel(results: EmployeeResult[], yearMonth: string, employees: EmployeeData[]) {
  const wb = XLSX.utils.book_new()
  const wsData: any[][] = []
  const n = results.length

  // 标题
  wsData.push([`${yearMonth}工资表`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  wsData.push([])
  wsData.push([])

  // 表头
  wsData.push([
    '序号', '姓名', '基本工资', '岗位补贴', '通迅费', '交通费', '餐费', '绩效工资', '全勤奖', '其他扣款', '应发工资',
    '固定代扣项目', '', '', '', '', '', '',
    '累计情况', '', '', '', '', '',
    '税款计算', '', '', '', '', '', '',
    '实发工资', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ])
  wsData.push([
    '', '', '', '', '', '', '', '', '', '', '',
    '养老保险', '医疗保险', '失业保险', '补缴社保公积金', '公积金', '代扣合计',
    '累计收入', '费用扣除标准', '三险一金', '专项附加扣除', '其他扣除', '预交应纳税所得',
    '税率', '速算扣除数', '应纳税额', '已缴税额', '应补（退）税额',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ])

  // 数据行
  results.forEach((r, i) => {
    wsData.push([
      i + 1, r.name, fmtRaw(r.baseSalary), fmtRaw(r.positionAllowance), fmtRaw(r.communication),
      fmtRaw(r.transport), fmtRaw(r.meal), fmtRaw(r.performance), fmtRaw(r.attendance),
      fmtRaw(r.otherDeduction), fmtRaw(r.grossSalary),
      fmtRaw(r.personalPension), fmtRaw(r.personalMedical), fmtRaw(r.personalUnemployment),
      0, fmtRaw(r.personalHousingFund), fmtRaw(r.personalSocialTotal + r.personalHousingFund),
      fmtRaw(r.grossSalary), TAX_THRESHOLD, fmtRaw(r.personalSocialTotal + r.personalHousingFund), fmtRaw(r.specialDeductionTotal), 0,
      fmtRaw(r.taxableIncome), r.taxRate, fmtRaw(r.quickDeduction), fmtRaw(r.tax),
      0, fmtRaw(r.monthlyTax),
      fmtRaw(r.netSalary), '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ])
  })

  const sum = (key: keyof EmployeeResult) => results.reduce((s, r) => s + (r[key] as number), 0)
  wsData.push([
    '合计', '', fmtRaw(sum('baseSalary')), fmtRaw(sum('positionAllowance')), fmtRaw(sum('communication')),
    fmtRaw(sum('transport')), fmtRaw(sum('meal')), fmtRaw(sum('performance')), fmtRaw(sum('attendance')),
    fmtRaw(sum('otherDeduction')), fmtRaw(sum('grossSalary')),
    fmtRaw(sum('personalPension')), fmtRaw(sum('personalMedical')), fmtRaw(sum('personalUnemployment')),
    0, fmtRaw(sum('personalHousingFund')), fmtRaw(sum('personalSocialTotal') + sum('personalHousingFund')),
    fmtRaw(sum('grossSalary')), TAX_THRESHOLD * n, fmtRaw(sum('personalSocialTotal') + sum('personalHousingFund')), fmtRaw(sum('specialDeductionTotal')), 0,
    fmtRaw(sum('taxableIncome')), '', 0, fmtRaw(sum('tax')),
    0, fmtRaw(sum('monthlyTax')),
    fmtRaw(sum('netSalary')), '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ])

  // 专项附加扣除明细
  const dedStart = n + 7
  wsData.push([])
  wsData.push([])
  wsData.push([`${yearMonth}专项附加扣除明细`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  wsData.push([
    '序号', '姓名',
    '子女教育', '', '', '', '',
    '继续教育', '', '', '', '',
    '住房贷款利息', '', '', '', '',
    '住房租金', '', '', '', '',
    '赡养老人', '', '', '', '',
    '大病医疗', '', '', '', '',
    '合计', '', '', '', '', '', ''
  ])
  wsData.push([
    '', '',
    '2000元/月/孩', '', '', '', '',
    '400元/月', '', '', '', '',
    '1000元/月', '', '', '', '',
    '1500元/月', '', '', '', '',
    '3000元/月', '', '', '', '',
    '据实扣除', '', '', '', '',
    '', '', '', '', '', '', ''
  ])

  const dedKeys = ['childEducation', 'continuingEducation', 'housingLoan', 'housingRent', 'elderlyCare', 'seriousIllness']
  results.forEach((r, i) => {
    const input = employees[i].input
    const dedValues = dedKeys.map(k => getDeductionAmount(input, k))
    wsData.push([
      i + 1, r.name,
      dedValues[0], '', '', '', '',
      dedValues[1], '', '', '', '',
      dedValues[2], '', '', '', '',
      dedValues[3], '', '', '', '',
      dedValues[4], '', '', '', '',
      dedValues[5], '', '', '', '',
      fmtRaw(r.specialDeductionTotal), '', '', '', '', '', ''
    ])
  })

  wsData.push([
    '合计', '',
    fmtRaw(results.reduce((s, _r, i) => s + getDeductionAmount(employees[i].input, 'childEducation'), 0)),
    '', '', '', '',
    fmtRaw(results.reduce((s, _r, i) => s + getDeductionAmount(employees[i].input, 'continuingEducation'), 0)),
    '', '', '', '',
    fmtRaw(results.reduce((s, _r, i) => s + getDeductionAmount(employees[i].input, 'housingLoan'), 0)),
    '', '', '', '',
    fmtRaw(results.reduce((s, _r, i) => s + getDeductionAmount(employees[i].input, 'housingRent'), 0)),
    '', '', '', '',
    fmtRaw(results.reduce((s, _r, i) => s + getDeductionAmount(employees[i].input, 'elderlyCare'), 0)),
    '', '', '', '',
    fmtRaw(results.reduce((s, _r, i) => s + getDeductionAmount(employees[i].input, 'seriousIllness'), 0)),
    '', '', '', '',
    fmtRaw(sum('specialDeductionTotal')), '', '', '', '', '', ''
  ])

  // 社保公积金缴费明细
  const socStart = dedStart + n + 7
  wsData.push([])
  wsData.push([])
  wsData.push([`${yearMonth}社保公积金缴费明细`, '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''])
  wsData.push([
    '序号', '姓名', '社保基数',
    '企业部分', '', '', '', '',
    '企业社保合计', '企业公积金',
    '个人部分', '', '', '',
    '个人社保合计', '个人公积金',
    '企业+个人合计',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ])
  wsData.push([
    '', '', '',
    '养老保险', '医疗保险', '失业保险', '工伤保险', '',
    '', '',
    '养老保险', '医疗保险', '失业保险', '',
    '', '',
    '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ])
  wsData.push([
    '', '', '',
    COMPANY_RATES.pension, COMPANY_RATES.medical, COMPANY_RATES.unemployment, COMPANY_RATES.injury, '',
    '', '',
    PERSONAL_RATES.pension, PERSONAL_RATES.medical, PERSONAL_RATES.unemployment, '',
    '', '',
    '',
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
  ])

  results.forEach((r, i) => {
    wsData.push([
      i + 1, r.name, fmtRaw(parseFloat(employees[i].input.socialBase) || 0),
      fmtRaw(r.companyPension), fmtRaw(r.companyMedical), fmtRaw(r.companyUnemployment), fmtRaw(r.companyInjury),
      fmtRaw(r.companySocialTotal), fmtRaw(r.companyHousingFund),
      fmtRaw(r.personalPension), fmtRaw(r.personalMedical), fmtRaw(r.personalUnemployment),
      fmtRaw(r.personalSocialTotal), fmtRaw(r.personalHousingFund),
      fmtRaw(r.companySocialTotal + r.companyHousingFund + r.personalSocialTotal + r.personalHousingFund),
      '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''
    ])
  })

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 36 } },
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } },
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } },
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } },
    { s: { r: 3, c: 3 }, e: { r: 4, c: 3 } },
    { s: { r: 3, c: 4 }, e: { r: 4, c: 4 } },
    { s: { r: 3, c: 5 }, e: { r: 4, c: 5 } },
    { s: { r: 3, c: 6 }, e: { r: 4, c: 6 } },
    { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } },
    { s: { r: 3, c: 8 }, e: { r: 4, c: 8 } },
    { s: { r: 3, c: 9 }, e: { r: 4, c: 9 } },
    { s: { r: 3, c: 10 }, e: { r: 4, c: 10 } },
    { s: { r: 3, c: 11 }, e: { r: 3, c: 16 } },
    { s: { r: 3, c: 17 }, e: { r: 3, c: 22 } },
    { s: { r: 3, c: 23 }, e: { r: 3, c: 29 } },
    { s: { r: 3, c: 30 }, e: { r: 3, c: 36 } },
    { s: { r: dedStart, c: 0 }, e: { r: dedStart, c: 36 } },
    { s: { r: dedStart + 1, c: 0 }, e: { r: dedStart + 2, c: 0 } },
    { s: { r: dedStart + 1, c: 1 }, e: { r: dedStart + 2, c: 1 } },
    { s: { r: dedStart + 1, c: 2 }, e: { r: dedStart + 1, c: 6 } },
    { s: { r: dedStart + 1, c: 7 }, e: { r: dedStart + 1, c: 11 } },
    { s: { r: dedStart + 1, c: 12 }, e: { r: dedStart + 1, c: 16 } },
    { s: { r: dedStart + 1, c: 17 }, e: { r: dedStart + 1, c: 21 } },
    { s: { r: dedStart + 1, c: 22 }, e: { r: dedStart + 1, c: 26 } },
    { s: { r: dedStart + 1, c: 27 }, e: { r: dedStart + 1, c: 31 } },
    { s: { r: dedStart + 1, c: 32 }, e: { r: dedStart + 2, c: 36 } },
    { s: { r: socStart, c: 0 }, e: { r: socStart, c: 36 } },
    { s: { r: socStart + 1, c: 0 }, e: { r: socStart + 3, c: 0 } },
    { s: { r: socStart + 1, c: 1 }, e: { r: socStart + 3, c: 1 } },
    { s: { r: socStart + 1, c: 2 }, e: { r: socStart + 3, c: 2 } },
    { s: { r: socStart + 1, c: 3 }, e: { r: socStart + 1, c: 7 } },  // 企业部分合并
    { s: { r: socStart + 1, c: 8 }, e: { r: socStart + 3, c: 8 } },  // 企业社保合计
    { s: { r: socStart + 1, c: 9 }, e: { r: socStart + 3, c: 9 } },  // 企业公积金
    { s: { r: socStart + 1, c: 10 }, e: { r: socStart + 1, c: 13 } }, // 个人部分合并
    { s: { r: socStart + 1, c: 14 }, e: { r: socStart + 3, c: 14 } }, // 个人社保合计
    { s: { r: socStart + 1, c: 15 }, e: { r: socStart + 3, c: 15 } }, // 个人公积金
    { s: { r: socStart + 1, c: 16 }, e: { r: socStart + 3, c: 16 } }, // 企业+个人合计
  ]

  const colWidths: { [key: number]: number } = {
    0: 6, 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10, 9: 10,
    10: 10, 11: 10, 12: 10, 13: 10, 14: 12, 15: 8, 16: 10, 17: 10, 18: 10,
    19: 10, 20: 10, 21: 10, 22: 12, 23: 8, 24: 10, 25: 10, 26: 10, 27: 10,
    28: 12, 29: 10, 30: 10, 31: 10, 32: 10,
  }
  ws['!cols'] = Object.entries(colWidths).map(([_, w]) => ({ wch: w }))

  XLSX.utils.book_append_sheet(wb, ws, '工资表')
  XLSX.writeFile(wb, `${yearMonth}工资表.xlsx`)
}
