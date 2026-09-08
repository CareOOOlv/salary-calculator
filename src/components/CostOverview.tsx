import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2 } from 'lucide-react'
import { fmt } from '@/calc'
import type { EmployeeResult } from '@/types'

interface CostOverviewProps {
  results: EmployeeResult[]
  employeeCount: number
}

export function CostOverview({ results, employeeCount }: CostOverviewProps) {
  const sum = (key: keyof EmployeeResult) => results.reduce((s, r) => s + (r[key] as number), 0)

  const totalGrossSalary = sum('grossSalary')
  const totalCompanySocial = sum('companySocialTotal')
  const totalCompanyHousingFund = sum('companyHousingFund')
  const totalCashSubsidy = sum('cashSubsidy')
  const totalNetSalary = sum('netSalary')
  const totalTax = sum('tax')
  const totalPersonalSocial = sum('personalSocialTotal')
  const totalPersonalHousingFund = sum('personalHousingFund')
  const totalLeaveDeduction = sum('leaveTotalDeduction')

  // 个人代扣（企业代收代缴给社保局/税务局的钱，也是企业实际支出的一部分）
  const totalWithholding = totalPersonalSocial + totalPersonalHousingFund + totalTax

  // 企业本月实际支出的人力成本 = 实发工资 + 个人代扣(社保/公积金/个税) + 企业社保 + 企业公积金 + 现金补贴
  // 请假扣款是企业少发的钱，不计入支出
  const totalLaborCost = totalNetSalary + totalWithholding + totalCompanySocial + totalCompanyHousingFund + totalCashSubsidy
  const avgCost = results.length > 0 ? totalLaborCost / results.length : 0

  const hasAnyHousingFund = results.some(r => r.personalHousingFund > 0)

  return (
    <Card className="shadow-lg border-cyan-400/15 bg-gradient-to-r from-cyan-400/5 to-indigo-500/5 backdrop-blur-sm">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-lg flex items-center gap-2 text-white/90">
          <Building2 className="w-5 h-5 text-cyan-400/70" />
          企业本月人力成本支出
          <span className="text-sm font-normal text-white/35 ml-2">{employeeCount} 人</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-4">
        {/* 企业支出 */}
        <div>
          <p className="text-xs font-semibold text-cyan-400/70 mb-2 uppercase tracking-wider">企业支出</p>
          <div className={`grid grid-cols-2 sm:grid-cols-3 ${hasAnyHousingFund ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-2`}>
            <div className="bg-white/5 rounded-lg p-3 border border-white/8 text-center">
              <p className="text-xs text-white/40 mb-1">应发工资</p>
              <p className="text-base font-bold font-mono text-white/90">¥{fmt(totalGrossSalary)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/8 text-center">
              <p className="text-xs text-white/40 mb-1">企业社保</p>
              <p className="text-base font-bold font-mono text-cyan-400">¥{fmt(totalCompanySocial)}</p>
            </div>
            {hasAnyHousingFund && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/8 text-center">
                <p className="text-xs text-white/40 mb-1">企业公积金</p>
                <p className="text-base font-bold font-mono text-orange-400">¥{fmt(totalCompanyHousingFund)}</p>
              </div>
            )}
            <div className="bg-white/5 rounded-lg p-3 border border-white/8 text-center">
              <p className="text-xs text-white/40 mb-1">现金补贴</p>
              <p className="text-base font-bold font-mono text-purple-400">¥{fmt(totalCashSubsidy)}</p>
            </div>
            <div className="bg-red-500/15 rounded-lg p-3 border border-red-400/25 text-center col-span-2 sm:col-span-1">
              <p className="text-xs text-red-300/70 mb-1">总用工成本</p>
              <p className="text-base font-bold font-mono text-red-300">¥{fmt(totalLaborCost)}</p>
              <p className="text-xs text-red-300/50 mt-0.5">人均 ¥{fmt(avgCost)}</p>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-white/35">
            企业实际支出 = 实发工资 ¥{fmt(totalNetSalary)} + 代扣 ¥{fmt(totalWithholding)}
            {totalLeaveDeduction > 0 && ` （请假扣款 ¥${fmt(totalLeaveDeduction)} 已从应发中减去）`}
            + 企业社保 ¥{fmt(totalCompanySocial)}
            {totalCompanyHousingFund > 0 && ` + 企业公积金 ¥${fmt(totalCompanyHousingFund)}`}
            + 现金补贴 ¥{fmt(totalCashSubsidy)} = <span className="font-bold text-red-400">¥{fmt(totalLaborCost)}</span>
          </p>
        </div>

        {/* 员工实发与代扣 */}
        <div>
          <p className="text-xs font-semibold text-emerald-400/70 mb-2 uppercase tracking-wider">员工实发与代扣</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <div className="bg-white/5 rounded-lg p-3 border border-white/8 text-center">
              <p className="text-xs text-white/40 mb-1">实发工资</p>
              <p className="text-base font-bold font-mono text-emerald-400">¥{fmt(totalNetSalary)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/8 text-center">
              <p className="text-xs text-white/40 mb-1">个人社保</p>
              <p className="text-base font-bold font-mono text-indigo-400">¥{fmt(totalPersonalSocial)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/8 text-center">
              <p className="text-xs text-white/40 mb-1">个人公积金</p>
              <p className="text-base font-bold font-mono text-orange-400/80">¥{fmt(totalPersonalHousingFund)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/8 text-center">
              <p className="text-xs text-white/40 mb-1">代扣个税</p>
              <p className="text-base font-bold font-mono text-amber-400">¥{fmt(totalTax)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/8 text-center">
              <p className="text-xs text-white/40 mb-1">代扣合计</p>
              <p className="text-base font-bold font-mono text-white/70">¥{fmt(totalWithholding)}</p>
            </div>
          </div>
          <p className="mt-1.5 text-xs text-white/35">
            实发工资 = 应发 ¥{fmt(totalGrossSalary)}
            {totalLeaveDeduction > 0 && ` - 请假扣款 ¥${fmt(totalLeaveDeduction)}`}
            - 代扣 ¥{fmt(totalWithholding)} = <span className="font-bold text-emerald-400">¥{fmt(totalNetSalary)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
