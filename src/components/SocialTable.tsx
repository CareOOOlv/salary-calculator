import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Building2 } from 'lucide-react'
import { fmt } from '@/calc'
import type { EmployeeResult, EmployeeData } from '@/types'
import type { CityConfig } from '@/data/cityData'

// employees 保留在 props 中以兼容既有调用方（当前表格数据全部来自 results）
interface SocialTableProps {
  results: EmployeeResult[]
  employees?: EmployeeData[]
  city: CityConfig
}

export function SocialTable({ results, city }: SocialTableProps) {
  const sum = (key: keyof EmployeeResult) => results.reduce((s, r) => s + (r[key] as number), 0)

  const hasAnyHousingFund = results.some(r => r.personalHousingFund > 0)

  const CR = city.companyRates
  const PR = city.personalRates

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          社保公积金缴费明细 · {city.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
        <Table className="responsive-table min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold whitespace-nowrap sticky-col-header bg-slate-50">姓名</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">社保基数</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-blue-600">企业养老{(CR.pension * 100).toFixed(CR.pension % 1 === 0 ? 0 : 1)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-blue-600">企业医疗{(CR.medical * 100).toFixed(CR.medical % 1 === 0 ? 0 : 1)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-blue-600">企业失业{(CR.unemployment * 100).toFixed(CR.unemployment % 1 === 0 ? 0 : 1)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-blue-600">企业工伤{(CR.injury * 100).toFixed(CR.injury % 1 === 0 ? 0 : 1)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap bg-blue-50 text-blue-700">企业社保合计</TableHead>
              {hasAnyHousingFund && <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-orange-600">企业公积金</TableHead>}
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-indigo-600">个人养老{(PR.pension * 100).toFixed(PR.pension % 1 === 0 ? 0 : 1)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-indigo-600">个人医疗{(PR.medical * 100).toFixed(PR.medical % 1 === 0 ? 0 : 1)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-indigo-600">个人失业{(PR.unemployment * 100).toFixed(PR.unemployment % 1 === 0 ? 0 : 1)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap bg-indigo-50 text-indigo-700">个人社保合计</TableHead>
              {hasAnyHousingFund && <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-orange-600">个人公积金</TableHead>}
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap bg-slate-100">企业+个人</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map(r => {
              const totalCompanyCost = r.companySocialTotal + r.companyHousingFund
              const totalPersonalCost = r.personalSocialTotal + r.personalHousingFund
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-semibold text-sm sticky-col bg-white">{r.name}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(r.socialBase)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(r.companyPension)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(r.companyMedical)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(r.companyUnemployment)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(r.companyInjury)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold bg-blue-50/50">{fmt(r.companySocialTotal)}</TableCell>
                  {hasAnyHousingFund && <TableCell className="text-right font-mono text-sm text-orange-600">{r.companyHousingFund > 0 ? fmt(r.companyHousingFund) : '-'}</TableCell>}
                  <TableCell className="text-right font-mono text-sm">{fmt(r.personalPension)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(r.personalMedical)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmt(r.personalUnemployment)}</TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold bg-indigo-50/50">{fmt(r.personalSocialTotal)}</TableCell>
                  {hasAnyHousingFund && <TableCell className="text-right font-mono text-sm text-orange-600">{r.personalHousingFund > 0 ? fmt(r.personalHousingFund) : '-'}</TableCell>}
                  <TableCell className="text-right font-mono text-sm font-semibold bg-slate-50">{fmt(totalCompanyCost + totalPersonalCost)}</TableCell>
                </TableRow>
              )
            })}
            <TableRow className="bg-slate-100 font-bold">
              <TableCell className="text-sm sticky-col bg-slate-100">合计</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('socialBase'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('companyPension'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('companyMedical'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('companyUnemployment'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('companyInjury'))}</TableCell>
              <TableCell className="text-right font-mono text-sm bg-blue-50/50">{fmt(sum('companySocialTotal'))}</TableCell>
              {hasAnyHousingFund && <TableCell className="text-right font-mono text-sm text-orange-600">{fmt(sum('companyHousingFund'))}</TableCell>}
              <TableCell className="text-right font-mono text-sm">{fmt(sum('personalPension'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('personalMedical'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('personalUnemployment'))}</TableCell>
              <TableCell className="text-right font-mono text-sm bg-indigo-50/50">{fmt(sum('personalSocialTotal'))}</TableCell>
              {hasAnyHousingFund && <TableCell className="text-right font-mono text-sm text-orange-600">{fmt(sum('personalHousingFund'))}</TableCell>}
              <TableCell className="text-right font-mono text-sm bg-slate-50">{fmt(sum('companySocialTotal') + sum('companyHousingFund') + sum('personalSocialTotal') + sum('personalHousingFund'))}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
