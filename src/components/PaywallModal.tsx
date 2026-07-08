import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Lock, Unlock, Sparkles, Crown, X } from 'lucide-react'
import { PRICING, activateLicense } from '@/license'

interface PaywallModalProps {
  feature: 'addEmployee' | 'export' | 'housingFund'
  onClose: () => void
  onActivated: () => void
}

const FEATURE_MESSAGES = {
  addEmployee: {
    title: '免费版最多 3 人',
    desc: '升级基础版可计算至 10 人，专业版不限人数',
  },
  export: {
    title: '导出 Excel 需升级',
    desc: '免费版仅可在线查看计算结果，升级后可导出完整工资表',
  },
  housingFund: {
    title: '公积金计算需升级',
    desc: '免费版不含公积金，升级后可勾选公积金并选择基数和比例',
  },
}

export function PaywallModal({ feature, onClose, onActivated }: PaywallModalProps) {
  const [licenseKey, setLicenseKey] = useState('')
  const [error, setError] = useState('')

  const msg = FEATURE_MESSAGES[feature]

  const handleActivate = () => {
    if (!licenseKey.trim()) {
      setError('请输入激活密钥')
      return
    }
    const result = activateLicense(licenseKey.trim())
    if (result) {
      onActivated()
      setError('')
    } else {
      setError('密钥无效，请检查后重试')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-blue-200 bg-white">
        <CardContent className="p-6 space-y-5">
          {/* 关闭按钮 */}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* 提示信息 */}
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">{msg.title}</h3>
            <p className="text-sm text-slate-500">{msg.desc}</p>
          </div>

          <Separator />

          {/* 定价卡片 */}
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-800">{PRICING.basic.label}</span>
                <Badge className="bg-blue-600 text-white text-xs">推荐</Badge>
              </div>
              <p className="text-xs text-slate-500 mb-2">{PRICING.basic.description}</p>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-blue-700">¥9.9 <span className="text-xs text-slate-400 font-normal">买断</span></span>
                <span className="text-xs text-slate-400">或 ¥{PRICING.basic.monthly}/月</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-purple-600" />
                <span className="font-semibold text-purple-800">{PRICING.pro.label}</span>
                <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">即将上线</Badge>
              </div>
              <p className="text-xs text-slate-500 mb-2">{PRICING.pro.description}</p>
              <span className="text-lg font-bold text-purple-700">¥{PRICING.pro.yearly}/年</span>
            </div>
          </div>

          <Separator />

          {/* 激活密钥输入 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Unlock className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-700">已有密钥？直接激活</span>
            </div>
            <div className="flex gap-2">
              <Input
                value={licenseKey}
                onChange={(e) => { setLicenseKey(e.target.value); setError('') }}
                placeholder="输入激活密钥"
                className="font-mono text-sm"
              />
              <Button onClick={handleActivate} className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                激活
              </Button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          {/* 购买引导 */}
          <div className="text-center text-xs text-slate-400 space-y-1">
            <p>购买密钥：微信/支付宝转账 ¥9.9 → 获取激活码 → 输入上方</p>
            <p>联系作者获取密钥：请在 GitHub 项目页留言</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
