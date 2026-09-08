import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  UserCog, Plus, History, TrendingUp, ShieldCheck, CalendarPlus,
  Wallet, Home, Clock, ChevronRight, X,
} from 'lucide-react'
import { STAFF, genChangeId } from '@/staff'
import type { StaffProfile, PersonnelChange, ChangeType } from '@/staff'

interface PersonnelProps {
  profiles: Record<string, StaffProfile>
  changes: PersonnelChange[]
  onProfileChange: (profile: StaffProfile) => void
  onAddChange: (change: PersonnelChange) => void
}

const changeLabels: Record<ChangeType, string> = {
  hire: '入职时间',
  salary: '调薪',
  social_base: '社保基数',
  housing_fund_base: '公积金基数',
  housing_fund_rate: '公积金比例',
  other: '其他',
}

const changeColors: Record<ChangeType, { dot: string; text: string; bg: string; border: string }> = {
  hire:         { dot: 'bg-emerald-400',  text: 'text-emerald-300',  bg: 'bg-emerald-400/5',  border: 'border-emerald-400/20' },
  salary:       { dot: 'bg-amber-400',    text: 'text-amber-300',    bg: 'bg-amber-400/5',    border: 'border-amber-400/20' },
  social_base:  { dot: 'bg-cyan-400',     text: 'text-cyan-300',     bg: 'bg-cyan-400/5',     border: 'border-cyan-400/20' },
  housing_fund_base:  { dot: 'bg-orange-400',  text: 'text-orange-300',  bg: 'bg-orange-400/5',  border: 'border-orange-400/20' },
  housing_fund_rate: { dot: 'bg-purple-400',  text: 'text-purple-300',  bg: 'bg-purple-400/5',  border: 'border-purple-400/20' },
  other:        { dot: 'bg-white/40',     text: 'text-white/60',     bg: 'bg-white/5',        border: 'border-white/10' },
}

const placeholders: Record<ChangeType, string> = {
  hire: '格式 2026-08 或 2026-08-15',
  salary: '如 18000',
  social_base: '如 18000',
  housing_fund_base: '如 18000',
  housing_fund_rate: '比例如 12',
  other: '',
}

function calcTenure(hireDate: string): string {
  const [yy, mm] = hireDate.split('-').map(Number)
  const now = new Date()
  const months = (now.getFullYear() - yy) * 12 + (now.getMonth() + 1 - mm)
  if (months < 0) return '未入职'
  if (months === 0) return '本月入职'
  if (months < 12) return `${months} 个月`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem ? `${years} 年 ${rem} 月` : `${years} 年`
}

export function Personnel({ profiles, changes, onProfileChange, onAddChange }: PersonnelProps) {
  const [selected, setSelected] = useState(STAFF[0]?.id ?? '')
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<ChangeType>('salary')
  const [effectiveMonth, setEffectiveMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [newValue, setNewValue] = useState('')
  const [reason, setReason] = useState('')

  const staff = STAFF.find(s => s.id === selected)
  const profile = profiles[selected]
  const staffChanges = changes
    .filter(c => c.staffId === selected)
    .sort((a, b) => b.effectiveMonth.localeCompare(a.effectiveMonth))

  const totalChanges = changes.length

  const submitChange = () => {
    if (!staff || !newValue || !reason.trim()) return
    let field = ''
    if (formType === 'salary') field = 'baseSalary'
    else if (formType === 'social_base') field = 'socialBase'
    else if (formType === 'housing_fund_base') field = 'housingFundBase'
    else if (formType === 'housing_fund_rate') field = 'housingFundRate'
    else if (formType === 'hire') field = 'hireDate'

    const oldValue = formType === 'salary' ? profile?.baseSalary ?? ''
      : formType === 'social_base' ? profile?.socialBase ?? ''
      : formType === 'housing_fund_base' ? profile?.housingFundBase ?? ''
      : formType === 'housing_fund_rate' ? profile?.housingFundRate ?? ''
      : profile?.hireDate ?? ''

    if (profile) {
      const updated = { ...profile, [field]: newValue }
      if (formType === 'hire') {
        const [ym, d] = newValue.split('-')
        updated.hireDate = ym
        updated.hireDay = d ? Number(d) : undefined
      }
      onProfileChange(updated)
    }

    onAddChange({
      id: genChangeId(),
      staffId: selected,
      type: formType,
      effectiveMonth,
      field,
      oldValue,
      newValue,
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    })

    setShowForm(false)
    setNewValue('')
    setReason('')
  }

  const openForm = (type: ChangeType) => {
    setFormType(type)
    setShowForm(true)
  }

  const actionButtons: { type: ChangeType; icon: typeof TrendingUp; label: string; color: string }[] = [
    { type: 'salary',            icon: TrendingUp,  label: '调薪',      color: 'amber' },
    { type: 'social_base',       icon: ShieldCheck, label: '社保基数',   color: 'cyan' },
    { type: 'housing_fund_base', icon: Home,        label: '公积金基数', color: 'orange' },
    { type: 'housing_fund_rate', icon: Wallet,      label: '公积金比例', color: 'purple' },
    { type: 'hire',              icon: CalendarPlus,label: '入职时间',   color: 'emerald' },
  ]

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    amber:   { bg: 'bg-amber-400/10',   text: 'text-amber-300',   border: 'border-amber-400/20' },
    cyan:    { bg: 'bg-cyan-400/10',    text: 'text-cyan-300',    border: 'border-cyan-400/20' },
    orange:  { bg: 'bg-orange-400/10',  text: 'text-orange-300',  border: 'border-orange-400/20' },
    purple:  { bg: 'bg-purple-400/10',  text: 'text-purple-300',  border: 'border-purple-400/20' },
    emerald: { bg: 'bg-emerald-400/10', text: 'text-emerald-300', border: 'border-emerald-400/20' },
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        <span className="flex items-center gap-1.5">
          <UserCog className="w-3.5 h-3.5 text-cyan-400/60" />
          {STAFF.length} 名员工
        </span>
        <span className="text-white/10">·</span>
        <span className="flex items-center gap-1.5">
          <History className="w-3.5 h-3.5 text-white/40" />
          {totalChanges} 条变动记录
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ─── Left: Employee list ─── */}
        <div className="lg:col-span-1 space-y-2">
          <div className="text-xs font-medium text-white/40 tracking-wider uppercase mb-1 px-1">员工列表</div>
          {STAFF.map(s => {
            const p = profiles[s.id]
            const isSelected = selected === s.id
            const tenure = p ? calcTenure(p.hireDate) : ''
            const changeCount = changes.filter(c => c.staffId === s.id).length
            return (
              <button
                key={s.id}
                onClick={() => { setSelected(s.id); setShowForm(false) }}
                className={`w-full text-left rounded-xl p-3.5 border transition-all duration-200 ${
                  isSelected
                    ? 'bg-cyan-400/8 border-cyan-400/30 shadow-[0_0_20px_rgba(34,211,238,0.08)]'
                    : 'bg-white/3 border-white/8 hover:border-white/15 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Avatar circle */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isSelected ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/8 text-white/50'
                    }`}>
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-white/70'}`}>
                        {s.name}
                      </div>
                      <div className="text-[11px] text-white/30 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {tenure}
                      </div>
                    </div>
                  </div>
                  {changeCount > 0 && (
                    <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded-full border border-white/8">
                      {changeCount}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* ─── Right: Profile detail ─── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profile hero */}
          <div className="rounded-xl border border-white/10 bg-white/4 backdrop-blur-sm overflow-hidden">
            {/* Header strip */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-gradient-to-r from-cyan-400/5 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-indigo-500/20 border border-cyan-400/20 flex items-center justify-center">
                  <span className="text-lg font-bold text-cyan-300">{staff?.name.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{staff?.name}</h2>
                  <p className="text-xs text-white/35 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {profile ? `入职 ${profile.hireDate.replace('-', '年')}月${profile.hireDay ? ` ${profile.hireDay}日` : ''} · ${calcTenure(profile.hireDate)}` : ''}
                  </p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-300/70 bg-emerald-400/8 px-2.5 py-1 rounded-full border border-emerald-400/15">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                在职
              </span>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/6">
              {/* Base salary */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Wallet className="w-3.5 h-3.5 text-amber-400/60" />
                  <span className="text-[11px] text-white/40">基本工资</span>
                </div>
                <p className="text-lg font-bold font-mono text-white/90">
                  ¥{(parseFloat(profile?.baseSalary) || 0).toLocaleString()}
                </p>
              </div>
              {/* Social base */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400/60" />
                  <span className="text-[11px] text-white/40">社保基数</span>
                </div>
                <p className="text-lg font-bold font-mono text-white/90">
                  {profile?.socialBase ? '¥' + parseFloat(profile.socialBase).toLocaleString() : '按应发'}
                </p>
              </div>
              {/* Housing fund base */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Home className="w-3.5 h-3.5 text-orange-400/60" />
                  <span className="text-[11px] text-white/40">公积金基数</span>
                </div>
                <p className="text-lg font-bold font-mono text-white/90">
                  {profile?.housingFundBase ? '¥' + parseFloat(profile.housingFundBase).toLocaleString() : '同社保'}
                </p>
              </div>
              {/* Housing fund rate */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400/60" />
                  <span className="text-[11px] text-white/40">公积金比例</span>
                </div>
                <p className="text-lg font-bold font-mono text-white/90">
                  {profile?.housingFundRate ?? '12'}%
                </p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-xl border border-white/8 bg-white/3 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-emerald-400/70" />
              <span className="text-sm font-semibold text-white/80">发起人事变动</span>
            </div>

            {/* Action buttons row */}
            <div className="flex flex-wrap gap-2">
              {actionButtons.map(btn => {
                const c = colorMap[btn.color]
                const Icon = btn.icon
                const isActive = showForm && formType === btn.type
                return (
                  <button
                    key={btn.type}
                    onClick={() => isActive ? setShowForm(false) : openForm(btn.type)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      isActive
                        ? `${c.bg} ${c.text} ${c.border} shadow-[0_0_12px_rgba(34,211,238,0.1)]`
                        : 'bg-white/4 border-white/8 text-white/50 hover:bg-white/8 hover:text-white/70'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {btn.label}
                  </button>
                )
              })}
            </div>

            {/* Inline form */}
            {showForm && (
              <div className={`mt-4 rounded-lg border p-4 space-y-3 ${changeColors[formType].border} ${changeColors[formType].bg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${changeColors[formType].dot}`} />
                    <span className={`text-sm font-semibold ${changeColors[formType].text}`}>
                      {changeLabels[formType]} · {staff?.name}
                    </span>
                  </div>
                  <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-white/60 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Current value hint */}
                {(() => {
                  const currentVal = formType === 'salary' ? profile?.baseSalary
                    : formType === 'social_base' ? profile?.socialBase
                    : formType === 'housing_fund_base' ? profile?.housingFundBase
                    : formType === 'housing_fund_rate' ? profile?.housingFundRate
                    : profile?.hireDate
                  return currentVal ? (
                    <div className="text-xs text-white/35">
                      当前值: <span className="font-mono text-white/50">{formType === 'hire' ? currentVal.replace('-', '年') + '月' : formType === 'salary' || formType === 'social_base' || formType === 'housing_fund_base' ? '¥' + parseFloat(currentVal).toLocaleString() : currentVal + '%'}</span>
                    </div>
                  ) : null
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-white/40 mb-1 block">生效月份</Label>
                    <Input
                      type="month"
                      value={effectiveMonth}
                      onChange={e => setEffectiveMonth(e.target.value)}
                      className="h-9 font-mono bg-white/5 border-white/15 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/40 mb-1 block">新值</Label>
                    <Input
                      value={newValue}
                      onChange={e => setNewValue(e.target.value)}
                      placeholder={placeholders[formType]}
                      className="h-9 font-mono bg-white/5 border-white/15 text-white placeholder:text-white/25"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-white/40 mb-1 block">变动原因</Label>
                    <Input
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="如 年度调薪"
                      className="h-9 bg-white/5 border-white/15 text-white placeholder:text-white/25"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 border-emerald-400/30"
                    onClick={submitChange}
                    disabled={!newValue || !reason.trim()}
                  >
                    确认变动
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="border-white/15 text-white/60 hover:bg-white/5"
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Change history timeline */}
          <div className="rounded-xl border border-white/8 bg-white/3 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-white/40" />
                <span className="text-sm font-semibold text-white/80">变动历史</span>
              </div>
              {staffChanges.length > 0 && (
                <span className="text-xs text-white/30">{staffChanges.length} 条记录</span>
              )}
            </div>

            {staffChanges.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 mx-auto mb-3 flex items-center justify-center">
                  <History className="w-5 h-5 text-white/20" />
                </div>
                <p className="text-sm text-white/30">暂无变动记录</p>
                <p className="text-xs text-white/20 mt-1">点击上方按钮发起人事变动</p>
              </div>
            ) : (
              <div className="relative space-y-0">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/8" />

                {staffChanges.map((c, idx) => {
                  const colors = changeColors[c.type]
                  const formatValue = (val: string, type: ChangeType) => {
                    if (!val) return '-'
                    if (type === 'hire') return val.replace('-', '年') + '月'
                    if (type === 'salary' || type === 'social_base' || type === 'housing_fund_base') return '¥' + parseFloat(val).toLocaleString()
                    if (type === 'housing_fund_rate') return val + '%'
                    return val
                  }
                  return (
                    <div key={c.id} className="relative pl-8 pb-5 last:pb-0">
                      {/* Timeline dot */}
                      <div className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full ${colors.dot} border-2 border-[#0B1838] shadow-[0_0_8px_currentColor]`} />

                      {/* Content */}
                      <div className={`rounded-lg border ${colors.border} ${colors.bg} p-3`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${colors.text}`}>
                            {changeLabels[c.type]}
                          </span>
                          <span className="text-[11px] text-white/30 font-mono">
                            {c.effectiveMonth.replace('-', '年')}月生效
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {c.oldValue && (
                            <span className="font-mono text-white/30 line-through">
                              {formatValue(c.oldValue, c.type)}
                            </span>
                          )}
                          {c.oldValue && <ChevronRight className="w-3 h-3 text-white/20" />}
                          <span className={`font-mono font-semibold ${colors.text}`}>
                            {formatValue(c.newValue, c.type)}
                          </span>
                        </div>
                        {c.reason && (
                          <p className="text-xs text-white/35 mt-1.5">{c.reason}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
