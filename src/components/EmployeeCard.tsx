import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { User, Banknote, Gift, Home, X } from 'lucide-react'
import { fmt } from '@/calc'
import { DEDUCTION_ITEMS, INCOME_FIELDS, HOUSING_FUND_RATE_OPTIONS } from '@/constants'
import type { EmployeeInput, EmployeeResult } from '@/types'

import { Lock } from 'lucide-react'

interface EmployeeCardProps {
  input: EmployeeInput
  result: EmployeeResult
  onUpdate: (field: keyof EmployeeInput, value: string) => void
  onUpdateHousingFund: (field: 'enableHousingFund' | 'housingFundSameAsSocial' | 'housingFundBase' | 'housingFundRate', value: string) => void
  onToggleDeduction: (itemKey: string) => void
  onRemove: () => void
  canUseHousingFund: boolean
  onPaywallRequest: () => void
}

export function EmployeeCard({ input, result, onUpdate, onUpdateHousingFund, onToggleDeduction, onRemove, canUseHousingFund, onPaywallRequest }: EmployeeCardProps) {
  return (
    <Card className="shadow-md border-slate-200">
      <CardHeader className="pb-3 pt-4 px-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <Input
              value={input.name}
              onChange={(e) => onUpdate('name', e.target.value)}
              className="h-7 text-sm font-semibold border-0 border-b border-transparent hover:border-slate-200 focus:border-blue-300 px-1 bg-transparent w-full"
              placeholder="输入姓名"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 ml-2"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-3">
        {/* 收入项 */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">收入项目</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INCOME_FIELDS.map(([key, label]) => (
              <div key={key}>
                <Label className="text-xs text-slate-500">{label}</Label>
                <Input
                  type="number"
                  value={input[key] as string}
                  onChange={(e) => onUpdate(key, e.target.value)}
                  className="h-8 text-sm font-mono"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* 现金补贴 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600" />
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">现金补贴（不计入社保/个税）</Label>
          </div>
          <Input
            type="number"
            value={input.cashSubsidy}
            onChange={(e) => onUpdate('cashSubsidy', e.target.value)}
            className="h-8 text-sm font-mono"
            placeholder="0"
          />
          <p className="text-xs text-slate-400">通过其他方式发放给员工，不计入社保基数和个税计算</p>
        </div>

        <Separator />

        {/* 社保基数 */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">社保缴纳基数</Label>
          <Input
            type="number"
            value={input.socialBase}
            onChange={(e) => onUpdate('socialBase', e.target.value)}
            className="h-8 text-sm font-mono"
            placeholder="0"
          />
        </div>

        <Separator />

        {/* 公积金 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-orange-600" />
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">住房公积金</Label>
            {canUseHousingFund ? (
              <Checkbox
                checked={!!input.enableHousingFund}
                onCheckedChange={(checked) => onUpdateHousingFund('enableHousingFund', checked ? 'true' : '')}
                className="h-4 w-4"
              />
            ) : (
              <button
                onClick={onPaywallRequest}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-500 cursor-pointer ml-1"
              >
                <Lock className="w-3 h-3" />
                <span className="underline">升级解锁</span>
              </button>
            )}
          </div>
          {canUseHousingFund && input.enableHousingFund && (
            <div className="space-y-2 pl-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={!!input.housingFundSameAsSocial}
                  onCheckedChange={(checked) => onUpdateHousingFund('housingFundSameAsSocial', checked ? 'true' : '')}
                  className="h-4 w-4"
                />
                <Label className="text-xs text-slate-600 cursor-pointer">基数同社保基数</Label>
              </div>
              {!input.housingFundSameAsSocial && (
                <div>
                  <Label className="text-xs text-slate-500">公积金基数</Label>
                  <Input
                    type="number"
                    value={input.housingFundBase}
                    onChange={(e) => onUpdateHousingFund('housingFundBase', e.target.value)}
                    className="h-8 text-sm font-mono mt-1"
                    placeholder="0"
                  />
                </div>
              )}
              <div>
                <Label className="text-xs text-slate-500">公积金比例（企业+个人同比例）</Label>
                <select
                  value={input.housingFundRate}
                  onChange={(e) => onUpdateHousingFund('housingFundRate', e.target.value)}
                  className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-mono focus:border-blue-300 focus:outline-none"
                >
                  {HOUSING_FUND_RATE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
          {!canUseHousingFund && (
            <p className="text-xs text-slate-400 pl-1">公积金计算为基础版功能，升级后可勾选启用</p>
          )}
        </div>

        <Separator />

        {/* 专项附加扣除 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-600" />
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">专项附加扣除</Label>
            {result.specialDeductionTotal > 0 && (
              <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                合计 {fmt(result.specialDeductionTotal)} 元/月
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
            {DEDUCTION_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center gap-2">
                <Checkbox
                  id={`${result.id}-${item.key}`}
                  checked={!!input.deductionItems[item.key]}
                  onCheckedChange={() => onToggleDeduction(item.key)}
                  className="h-4 w-4"
                />
                <Label htmlFor={`${result.id}-${item.key}`} className="text-xs text-slate-600 cursor-pointer leading-tight">
                  {item.label}
                  <span className="text-slate-400 ml-1">
                    {item.key === 'seriousIllness' ? '' : `${item.amount}${item.unit}`}
                  </span>
                </Label>
              </div>
            ))}
          </div>
          {input.deductionItems['seriousIllness'] && (
            <div className="pt-1">
              <Label className="text-xs text-slate-500">大病医疗扣除金额（元）</Label>
              <Input
                type="number"
                value={input.seriousIllnessAmount}
                onChange={(e) => onUpdate('seriousIllnessAmount', e.target.value)}
                className="h-8 text-sm font-mono mt-1"
                placeholder="据实填写"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* 汇总结果 */}
        <div className="space-y-1 bg-slate-50 rounded-lg p-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">应发工资</span>
            <span className="font-mono font-semibold">{fmt(result.grossSalary)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">个人社保</span>
            <span className="font-mono text-red-600">-{fmt(result.personalSocialTotal)}</span>
          </div>
          {result.personalHousingFund > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">个人公积金</span>
              <span className="font-mono text-orange-600">-{fmt(result.personalHousingFund)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">个人所得税</span>
            <span className="font-mono text-amber-600">-{fmt(result.tax)}</span>
          </div>
          {result.specialDeductionTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 text-purple-600">专项附加扣除</span>
              <span className="font-mono text-purple-600">-{fmt(result.specialDeductionTotal)}</span>
            </div>
          )}
          <Separator className="my-1" />
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-emerald-700">实发工资</span>
            <span className="font-mono text-emerald-700">{fmt(result.netSalary)}</span>
          </div>
          {result.cashSubsidy > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">现金补贴</span>
                <span className="font-mono text-emerald-500">+{fmt(result.cashSubsidy)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span className="text-emerald-800">员工总收入</span>
                <span className="font-mono text-emerald-800">{fmt(result.totalIncome)}</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
