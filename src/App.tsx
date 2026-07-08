import { useState, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calculator, Download, RotateCcw, Plus, Users, Lock, Sparkles, Crown } from 'lucide-react'
import { genId, getDefaultInput, calcEmployee } from '@/calc'
import { exportExcel } from '@/export'
import { CostOverview } from '@/components/CostOverview'
import { EmployeeCard } from '@/components/EmployeeCard'
import { SalaryTable } from '@/components/SalaryTable'
import { SocialTable } from '@/components/SocialTable'
import { TaxTable } from '@/components/TaxTable'
import { PaywallModal } from '@/components/PaywallModal'
import { PricingCard } from '@/components/PricingCard'
import { canAddEmployee, canExport, canUseHousingFund, getCurrentTier, getLimits, deactivateLicense } from '@/license'
import type { EmployeeData, EmployeeInput } from '@/types'

export default function App() {
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}年${now.getMonth() + 1}月`
  })
  const [employees, setEmployees] = useState<EmployeeData[]>([
    { id: genId(), input: getDefaultInput() },
  ])
  const [tier, setTier] = useState(getCurrentTier())
  const [paywallFeature, setPaywallFeature] = useState<'addEmployee' | 'export' | 'housingFund' | null>(null)

  // 强制刷新 tier（激活后调用）
  const refreshTier = useCallback(() => setTier(getCurrentTier()), [])

  const results = useMemo(
    () => employees.map(calcEmployee),
    [employees]
  )

  const limits = getLimits()

  const addEmployee = () => {
    if (!canAddEmployee(employees.length)) {
      setPaywallFeature('addEmployee')
      return
    }
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

  const updateHousingFund = (id: string, field: 'enableHousingFund' | 'housingFundSameAsSocial' | 'housingFundBase' | 'housingFundRate', value: string) => {
    // 免费版不允许使用公积金
    if (field === 'enableHousingFund' && value === 'true' && !canUseHousingFund()) {
      setPaywallFeature('housingFund')
      return
    }
    setEmployees(prev => prev.map(e => {
      if (e.id !== id) return e
      const newInput = { ...e.input, [field]: field === 'enableHousingFund' || field === 'housingFundSameAsSocial' ? value === 'true' : value }
      if (field === 'housingFundSameAsSocial' && value === 'true') {
        newInput.housingFundBase = ''
      }
      return { ...e, input: newInput }
    }))
  }

  const resetAll = () => {
    setEmployees([{ id: genId(), input: getDefaultInput() }])
  }

  const handleExport = () => {
    if (!canExport()) {
      setPaywallFeature('export')
      return
    }
    exportExcel(results, yearMonth, employees)
  }

  const handleUpgradeClick = (feature: 'addEmployee' | 'export' | 'housingFund') => {
    setPaywallFeature(feature)
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
            {/* 套餐徽章 */}
            {tier === 'free' && (
              <Badge variant="outline" className="text-xs border-slate-300 text-slate-500">免费版</Badge>
            )}
            {tier === 'basic' && (
              <Badge className="text-xs bg-blue-600 text-white">
                <Sparkles className="w-3 h-3 mr-1" />基础版
              </Badge>
            )}
            {tier === 'pro' && (
              <Badge className="text-xs bg-purple-600 text-white">
                <Crown className="w-3 h-3 mr-1" />专业版
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {tier === 'free'
              ? `免费版最多${limits.maxEmployees}人 · 升级解锁导出和公积金`
              : tier === 'basic'
              ? '基础版 ≤10人 · 导出Excel · 公积金计算'
              : '专业版 · 不限人数 · 全功能'
            }
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
                  <span>{employees.length} 人{tier === 'free' ? ` / 最多${limits.maxEmployees}人` : ''}</span>
                </div>
                <Button variant="outline" onClick={resetAll} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  重置
                </Button>
                <Button
                  onClick={handleExport}
                  className={`gap-2 ${canExport() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-400 hover:bg-slate-500'}`}
                >
                  {canExport() ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  {canExport() ? '导出工资表' : '导出（需升级）'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 定价卡片（免费版时显示） */}
        {tier === 'free' && (
          <PricingCard onUpgradeClick={handleUpgradeClick} />
        )}

        {/* 已激活时显示管理信息 */}
        {tier !== 'free' && (
          <div className="text-center text-xs text-slate-400">
            <button
              onClick={() => { deactivateLicense(); refreshTier() }}
              className="hover:text-red-400 underline"
            >
              退回免费版
            </button>
          </div>
        )}

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
              onUpdateHousingFund={(field, value) => updateHousingFund(emp.id, field, value)}
              onToggleDeduction={(itemKey) => toggleDeductionItem(emp.id, itemKey)}
              onRemove={() => removeEmployee(emp.id)}
              canUseHousingFund={canUseHousingFund()}
              onPaywallRequest={() => setPaywallFeature('housingFund')}
            />
          ))}
        </div>

        {/* 添加员工按钮 */}
        <div className="flex justify-center">
          <Button
            onClick={addEmployee}
            variant="outline"
            className={`gap-2 px-8 py-6 text-base ${canAddEmployee(employees.length) ? 'border-dashed border-2 hover:border-blue-400 hover:bg-blue-50' : 'border-slate-300 text-slate-400 cursor-not-allowed'}`}
          >
            {canAddEmployee(employees.length) ? <Plus className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            {canAddEmployee(employees.length) ? '添加员工' : `已达${limits.maxEmployees}人上限，升级解锁`}
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
          <p>费率标准：养老企业16%个人8% | 医疗含生育企业9.5%个人2% | 失业企业0.5%个人0.5% | 工伤企业0.2% | 公积金可选5%-12%</p>
          <p>个税起征点5,000元/月 | 公积金个人部分可抵扣个税 | 现金补贴不计入社保和个税 | 本工具仅供参考，以社保局和税务局实际核算为准</p>
        </div>
      </div>

      {/* 付费引导弹窗 */}
      {paywallFeature && (
        <PaywallModal
          feature={paywallFeature}
          onClose={() => setPaywallFeature(null)}
          onActivated={() => { refreshTier(); setPaywallFeature(null) }}
        />
      )}
    </div>
  )
}
