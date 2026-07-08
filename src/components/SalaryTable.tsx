import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Receipt } from 'lucide-react'
import { fmt } from '@/calc'
import type { EmployeeResult } from '@/types'

interface SalaryTableProps {
  results: EmployeeResult[]
}

export function SalaryTable({ results }: SalaryTableProps) {
  const sum = (key: keyof EmployeeResult) => results.reduce((s, r) => s + (r[key] as number), 0)

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="w-5 h-5 text-blue-600" />
          工资明细汇总表
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
        <Table className="responsive-table min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold whitespace-nowrap sticky-col-header bg-slate-50">姓名</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">基本工资</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">岗位补贴</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">通迅费</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">交通费</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">餐费</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">绩效工资</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">全勤奖</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">扣款</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap bg-blue-50">应发工资</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-purple-600">专项扣除</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-red-600">个人社保</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-orange-600">个人公积金</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap text-amber-600">个税</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap bg-emerald-50">实发工资</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap bg-emerald-50 text-emerald-600">现金补贴</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap bg-emerald-100 text-emerald-800">总收入</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-semibold text-sm sticky-col bg-white">{r.name}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.baseSalary)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.positionAllowance)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.communication)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.transport)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.meal)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.performance)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.attendance)}</TableCell>
                <TableCell className="text-right font-mono text-sm text-red-500">{fmt(r.otherDeduction)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold bg-blue-50/50">{fmt(r.grossSalary)}</TableCell>
                <TableCell className="text-right font-mono text-sm text-purple-600">{fmt(r.specialDeductionTotal)}</TableCell>
                <TableCell className="text-right font-mono text-sm text-red-600">{fmt(r.personalSocialTotal)}</TableCell>
                <TableCell className="text-right font-mono text-sm text-orange-600">{r.personalHousingFund > 0 ? fmt(r.personalHousingFund) : '-'}</TableCell>
                <TableCell className="text-right font-mono text-sm text-amber-600">{fmt(r.tax)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold bg-emerald-50/50">{fmt(r.netSalary)}</TableCell>
                <TableCell className="text-right font-mono text-sm text-emerald-600">{fmt(r.cashSubsidy)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-bold bg-emerald-100/50 text-emerald-800">{fmt(r.totalIncome)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-slate-100 font-bold">
              <TableCell className="text-sm sticky-col bg-slate-100">合计</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('baseSalary'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('positionAllowance'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('communication'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('transport'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('meal'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('performance'))}</TableCell>
              <TableCell className="text-right font-mono text-sm">{fmt(sum('attendance'))}</TableCell>
              <TableCell className="text-right font-mono text-sm text-red-500">{fmt(sum('otherDeduction'))}</TableCell>
              <TableCell className="text-right font-mono text-sm bg-blue-50/50">{fmt(sum('grossSalary'))}</TableCell>
              <TableCell className="text-right font-mono text-sm text-purple-600">{fmt(sum('specialDeductionTotal'))}</TableCell>
              <TableCell className="text-right font-mono text-sm text-red-600">{fmt(sum('personalSocialTotal'))}</TableCell>
              <TableCell className="text-right font-mono text-sm text-orange-600">{fmt(sum('personalHousingFund'))}</TableCell>
              <TableCell className="text-right font-mono text-sm text-amber-600">{fmt(sum('tax'))}</TableCell>
              <TableCell className="text-right font-mono text-sm bg-emerald-50/50">{fmt(sum('netSalary'))}</TableCell>
              <TableCell className="text-right font-mono text-sm text-emerald-600">{fmt(sum('cashSubsidy'))}</TableCell>
              <TableCell className="text-right font-mono text-sm bg-emerald-100/50 text-emerald-800">{fmt(sum('totalIncome'))}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
