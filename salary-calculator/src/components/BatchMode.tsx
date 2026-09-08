import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2, Zap, Plus, Copy } from 'lucide-react'
import { calcEmployee } from '@/calc'
import type { EmployeeResult, BatchRow } from '@/types'
import type { CityConfig } from '@/data/cityData'

interface BatchModeProps {
  city: CityConfig
  rows: BatchRow[]
  onChange: (rows: BatchRow[]) => void
  onAddRows: (count: number) => void
  onReset: () => void
}

export function BatchMode({ city, rows, onChange, onAddRows, onReset }: BatchModeProps) {
  const update = (id: string, patch: Partial<BatchRow>) => {
    onChange(rows.map(r => r.id === id ? { ...r, ...patch } : r))
  }

  const results = useMemo(() => {
    return rows.map(row => {
      const input = {
        name: row.name,
        baseSalary: row.baseSalary,
        performance: row.performance,
        positionAllowance: '',
        communication: '',
        transport: '',
        meal: '',
        attendance: '',
        otherDeduction: '',
        sickLeaveDays: '',
        personalLeaveDays: '',
        sickLeavePayRate: '60',
        workDaysTotal: row.workDays || '21.75',
        skipSocial: !row.social,
        socialBase: '',
        targetNetSalary: '',
        deductionItems: {},
        seriousIllnessAmount: '',
        cashSubsidy: '',
        enableHousingFund: row.housingFund,
        housingFundSameAsSocial: true,
        housingFundBase: '',
        housingFundRate: '12',
      }
      return calcEmployee({ id: row.id, input }, city.id)
    })
  }, [rows, city])

  const totals = results.reduce((acc, r) => ({
    gross: acc.gross + r.grossSalary,
    social: acc.social + r.personalSocialTotal,
    housing: acc.housing + r.personalHousingFund,
    tax: acc.tax + r.tax,
    net: acc.net + r.netSalary,
    cost: acc.cost + r.grossSalary + r.companySocialTotal + r.companyHousingFund,
  }), { gross: 0, social: 0, housing: 0, tax: 0, net: 0, cost: 0 })

  const validCount = rows.filter(r => parseFloat(r.baseSalary) > 0 || parseFloat(r.performance) > 0).length

  const duplicateRow = (id: string) => {
    const idx = rows.findIndex(r => r.id === id)
    if (idx === -1) return
    const src = rows[idx]
    const copy: BatchRow = { ...src, id: 'batch_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7), name: src.name + '_复制' }
    onChange([...rows.slice(0, idx + 1), copy, ...rows.slice(idx + 1)])
  }

  return (
    <Card className="shadow-md border-emerald-200">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-emerald-600" />
          批量计算模式
          <span className="text-sm font-normal text-slate-400 ml-2">{validCount} 人 · {city.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        {/* 批量添加 */}
        <div className="flex items-center gap-2 mb-4">
          <Button size="sm" variant="outline" className="gap-1" onClick={() => onAddRows(1)}>
            <Plus className="w-3.5 h-3.5" /> 添加一行
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => onAddRows(10)}>
            <Plus className="w-3.5 h-3.5" /> 添加10行
          </Button>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => onAddRows(50)}>
            <Plus className="w-3.5 h-3.5" /> 添加50行
          </Button>
          <Button size="sm" variant="ghost" className="gap-1 text-slate-400 hover:text-red-500" onClick={onReset}>
            <Trash2 className="w-3.5 h-3.5" /> 清空
          </Button>
        </div>

        {/* 输入表 */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 w-32">姓名</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 w-28">基本工资</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 w-28">提成绩效</th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-slate-500 w-24">出勤天数</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-slate-500 w-16">社保</th>
                <th className="px-2 py-2 text-center text-xs font-semibold text-slate-500 w-16">公积金</th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-slate-500 w-28">实发工资</th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-slate-500 w-28">企业成本</th>
                <th className="px-2 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const r: EmployeeResult | undefined = results[idx]
                return (
                  <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-2 py-1.5">
                      <Input
                        value={row.name}
                        onChange={(e) => update(row.id, { name: e.target.value })}
                        className="h-7 text-sm px-2"
                        placeholder={`员工${idx + 1}`}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={row.baseSalary}
                        onChange={(e) => update(row.id, { baseSalary: e.target.value })}
                        className="h-7 text-sm px-2 font-mono text-right"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={row.performance}
                        onChange={(e) => update(row.id, { performance: e.target.value })}
                        className="h-7 text-sm px-2 font-mono text-right"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        value={row.workDays}
                        onChange={(e) => update(row.id, { workDays: e.target.value })}
                        className="h-7 text-sm px-2 font-mono text-right"
                        placeholder="21.75"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <Checkbox
                        checked={row.social}
                        onCheckedChange={(v) => update(row.id, { social: !!v })}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <Checkbox
                        checked={row.housingFund}
                        onCheckedChange={(v) => update(row.id, { housingFund: !!v })}
                        className="h-4 w-4"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono font-semibold text-emerald-700">
                      {r ? r.netSalary.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-red-600">
                      {r ? (r.grossSalary + r.companySocialTotal + r.companyHousingFund).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-blue-500" title="复制行" onClick={() => duplicateRow(row.id)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-red-500" title="删除行" onClick={() => onChange(rows.filter(x => x.id !== row.id))}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-sm text-slate-400">
                    还没有数据，点上方"添加10行"快速开始
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                  <td className="px-2 py-2 text-xs text-slate-600">合计 ({validCount}人)</td>
                  <td className="px-2 py-2 text-right font-mono text-sm">{totals.gross.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-2 py-2" colSpan={4}></td>
                  <td className="px-2 py-2 text-right font-mono text-emerald-700">{totals.net.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-2 py-2 text-right font-mono text-red-600">{totals.cost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-2 py-2"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          计算规则：应发 = 基本工资 + 提成绩效，日工资 = 应发 ÷ 出勤天数。社保基数不填按应发工资，公积金按 12%（基数同社保）。
          <Label className="ml-1 text-slate-500">勾选 = 缴纳，取消勾选 = 不缴纳（无此项扣款）</Label>
        </p>
      </CardContent>
    </Card>
  )
}
