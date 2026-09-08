import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar, Download, Building2, LayoutDashboard, Users, Wallet, Briefcase, TrendingUp, Upload, Save, HardDrive, Globe, Cloud } from 'lucide-react'
import { getDefaultInput, calcPayrollMonth } from '@/calc'
import { readCloudData, writeCloudData, flushCloudData } from '@/lib/cloudbase'
import { exportExcel } from '@/export'
import { getCityConfig } from '@/constants'
import { CostOverview } from '@/components/CostOverview'
import { EmployeeCard } from '@/components/EmployeeCard'
import { Workbench } from '@/components/Workbench'
import { Personnel } from '@/components/Personnel'
import { HRHub } from '@/components/HRHub'
import { AdminHub } from '@/components/AdminHub'
import { ReimbursementTool } from '@/components/ReimbursementTool'
import { FinanceHub } from '@/components/FinanceHub'
import { FinanceDashboard } from '@/components/FinanceDashboard'
import { STAFF, COMPANY_START_MONTH, COMPANY_CITY, getMonthList, getDefaultProfile, getInitialChanges, replayProfile, profileToInput } from '@/staff'
import type { EmployeeData, EmployeeInput, PayrollData, CumulativeResult } from '@/types'
import type { StaffProfile, PersonnelChange } from '@/staff'

const PAYROLL_KEY = 'toolpro_internal_payroll_v1'
const PROFILES_KEY = 'toolpro_internal_profiles_v1'
const CHANGES_KEY = 'toolpro_internal_changes_v1'

// 从入职月到目标月生成月份序列
function monthRange(start: string, end: string): string[] {
  const months: string[] = []
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  let y = sy, m = sm
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

type TabKey = 'workbench' | 'hr-hub' | 'personnel' | 'payroll' | 'admin-hub' | 'reimbursement' | 'finance-hub' | 'finance' | 'revenue' | 'admin'

export default function App() {
  const [tab, setTab] = useState<TabKey>('workbench')
  const [payrollData, setPayrollData] = useState<PayrollData>({})
  const [profiles, setProfiles] = useState<Record<string, StaffProfile>>({})
  const [changes, setChanges] = useState<PersonnelChange[]>([])
  const [currentMonth, setCurrentMonth] = useState(() => getMonthList()[getMonthList().length - 1])
  const [dataReady, setDataReady] = useState(false)
  const [dataSource, setDataSource] = useState<'cloud' | 'localStorage' | 'default'>('default')

  // 是否允许把当前数据同步上云。仅当加载到「真实数据」（云端或本地缓存）时允许；
  // 若加载结果是纯默认档案（云端/本地都无有效数据），禁止写云端，防止默认值覆盖云端真实数据。
  const canSyncRef = useRef(false)

  const city = getCityConfig(COMPANY_CITY)
  const monthList = getMonthList()

  const [reloadKey, setReloadKey] = useState(0)
  const retryLoad = useCallback(() => {
    canSyncRef.current = false
    setDataReady(false)
    setReloadKey(k => k + 1)
  }, [])

  // ── 启动时从 CloudBase 加载数据（fallback → localStorage → 默认值） ──
  useEffect(() => {
    let cancelled = false
    canSyncRef.current = false
    async function load() {
      // 1. 尝试 CloudBase 数据库
      try {
        const cloudData = await readCloudData<{ profiles?: Record<string, StaffProfile>; changes?: PersonnelChange[]; payrollData?: PayrollData }>()
        if (cloudData && cloudData.profiles && Object.keys(cloudData.profiles).length > 0) {
          if (cancelled) return
          canSyncRef.current = true
          const merged: Record<string, StaffProfile> = {}
          for (const s of STAFF) merged[s.id] = cloudData.profiles[s.id] ?? getDefaultProfile(s.id)
          setProfiles(merged)
          setChanges(cloudData.changes?.length ? cloudData.changes : getInitialChanges())
          setPayrollData(cloudData.payrollData ?? {})
          setDataSource('cloud')
          setDataReady(true)
          return
        }
      } catch { /* 离线或未初始化，继续 fallback */ }

      // 2. fallback 到 localStorage
      try {
        const rawProfiles = localStorage.getItem(PROFILES_KEY)
        if (rawProfiles) {
          const lp = JSON.parse(rawProfiles)
          if (Object.keys(lp).length > 0) {
            if (cancelled) return
            canSyncRef.current = true
            const merged: Record<string, StaffProfile> = {}
            for (const s of STAFF) merged[s.id] = lp[s.id] ?? getDefaultProfile(s.id)
            setProfiles(merged)
            setChanges(loadJSON<PersonnelChange[]>(CHANGES_KEY, getInitialChanges()))
            setPayrollData(loadJSON<PayrollData>(PAYROLL_KEY, {}))
            setDataSource('localStorage')
            setDataReady(true)
            return
          }
        }
      } catch {}

      // 3. 默认值（canSyncRef 保持 false：禁止把默认档案写回云端覆盖真实数据）
      if (cancelled) return
      const merged: Record<string, StaffProfile> = {}
      for (const s of STAFF) merged[s.id] = getDefaultProfile(s.id)
      setProfiles(merged)
      setChanges(getInitialChanges())
      setDataSource('default')
      setDataReady(true)
    }
    load()
    return () => { cancelled = true }
  }, [reloadKey])

  // ── 数据变更后自动落盘（CloudBase + localStorage 双写） ──
  const saveTimerRef = useRef<number>(0)
  useEffect(() => {
    if (!dataReady) return

    // localStorage：瞬时写入
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)) } catch {}
    try { localStorage.setItem(CHANGES_KEY, JSON.stringify(changes)) } catch {}
    try { localStorage.setItem(PAYROLL_KEY, JSON.stringify(payrollData)) } catch {}

    // CloudBase：debounce 500ms 避免频繁写入（仅当存在真实数据来源时同步，防默认值覆盖云端）
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      if (!canSyncRef.current) return
      const payload = { profiles, changes, payrollData }
      writeCloudData(payload).then(ok => {
        if (ok) setDataSource('cloud')
      })
    }, 500)
  }, [profiles, changes, payrollData, dataReady])

  // ── 关闭前强制全部落盘 ──
  const profilesRef = useRef(profiles)
  const changesRef = useRef(changes)
  const payrollRef = useRef(payrollData)
  profilesRef.current = profiles
  changesRef.current = changes
  payrollRef.current = payrollData

  useEffect(() => {
    const flush = () => {
      const payload = {
        profiles: profilesRef.current,
        changes: changesRef.current,
        payrollData: payrollRef.current,
      }
      // CloudBase 异步写入 (beforeunload 无法用 sync XHR 到云端；仅真实数据来源时同步)
      if (canSyncRef.current) flushCloudData(payload)
      // localStorage 兜底 (同步)
      try { localStorage.setItem(PROFILES_KEY, JSON.stringify(payload.profiles)) } catch {}
      try { localStorage.setItem(CHANGES_KEY, JSON.stringify(payload.changes)) } catch {}
      try { localStorage.setItem(PAYROLL_KEY, JSON.stringify(payload.payrollData)) } catch {}
    }
    window.addEventListener('beforeunload', flush)
    return () => window.removeEventListener('beforeunload', flush)
  }, [])

  // 回放变动记录，得到某员工在某月的生效档案（用于默认值和在职判断）
  const effectiveProfile = (empId: string, month: string): StaffProfile => {
    return replayProfile(changes, empId, month)
  }

  // 某员工在某月是否在职（按回放后的入职时间判断）
  const isActive = (empId: string, month: string): boolean => {
    const p = effectiveProfile(empId, month)
    return month >= p.hireDate
  }

  // 当前月在职员工
  const activeStaff = STAFF.filter(s => isActive(s.id, currentMonth))

  // 取某员工某月的输入：优先已录数据，否则用该月生效档案预填
  const getInput = (empId: string, month: string): EmployeeInput => {
    const saved = payrollData[month]?.[empId]
    if (saved) return saved
    const profile = effectiveProfile(empId, month)
    return profileToInput(profile)
  }

  const updateInput = (empId: string, field: keyof EmployeeInput, value: string) => {
    setPayrollData(prev => {
      const monthData = prev[currentMonth] ?? {}
      return {
        ...prev,
        [currentMonth]: {
          ...monthData,
          [empId]: { ...getInput(empId, currentMonth), [field]: value },
        },
      }
    })
  }

  const updateHousingFund = (empId: string, field: 'enableHousingFund' | 'housingFundSameAsSocial' | 'housingFundBase' | 'housingFundRate', value: string) => {
    setPayrollData(prev => {
      const monthData = prev[currentMonth] ?? {}
      const input = getInput(empId, currentMonth)
      const newInput = { ...input, [field]: (field === 'enableHousingFund' || field === 'housingFundSameAsSocial') ? value === 'true' : value }
      if (field === 'housingFundSameAsSocial' && value === 'true') newInput.housingFundBase = ''
      return {
        ...prev,
        [currentMonth]: { ...monthData, [empId]: newInput },
      }
    })
  }

  const toggleDeductionItem = (empId: string, itemKey: string) => {
    setPayrollData(prev => {
      const monthData = prev[currentMonth] ?? {}
      const input = getInput(empId, currentMonth)
      return {
        ...prev,
        [currentMonth]: {
          ...monthData,
          [empId]: {
            ...input,
            deductionItems: { ...input.deductionItems, [itemKey]: !input.deductionItems[itemKey] },
          },
        },
      }
    })
  }

  // 计算：每人累计预扣（入职时间取回放后的）
  const results = useMemo<CumulativeResult[]>(() => {
    return activeStaff.map(staff => {
      const profile = effectiveProfile(staff.id, currentMonth)
      const months = monthRange(profile.hireDate, currentMonth)
      const inputs = months.map(m => getInput(staff.id, m))
      return calcPayrollMonth(inputs, COMPANY_CITY, staff.name, staff.id, profile.hireDay, profile.hireDate)
    })
  }, [activeStaff, currentMonth, payrollData, changes])

  const handleExport = () => {
    const employees: EmployeeData[] = activeStaff.map(staff => ({
      id: staff.id,
      input: getInput(staff.id, currentMonth),
    }))
    const displayMonth = currentMonth.replace('-', '年') + '月'
    exportExcel(results, displayMonth, employees, city)
  }

  const handleProfileChange = (profile: StaffProfile) => {
    setProfiles(prev => ({ ...prev, [profile.id]: profile }))
  }

  const handleAddChange = (change: PersonnelChange) => {
    setChanges(prev => [...prev, change])
  }

  // ── 数据导出/导入 ──
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportData = () => {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profiles,
      changes,
      payrollData,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ecomflare-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target?.result as string)
        if (!backup.version || !backup.profiles || !backup.changes) {
          alert('文件格式不正确，请选择 EcomFlare 备份文件')
          return
        }
        if (!confirm(`将导入 ${Object.keys(backup.profiles).length} 名员工档案、${backup.changes.length} 条变动记录、${Object.keys(backup.payrollData ?? {}).length} 个月工资数据。\n\n当前数据将被覆盖，确定继续？`)) {
          return
        }
        setProfiles(backup.profiles)
        setChanges(backup.changes)
        if (backup.payrollData) setPayrollData(backup.payrollData)
      } catch {
        alert('文件解析失败，请确认是有效的 JSON 备份文件')
      }
    }
    reader.readAsText(file)
    // 重置 input 以允许重复选择同一文件
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 子模块标题映射（返回按钮 + 页头）
  const pageMeta: Record<string, { icon: string; title: string; desc: string }> = {
    personnel: { icon: '👥', title: '人事档案', desc: '员工档案 · 调薪 · 社保基数 · 入职信息' },
    payroll: { icon: '💰', title: '工资测算', desc: '月度核算 · 累计预扣个税 · 工资表导出' },
    finance: { icon: '📊', title: '收支明细看板', desc: 'Excel 导入 · 收支记录 · 月度趋势 · 类目分析' },
    revenue: { icon: '📈', title: '收入', desc: '待开发 · 后续接入' },
    admin: { icon: '📋', title: '行政', desc: '待开发 · 后续接入' },
  }

  if (tab === 'workbench') {
    return (
      <ErrorBoundary>
        <Workbench onNavigate={setTab} />
      </ErrorBoundary>
    )
  }

  if (tab === 'hr-hub') {
    return (
      <ErrorBoundary>
        <HRHub onNavigate={setTab} />
      </ErrorBoundary>
    )
  }

  if (tab === 'admin-hub') {
    return (
      <ErrorBoundary>
        <AdminHub onNavigate={setTab} />
      </ErrorBoundary>
    )
  }

  if (tab === 'reimbursement') {
    return (
      <ErrorBoundary>
        <ReimbursementTool onNavigate={setTab} />
      </ErrorBoundary>
    )
  }

  if (tab === 'finance-hub') {
    return (
      <ErrorBoundary>
        <FinanceHub onNavigate={setTab} />
      </ErrorBoundary>
    )
  }

  if (tab === 'finance') {
    return (
      <ErrorBoundary>
        <FinanceDashboard onNavigate={setTab} />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
    <div className="relative min-h-screen bg-[#0B1838] overflow-hidden py-6 px-4 sm:py-8">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-400/4 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-500/4 blur-[120px] pointer-events-none" />
      <div className="relative max-w-7xl mx-auto space-y-6">
        {/* 返回栏 */}
        <button
          onClick={() => setTab('hr-hub')}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-cyan-400 transition-colors"
        >
          ← 返回人事管理
        </button>

        {/* 模块页头 */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20">
            {pageMeta[tab]?.icon}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{pageMeta[tab]?.title}</h1>
            <p className="text-xs text-white/35">{pageMeta[tab]?.desc}</p>
          </div>
        </div>

        {/* ============ 人事管理 ============ */}
        {tab === 'personnel' && (
          <Personnel
            profiles={profiles}
            changes={changes}
            onProfileChange={handleProfileChange}
            onAddChange={handleAddChange}
          />
        )}

        {/* ============ 工资社保 ============ */}
        {tab === 'payroll' && (
          <>
            <Card className="shadow-lg border-white/10 bg-white/5 backdrop-blur-sm">
              <CardContent className="pt-5 pb-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400/60" />
                      <Label className="text-sm font-semibold text-white/80 whitespace-nowrap">工资月份</Label>
                      <select
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(e.target.value)}
                        className="w-32 h-9 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      >
                        {monthList.map(m => (
                          <option key={m} value={m} className="bg-[#0B1838]">{m.replace('-', '年')}月</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-xs text-white/35">
                      {city.name} · 社保基数 {city.socialBaseMin.toLocaleString()}-{city.socialBaseMax.toLocaleString()} · 默认值来自人事档案，可手动调整
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Button onClick={handleExport} className="gap-2 bg-cyan-600 hover:bg-cyan-700 border-cyan-400/30">
                      <Download className="w-4 h-4" />
                      导出工资表
                    </Button>
                  </div>
                </div>

                {/* 员工信息条 */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {STAFF.map(s => {
                    const active = isActive(s.id, currentMonth)
                    const p = effectiveProfile(s.id, currentMonth)
                    return (
                      <div key={s.id} className={`px-3 py-1.5 rounded-full text-xs border ${active ? 'bg-cyan-400/10 border-cyan-400/20 text-cyan-300' : 'bg-white/5 border-white/10 text-white/30'}`}>
                        {s.name} · {p.hireDate.replace('-', '年')}月入职{p.hireDay ? `（${p.hireDay}日）` : ''}
                        {!active && ' · 未入职'}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {results.length > 0 && (
              <CostOverview results={results} employeeCount={results.length} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeStaff.map(staff => (
                <EmployeeCard
                  key={staff.id}
                  input={{ ...getInput(staff.id, currentMonth), name: staff.name }}
                  result={results[activeStaff.indexOf(staff)]}
                  city={city}
                  reverseMode={false}
                  readonlyName
                  hideActions
                  onUpdate={(field, value) => updateInput(staff.id, field, value)}
                  onUpdateHousingFund={(field, value) => updateHousingFund(staff.id, field, value)}
                  onToggleDeduction={(itemKey) => toggleDeductionItem(staff.id, itemKey)}
                  onRemove={() => {}}
                  onDuplicate={() => {}}
                  housingFundRateOptions={city.housingFundRateRange.map(r => ({ value: String(r), label: `${r}%` }))}
                />
              ))}
            </div>

            {/* 累计个税明细 */}
            {results.length > 0 && (
              <Card className="shadow-lg border-amber-400/15 bg-white/5 backdrop-blur-sm">
                <CardContent className="pt-5 pb-4">
                  <Label className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 block">个税累计预扣明细（截至 {currentMonth.replace('-', '年')}月）</Label>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/5 text-left text-xs text-white/40">
                          <th className="px-3 py-2 font-semibold">姓名</th>
                          <th className="px-3 py-2 text-right font-semibold">累计收入</th>
                          <th className="px-3 py-2 text-right font-semibold">累计减除(5000×月)</th>
                          <th className="px-3 py-2 text-right font-semibold">累计社保公积金</th>
                          <th className="px-3 py-2 text-right font-semibold">累计应纳税所得额</th>
                          <th className="px-3 py-2 text-right font-semibold">累计应缴个税</th>
                          <th className="px-3 py-2 text-right font-semibold">以前已缴</th>
                          <th className="px-3 py-2 text-right font-semibold">本月预扣</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map(r => {
                          const staff = STAFF.find(s => s.id === r.id)
                          const monthsCount = monthRange(effectiveProfile(r.id, currentMonth).hireDate, currentMonth).length
                          return (
                            <tr key={r.id} className="border-t border-white/8">
                              <td className="px-3 py-2 font-medium text-white/90">{r.name}</td>
                              <td className="px-3 py-2 text-right font-mono text-white/70">{fmt(r.cumulativeIncome)}</td>
                              <td className="px-3 py-2 text-right font-mono text-white/70">{fmt(5000 * monthsCount)}</td>
                              <td className="px-3 py-2 text-right font-mono text-white/70">{fmt(r.cumulativeIncome - r.cumulativeTaxable - 5000 * monthsCount)}</td>
                              <td className="px-3 py-2 text-right font-mono text-white/70">{fmt(r.cumulativeTaxable)}</td>
                              <td className="px-3 py-2 text-right font-mono text-amber-400/80">{fmt(r.cumulativeTax)}</td>
                              <td className="px-3 py-2 text-right font-mono text-white/70">{fmt(r.priorPaidTax)}</td>
                              <td className="px-3 py-2 text-right font-mono font-semibold text-amber-400">{fmt(r.tax)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ============ 财务 / 收入 / 行政（占位） ============ */}
        {(tab === 'finance' || tab === 'revenue' || tab === 'admin') && (
          <Card className="shadow-lg border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="pt-10 pb-10 text-center">
              <div className="text-4xl mb-3">{tab === 'finance' ? '📊' : tab === 'revenue' ? '📈' : '📋'}</div>
              <h3 className="font-bold text-lg text-white/80">{pageMeta[tab]?.title} · 待开发</h3>
              <p className="text-sm text-white/30 mt-2">先完善人事与工资社保模块，后续再讨论需求</p>
            </CardContent>
          </Card>
        )}

        {tab !== 'workbench' && (
        <div className="rounded-xl border border-white/8 bg-white/3 backdrop-blur-sm px-5 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* 数据源状态指示器 */}
              <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border ${
                dataSource === 'cloud'
                  ? 'bg-cyan-400/8 border-cyan-400/20 text-cyan-300/70'
                  : dataSource === 'localStorage'
                  ? 'bg-amber-400/8 border-amber-400/20 text-amber-300/70'
                  : 'bg-white/5 border-white/10 text-white/30'
              }`}>
                {dataSource === 'cloud' ? <Cloud className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {dataSource === 'cloud' ? '云端' : dataSource === 'localStorage' ? '浏览器缓存' : '默认数据'}
              </div>
              <div className="text-xs text-white/25">
                {dataSource === 'default'
                  ? '未能连接云端，当前展示的是默认档案，修改不会上云'
                  : dataSource === 'localStorage'
                  ? '已从本机缓存恢复，稍后将自动同步到云端'
                  : '员工共 ' + STAFF.length + ' 人 · 数据自动同步到腾讯云'}
              </div>
              {dataSource === 'default' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={retryLoad}
                  className="gap-1.5 text-xs border-amber-400/25 text-amber-300/80 hover:bg-amber-400/10 hover:text-amber-200"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  重试云端连接
                </Button>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportData}
                className="gap-1.5 text-xs border-cyan-400/20 text-cyan-300/80 hover:bg-cyan-400/10 hover:text-cyan-200"
              >
                <Save className="w-3.5 h-3.5" />
                导出备份
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs border-white/15 text-white/50 hover:bg-white/5 hover:text-white/70"
              >
                <Upload className="w-3.5 h-3.5" />
                导入备份
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </div>
          </div>
          <p className="text-[10px] text-white/15 mt-2">本工具仅供内部参考，以社保局和税务局实际核算为准</p>
        </div>
        )}
      </div>
    </div>
    </ErrorBoundary>
  )
}

function fmt(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// 错误边界，防止某处异常导致整页空白
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error?: Error}> {
  state = { error: undefined as Error | undefined }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error, info: React.ErrorInfo) { console.error('App crash:', error, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#dc2626' }}>页面出错</h2>
          <pre style={{ background: '#fef2f2', padding: 12, borderRadius: 6, overflow: 'auto' }}>{this.state.error.message}</pre>
          <button onClick={() => location.reload()} style={{ marginTop: 12, padding: '6px 12px', cursor: 'pointer' }}>重新加载</button>
        </div>
      )
    }
    return this.props.children
  }
}
