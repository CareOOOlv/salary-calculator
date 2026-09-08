import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { User, Banknote, Gift, Home, X, Copy } from 'lucide-react'
import { fmt } from '@/calc'
import { DEDUCTION_ITEMS, INCOME_FIELDS } from '@/constants'
import type { EmployeeInput, EmployeeResult } from '@/types'
import type { CityConfig } from '@/data/cityData'


interface EmployeeCardProps {
  input: EmployeeInput
  result: EmployeeResult
  city: CityConfig
  reverseMode: boolean
  onUpdate: (field: keyof EmployeeInput, value: string) => void
  onUpdateHousingFund: (field: 'enableHousingFund' | 'housingFundSameAsSocial' | 'housingFundBase' | 'housingFundRate', value: string) => void
  onToggleDeduction: (itemKey: string) => void
  onRemove: () => void
  onDuplicate: () => void
  housingFundRateOptions: { value: string; label: string }[]
}

export function EmployeeCard({ input, result, city, reverseMode, onUpdate, onUpdateHousingFund, onToggleDeduction, onRemove, onDuplicate, housingFundRateOptions }: EmployeeCardProps) {
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
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="h-7 w-7 p-0 text-slate-400 hover:text-blue-500 hover:bg-blue-50"
              title="复制此员工"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-3">
        {/* 收入项 */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {reverseMode ? '目标到手工资（税后）' : '收入项目'}
          </Label>
          {reverseMode ? (
            <div>
              <Input
                type="number"
                value={input.targetNetSalary}
                onChange={(e) => onUpdate('targetNetSalary', e.target.value)}
                className="h-10 text-base font-mono font-bold"
                placeholder="填写期望税后到手金额"
              />
              <p className="text-xs text-slate-400 mt-1">填写期望税后到手金额，系统自动倒推应发工资</p>
              {result.isReversed && result.grossSalary > 0 && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/10 rounded-md text-xs space-y-0.5">
                  <div className="flex justify-between">
                    <span>倒推应发工资</span>
                    <span className="font-mono font-bold text-blue-700">{fmt(result.grossSalary)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>社保基数</span>
                    <span className="font-mono">{fmt(parseFloat(input.socialBase) || result.grossSalary)}</span>
                  </div>
                  {input.enableHousingFund && (
                    <div className="flex justify-between text-slate-500">
                      <span>公积金基数</span>
                      <span className="font-mono">{fmt(parseFloat(input.housingFundBase) || parseFloat(input.socialBase) || result.grossSalary)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
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
          )}
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

        {/* 考勤扣款 */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">考勤情况</Label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs text-slate-500">月应出勤天数</Label>
              <Input
                type="number"
                value={input.workDaysTotal}
                onChange={(e) => onUpdate('workDaysTotal', e.target.value)}
                className="h-8 text-sm font-mono"
                placeholder="21.75"
              />
              <p className="text-xs text-slate-400 mt-0.5">不填默认 21.75</p>
            </div>
            <div>
              <Label className="text-xs text-slate-500">病假天数</Label>
              <Input
                type="number"
                value={input.sickLeaveDays}
                onChange={(e) => onUpdate('sickLeaveDays', e.target.value)}
                className="h-8 text-sm font-mono"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">事假天数</Label>
              <Input
                type="number"
                value={input.personalLeaveDays}
                onChange={(e) => onUpdate('personalLeaveDays', e.target.value)}
                className="h-8 text-sm font-mono"
                placeholder="0"
              />
            </div>
          </div>

          {/* 出勤汇总卡片 */}
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md text-xs">
            <div className="flex justify-between gap-2">
              <span className="text-slate-500">应出勤</span>
              <span className="font-mono font-semibold">{result.workDaysTotal.toFixed(1)} 天</span>
            </div>
            {result.sickLeaveDeduction > 0 || parseFloat(input.sickLeaveDays || '0') > 0 ? (
              <div className="flex justify-between gap-2 text-amber-700">
                <span>病假（{input.sickLeavePayRate || 60}% 付薪）</span>
                <span className="font-mono">{parseFloat(input.sickLeaveDays || '0').toFixed(1)} 天</span>
              </div>
            ) : null}
            {result.personalLeaveDeduction > 0 || parseFloat(input.personalLeaveDays || '0') > 0 ? (
              <div className="flex justify-between gap-2 text-red-600">
                <span>事假（无薪）</span>
                <span className="font-mono">{parseFloat(input.personalLeaveDays || '0').toFixed(1)} 天</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-2 border-t border-slate-200 dark:border-slate-700 pt-1 mt-1 font-semibold text-emerald-700">
              <span>实际出勤</span>
              <span className="font-mono">{Math.max(0, result.actualWorkDays).toFixed(1)} 天</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-slate-500 whitespace-nowrap">病假付薪比例</Label>
            <select
              value={input.sickLeavePayRate || '60'}
              onChange={(e) => onUpdate('sickLeavePayRate', e.target.value)}
              className="h-7 rounded border border-slate-200 bg-white px-1.5 text-xs font-mono"
            >
              <option value="100">100%（全额）</option>
              <option value="90">90%</option>
              <option value="80">80%</option>
              <option value="70">70%</option>
              <option value="60">60%（法定最低）</option>
              <option value="50">50%</option>
            </select>
          </div>

          <p className="text-xs text-slate-400">
            日工资 = 应发工资 ÷ 月应出勤天数 · 实际出勤 = 应出勤 - 病假 - 事假
          </p>

          {(result.sickLeaveDeduction > 0 || result.personalLeaveDeduction > 0) && (
            <div className="p-2 bg-amber-50 dark:bg-amber-950/10 rounded-md text-xs space-y-0.5">
              <div className="flex justify-between">
                <span>月应出勤 {result.workDaysTotal.toFixed(1)} 天 · 实际出勤 {Math.max(0, result.actualWorkDays).toFixed(1)} 天</span>
                <span className="font-mono">{fmt(result.grossSalary)}</span>
              </div>
              {result.sickLeaveDeduction > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>病假扣款（{input.sickLeaveDays}天，{input.sickLeavePayRate || 60}%付）</span>
                  <span className="font-mono">-{fmt(result.sickLeaveDeduction)}</span>
                </div>
              )}
              {result.personalLeaveDeduction > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>事假扣款（{input.personalLeaveDays}天）</span>
                  <span className="font-mono">-{fmt(result.personalLeaveDeduction)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t border-amber-200 dark:border-amber-800/30 pt-1 mt-0.5">
                <span>扣款后应发工资</span>
                <span className="font-mono">{fmt(result.grossSalary - result.leaveTotalDeduction)}</span>
              </div>
            </div>
          )}
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
          <p className="text-xs text-slate-400">基数范围: {city.socialBaseMin.toLocaleString()} - {city.socialBaseMax.toLocaleString()} · 不填则默认等于应发工资</p>
        </div>

        <Separator />

        {/* 公积金 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4 text-orange-600" />
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">住房公积金</Label>
            <Checkbox
              checked={!!input.enableHousingFund}
              onCheckedChange={(checked) => onUpdateHousingFund('enableHousingFund', checked ? 'true' : '')}
              className="h-4 w-4"
            />
          </div>
          {input.enableHousingFund && (
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
                  <p className="text-xs text-slate-400 mt-1">基数范围: {city.housingFundBaseMin.toLocaleString()} - {city.housingFundBaseMax.toLocaleString()}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-slate-500">公积金比例（企业+个人同比例）</Label>
                <select
                  value={input.housingFundRate}
                  onChange={(e) => onUpdateHousingFund('housingFundRate', e.target.value)}
                  className="mt-1 h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-sm font-mono focus:border-blue-300 focus:outline-none"
                >
                  {housingFundRateOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
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
