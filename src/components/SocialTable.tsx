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
import { COMPANY_RATES, PERSONAL_RATES } from '@/constants'
import type { EmployeeResult, EmployeeData } from '@/types'

interface SocialTableProps {
  results: EmployeeResult[]
  employees: EmployeeData[]
}

export function SocialTable({ results, employees }: SocialTableProps) {
  const sum = (key: keyof EmployeeResult) => results.reduce((s, r) => s + (r[key] as number), 0)

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          社保缴费明细
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold whitespace-nowrap">姓名</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">缴费基数</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-blue-600">企业养老{((COMPANY_RATES.pension) * 100).toFixed(0)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-blue-600">企业医疗{(COMPANY_RATES.medical * 100).toFixed(1)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-blue-600">企业失业{(COMPANY_RATES.unemployment * 100).toFixed(1)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-blue-600">企业工伤{(COMPANY_RATES.injury * 100).toFixed(1)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap bg-blue-50 text-blue-700">企业合计</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-indigo-600">个人养老{(PERSONAL_RATES.pension * 100).toFixed(0)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-indigo-600">个人医疗{(PERSONAL_RATES.medical * 100).toFixed(0)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-indigo-600">个人失业{(PERSONAL_RATES.unemployment * 100).toFixed(1)}%</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap bg-indigo-50 text-indigo-700">个人合计</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap bg-slate-100">企业+个人</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r, i) => (
              <TableRow key={r.id}>
                <TableCell className="font-semibold text-sm">{r.name}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(parseFloat(employees[i].input.socialBase) || 0)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.companyPension)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.companyMedical)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.companyUnemployment)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.companyInjury)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold bg-blue-50/50">{fmt(r.companySocialTotal)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.personalPension)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.personalMedical)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.personalUnemployment)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold bg-indigo-50/50">{fmt(r.personalSocialTotal)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold bg-slate-50">{fmt(r.companySocialTotal + r.personalSocialTotal)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-slate-100 font-bold">
              <TableCell className="text-sm">合计</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(results.reduce((s, _r, i) => s + (parseFloat(employees[i].input.socialBase) || 0), 0))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('companyPension'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('companyMedical'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('companyUnemployment'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('companyInjury'))}</TableCell>
              <TableCell className="text-right font-mono text-sm bg-blue-50/50">{fmt(sum('companySocialTotal'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('personalPension'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('personalMedical'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('personalUnemployment'))}</TableCell>
              <TableCell className="text-right font-mono text-sm bg-indigo-50/50">{fmt(sum('personalSocialTotal'))}</TableCell>
              <TableCell className="text-right font-mono text-sm bg-slate-50">{fmt(sum('companySocialTotal') + sum('personalSocialTotal'))}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
