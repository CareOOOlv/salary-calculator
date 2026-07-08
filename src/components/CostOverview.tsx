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

  const totalNetSalary = sum('netSalary')
  const totalCompanySocial = sum('companySocialTotal')
  const totalCompanyHousingFund = sum('companyHousingFund')
  const totalCashSubsidy = sum('cashSubsidy')
  const totalLaborCost = totalNetSalary + totalCompanySocial + totalCompanyHousingFund + totalCashSubsidy
  const avgCost = results.length > 0 ? totalLaborCost / results.length : 0
  const totalTax = sum('tax')
  const totalPersonalSocial = sum('personalSocialTotal')
  const totalPersonalHousingFund = sum('personalHousingFund')

  const hasAnyHousingFund = results.some(r => r.personalHousingFund > 0)

  // 根据是否有公积金调整 grid 列数
  const gridCols = hasAnyHousingFund ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-8' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-7'

  return (
    <Card className="shadow-md border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          企业总用工成本概览
          <span className="text-sm font-normal text-slate-400 ml-2">{employeeCount} 人</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className={`grid ${gridCols} gap-3`}>
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <p className="text-xs text-slate-500 mb-1">实发工资总额</p>
            <p className="text-base font-bold font-mono text-emerald-700">¥{fmt(totalNetSalary)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <p className="text-xs text-slate-500 mb-1">企业社保总额</p>
            <p className="text-base font-bold font-mono text-blue-700">¥{fmt(totalCompanySocial)}</p>
          </div>
          {hasAnyHousingFund && (
            <div className="bg-white rounded-lg p-3 shadow-sm text-center">
              <p className="text-xs text-slate-500 mb-1">企业公积金总额</p>
              <p className="text-base font-bold font-mono text-orange-700">¥{fmt(totalCompanyHousingFund)}</p>
            </div>
          )}
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <p className="text-xs text-slate-500 mb-1">代扣个税总额</p>
            <p className="text-base font-bold font-mono text-amber-700">¥{fmt(totalTax)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <p className="text-xs text-slate-500 mb-1">个人社保总额</p>
            <p className="text-base font-bold font-mono text-indigo-700">¥{fmt(totalPersonalSocial)}</p>
          </div>
          {hasAnyHousingFund && (
            <div className="bg-white rounded-lg p-3 shadow-sm text-center">
              <p className="text-xs text-slate-500 mb-1">个人公积金总额</p>
              <p className="text-base font-bold font-mono text-orange-500">¥{fmt(totalPersonalHousingFund)}</p>
            </div>
          )}
          <div className="bg-white rounded-lg p-3 shadow-sm text-center">
            <p className="text-xs text-slate-500 mb-1">现金补贴总额</p>
            <p className="text-base font-bold font-mono text-purple-700">¥{fmt(totalCashSubsidy)}</p>
          </div>
          <div className="bg-blue-600 rounded-lg p-3 shadow-sm text-center">
            <p className="text-xs text-blue-200 mb-1">企业总用工成本</p>
            <p className="text-base font-bold font-mono text-white">¥{fmt(totalLaborCost)}</p>
          </div>
          <div className="bg-slate-700 rounded-lg p-3 shadow-sm text-center">
            <p className="text-xs text-slate-300 mb-1">人均用工成本</p>
            <p className="text-base font-bold font-mono text-white">¥{fmt(avgCost)}</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-xs text-slate-500">
            总用工成本 = 实发工资 ¥{fmt(totalNetSalary)} + 企业社保 ¥{fmt(totalCompanySocial)}
            {totalCompanyHousingFund > 0 && ` + 企业公积金 ¥${fmt(totalCompanyHousingFund)}`}
            + 现金补贴 ¥{fmt(totalCashSubsidy)} = <span className="font-bold text-blue-700">¥{fmt(totalLaborCost)}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
