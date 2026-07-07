import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calculator, Download, RotateCcw, Plus, Users } from 'lucide-react'
import { genId, getDefaultInput, calcEmployee } from '@/calc'
import { exportExcel } from '@/export'
import { CostOverview } from '@/components/CostOverview'
import { EmployeeCard } from '@/components/EmployeeCard'
import { SalaryTable } from '@/components/SalaryTable'
import { SocialTable } from '@/components/SocialTable'
import { TaxTable } from '@/components/TaxTable'
import type { EmployeeData, EmployeeInput } from '@/types'

export default function App() {
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}年${now.getMonth() + 1}月`
  })
  const [employees, setEmployees] = useState<EmployeeData[]>([
    { id: genId(), input: getDefaultInput() },
  ])

  const results = useMemo(
    () => employees.map(calcEmployee),
    [employees]
  )

  const addEmployee = () => {
    setEmployees(prev => [...prev, { id: genId(), input: getDefaultInput() }])
  }

  const removeEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id))
  }

  const updateInput = (id: string, field: keyof EmployeeInput, value: string) => {
    setEmployees(prev => prev.map(e => {
      if (e.id !== id) return e
      return { ...e, input: { ...e.input, [field]: value } }
    }))
  }

  const toggleDeductionItem = (id: string, itemKey: string) => {
    setEmployees(prev => prev.map(e => {
      if (e.id !== id) return e
      return {
        ...e,
        input: {
          ...e.input,
          deductionItems: {
            ...e.input.deductionItems,
            [itemKey]: !e.input.deductionItems[itemKey],
          },
        },
      }
    }))
  }

  const resetAll = () => {
    setEmployees([{ id: genId(), input: getDefaultInput() }])
  }

  const handleExport = () => {
    exportExcel(results, yearMonth, employees)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-4 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 标题 */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              工资社保个税计算器
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            支持任意人数 · 不含公积金 · 可编辑姓名 · 自由增减员工
          </p>
        </div>

        {/* 年月和按钮 */}
        <Card className="shadow-md border-blue-100">
          <CardContent className="pt-6 pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-semibold text-slate-700 whitespace-nowrap">工资月份</Label>
                <Input value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} className="w-40 font-mono" />
              </div>
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users className="w-4 h-4" />
                  <span>{employees.length} 人</span>
                </div>
                <Button variant="outline" onClick={resetAll} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  重置
                </Button>
                <Button onClick={handleExport} className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Download className="w-4 h-4" />
                  导出工资表
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 企业用工成本概览 */}
        {employees.length > 0 && (
          <CostOverview results={results} employeeCount={employees.length} />
        )}

        {/* 员工录入卡片 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {employees.map((emp, idx) => (
            <EmployeeCard
              key={emp.id}
              input={emp.input}
              result={results[idx]}
              onUpdate={(field, value) => updateInput(emp.id, field, value)}
              onToggleDeduction={(itemKey) => toggleDeductionItem(emp.id, itemKey)}
              onRemove={() => removeEmployee(emp.id)}
            />
          ))}
        </div>

        {/* 添加员工按钮 */}
        <div className="flex justify-center">
          <Button onClick={addEmployee} variant="outline" className="gap-2 px-8 py-6 text-base border-dashed border-2 hover:border-blue-400 hover:bg-blue-50">
            <Plus className="w-5 h-5" />
            添加员工
          </Button>
        </div>

        {/* 工资明细表格 */}
        {employees.length > 0 && (
          <SalaryTable results={results} />
        )}

        {/* 社保明细表格 */}
        {employees.length > 0 && (
          <SocialTable results={results} employees={employees} />
        )}

        {/* 个税计算明细 */}
        {employees.length > 0 && (
          <TaxTable results={results} />
        )}

        {/* 底部说明 */}
        <div className="text-center text-xs text-slate-400 pb-4 space-y-1">
          <p>费率标准：养老企业16%个人8% | 医疗含生育企业9.5%个人2% | 失业企业0.5%个人0.5% | 工伤企业0.2%</p>
          <p>个税起征点5,000元/月 | 不含公积金 | 现金补贴不计入社保和个税 | 本工具仅供参考，以社保局和税务局实际核算为准</p>
        </div>
      </div>
    </div>
  )
}
