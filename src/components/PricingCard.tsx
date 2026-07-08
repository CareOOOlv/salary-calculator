import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Unlock, Sparkles, Crown, Check } from 'lucide-react'
import { getCurrentTier, type PlanTier } from '@/license'

interface PricingCardProps {
  onUpgradeClick: (feature: 'addEmployee' | 'export' | 'housingFund') => void
}

const TIER_LABELS: Record<PlanTier, { label: string; icon: React.ReactNode; color: string }> = {
  free: { label: '免费版', icon: <Lock className="w-4 h-4" />, color: 'text-slate-500' },
  basic: { label: '基础版', icon: <Sparkles className="w-4 h-4 text-blue-600" />, color: 'text-blue-600' },
  pro: { label: '专业版', icon: <Crown className="w-4 h-4 text-purple-600" />, color: 'text-purple-600' },
}

const FEATURES = [
  { key: 'employees3', label: '最多3人', free: true, basic: true, pro: true },
  { key: 'employees10', label: '最多10人', free: false, basic: true, pro: true },
  { key: 'employeesUnlimited', label: '不限人数', free: false, basic: false, pro: true },
  { key: 'viewOnline', label: '在线查看计算', free: true, basic: true, pro: true },
  { key: 'exportExcel', label: '导出Excel工资表', free: false, basic: true, pro: true },
  { key: 'housingFund', label: '公积金计算', free: false, basic: true, pro: true },
  { key: 'batchImport', label: '批量导入（即将上线）', free: false, basic: false, pro: true },
]

export function PricingCard({ onUpgradeClick }: PricingCardProps) {
  const currentTier = getCurrentTier()
  const current = TIER_LABELS[currentTier]

  return (
    <Card className="shadow-md border-blue-100">
      <CardContent className="p-5 space-y-4">
        {/* 当前套餐 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {current.icon}
            <span className={`font-semibold ${current.color}`}>当前：{current.label}</span>
          </div>
          {currentTier !== 'free' && (
            <Badge className="bg-emerald-600 text-white text-xs">已激活 ✓</Badge>
          )}
        </div>

        {/* 功能对比 */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="font-semibold text-slate-500">免费版</div>
          <div className="font-semibold text-blue-600">基础版 ¥9.9</div>
          <div className="font-semibold text-purple-600">专业版 ¥29.9/年</div>
        </div>

        <div className="space-y-1.5">
          {FEATURES.map(f => (
            <div key={f.key} className="grid grid-cols-3 gap-2 text-center text-xs py-1 border-b border-slate-100 last:border-0">
              <span className="text-slate-500 text-left pl-1">{f.label}</span>
              <span>{f.free ? <Check className="w-3 h-3 text-emerald-500 mx-auto" /> : <Lock className="w-3 h-3 text-slate-300 mx-auto" />}</span>
              <span>{f.basic ? <Check className="w-3 h-3 text-emerald-500 mx-auto" /> : <Lock className="w-3 h-3 text-slate-300 mx-auto" />}</span>
              <span className="hidden">{f.pro ? '✓' : '🔒'}</span>
            </div>
          ))}
        </div>

        {/* 升级按钮 */}
        {currentTier === 'free' && (
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => onUpgradeClick('export')}
              className="bg-blue-600 hover:bg-blue-700 gap-1"
            >
              <Sparkles className="w-4 h-4" />
              升级基础版 ¥9.9
            </Button>
          </div>
        )}

        {/* 激活密钥入口 */}
        {currentTier === 'free' && (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Unlock className="w-3 h-3" />
            <span>已有密钥？点击升级后输入激活码</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
