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
import { TAX_THRESHOLD } from '@/constants'
import type { EmployeeResult } from '@/types'

interface TaxTableProps {
  results: EmployeeResult[]
}

export function TaxTable({ results }: TaxTableProps) {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Receipt className="w-5 h-5 text-amber-600" />
          个税计算明细
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
        <Table className="responsive-table min-w-[600px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="text-xs font-semibold whitespace-nowrap sticky-col-header bg-slate-50">姓名</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">应发工资</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">减：起征点</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">减：个人社保</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">减：个人公积金</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">减：专项扣除</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap bg-amber-50">应纳税所得额</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">税率</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap">速算扣除</TableHead>
              <TableHead className="text-xs font-semibold text-right whitespace-nowrap bg-amber-50">应纳税额</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-semibold text-sm sticky-col bg-white">{r.name}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.grossSalary)}</TableCell>
                <TableCell className="text-right font-mono text-sm text-slate-400">- {fmt(TAX_THRESHOLD)}</TableCell>
                <TableCell className="text-right font-mono text-sm text-slate-400">- {fmt(r.personalSocialTotal)}</TableCell>
                <TableCell className="text-right font-mono text-sm text-orange-500">{r.personalHousingFund > 0 ? `- ${fmt(r.personalHousingFund)}` : '-'}</TableCell>
                <TableCell className="text-right font-mono text-sm text-purple-500">- {fmt(r.specialDeductionTotal)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold bg-amber-50/50">{fmt(r.taxableIncome)}</TableCell>
                <TableCell className="text-right font-mono text-sm">{(r.taxRate * 100).toFixed(0)}%</TableCell>
                <TableCell className="text-right font-mono text-sm">{fmt(r.quickDeduction)}</TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold bg-amber-50/50">{fmt(r.tax)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
