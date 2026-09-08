import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { ArrowLeft, Upload, Trash2, TrendingUp, TrendingDown, DollarSign, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/* ─────────── 类型 ─────────── */
interface FinanceRecord {
  id: string
  date: string
  category: string
  description: string
  income: number
  expense: number
  uploadMonth: string // YYYY-MM
  uploadTime: string   // ISO
}

interface FinanceDashboardProps {
  onNavigate: (tab: string) => void
}

const STORAGE_KEY = 'toolpro_internal_finance_v1'

/* ─────────── 类目配色 ─────────── */
const CATEGORY_COLORS: Record<string, string> = {
  '营业收入': '#22D3EE',
  '服务收入': '#34D399',
  '投资收益': '#A78BFA',
  '其他收入': '#FBBF24',
  '人工成本': '#F87171',
  '办公费用': '#FB923C',
  '差旅费用': '#F472B6',
  '营销费用': '#818CF8',
  '税费': '#E879F9',
  '折旧摊销': '#94A3B8',
  '其他支出': '#64748B',
}

function getCategoryColor(cat: string): string {
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (cat.includes(key) || key.includes(cat)) return color
  }
  return '#64748B'
}

/* ─────────── 工具 ─────────── */
let _idCounter = 1
function genId(): string { return `fin_${Date.now()}_${_idCounter++}` }

function fmt(n: number): string {
  return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ─────────── 局部 SVG 图表 ─────────── */

/** 月度趋势柱状图 */
function MonthlyTrendChart({ records }: { records: FinanceRecord[] }) {
  const months = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>()
    for (const r of records) {
      const m = r.date.substring(0, 7) // YYYY-MM
      if (!map.has(m)) map.set(m, { income: 0, expense: 0 })
      const entry = map.get(m)!
      entry.income += r.income
      entry.expense += r.expense
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12) // 最多显示最近 12 个月
  }, [records])

  if (months.length === 0) return null

  const maxVal = Math.max(
    ...months.map(([, v]) => Math.max(v.income, v.expense)),
    1
  )

  const W = Math.max(months.length * 80, 400)
  const H = 200
  const PAD = { top: 16, right: 16, bottom: 36, left: 8 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const barW = Math.max(6, Math.min(20, (chartW / months.length - 12) / 2))

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[400px]" style={{ minHeight: 200 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const y = PAD.top + chartH * (1 - pct)
          return (
            <g key={pct}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <text x={PAD.left - 4} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="9">
                {maxVal === 0 ? '0' : (maxVal * pct / 10000).toFixed(pct === 0 ? 0 : 1).replace(/\.0$/, '')}{pct === 1 || maxVal < 10000 ? '' : '万'}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {months.map(([month, val], i) => {
          const x = PAD.left + (i / months.length) * chartW + (chartW / months.length - barW * 2) / 2

          const incomeH = maxVal > 0 ? (val.income / maxVal) * chartH : 0
          const expenseH = maxVal > 0 ? (val.expense / maxVal) * chartH : 0

          return (
            <g key={month}>
              {/* Income bar */}
              <rect
                x={x}
                y={PAD.top + chartH - incomeH}
                width={barW}
                height={incomeH}
                rx={2}
                fill="#22D3EE"
                fillOpacity={0.85}
              />
              {/* Expense bar */}
              <rect
                x={x + barW + 2}
                y={PAD.top + chartH - expenseH}
                width={barW}
                height={expenseH}
                rx={2}
                fill="#F87171"
                fillOpacity={0.85}
              />
              {/* Month label */}
              <text
                x={x + barW + 1}
                y={H - 6}
                textAnchor="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize="9"
              >
                {month.substring(5)}
              </text>
            </g>
          )
        })}

        {/* Legend */}
        <rect x={W - PAD.right - 140} y={4} width={12} height={12} rx={2} fill="#22D3EE" fillOpacity={0.85} />
        <text x={W - PAD.right - 124} y={14} fill="rgba(255,255,255,0.5)" fontSize="10">收入</text>
        <rect x={W - PAD.right - 90} y={4} width={12} height={12} rx={2} fill="#F87171" fillOpacity={0.85} />
        <text x={W - PAD.right - 74} y={14} fill="rgba(255,255,255,0.5)" fontSize="10">支出</text>
      </svg>
    </div>
  )
}

/** 类目占比环图 */
function CategoryDonut({ records, type }: { records: FinanceRecord[]; type: 'income' | 'expense' }) {
  const slices = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of records) {
      const val = type === 'income' ? r.income : r.expense
      if (val <= 0) continue
      map.set(r.category, (map.get(r.category) || 0) + val)
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0)
    return Array.from(map.entries())
      .map(([cat, val]) => ({ category: cat, value: val, pct: total > 0 ? val / total : 0 }))
      .sort((a, b) => b.value - a.value)
  }, [records, type])

  const total = slices.reduce((s, sl) => s + sl.value, 0)
  if (total === 0) return <div className="text-xs text-white/20 py-8 text-center">暂无{type === 'income' ? '收入' : '支出'}数据</div>

  const cx = 80, cy = 80, r = 60
  let angle = -Math.PI / 2
  const slicePaths: { path: string; color: string; cat: string; pct: number; value: number }[] = []

  for (const sl of slices) {
    if (sl.pct <= 0) continue
    const delta = sl.pct * Math.PI * 2
    const x1 = cx + r * Math.cos(angle)
    const y1 = cy + r * Math.sin(angle)
    angle += delta
    const x2 = cx + r * Math.cos(angle)
    const y2 = cy + r * Math.sin(angle)
    const largeArc = sl.pct > 0.5 ? 1 : 0
    const path = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`
    slicePaths.push({ path, color: getCategoryColor(sl.category), cat: sl.category, pct: sl.pct, value: sl.value })
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg viewBox="0 0 160 160" className="w-40 h-40 flex-shrink-0">
        {slicePaths.map((sl, i) => (
          <path key={i} d={sl.path} fill={sl.color} fillOpacity={0.85} stroke="#0B1838" strokeWidth={1.5} />
        ))}
        <circle cx={cx} cy={cy} r={35} fill="#0B1838" />
        <text x={cx} y={cy - 4} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="13" fontWeight="bold">
          {fmt(total)}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="9">
          {type === 'income' ? '总收入' : '总支出'}
        </text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-[140px]">
        {slicePaths.slice(0, 6).map((sl, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: sl.color }} />
            <span className="text-white/60 flex-1 truncate">{sl.cat}</span>
            <span className="text-white/30 font-mono">{(sl.pct * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────── 主组件 ─────────── */
export function FinanceDashboard({ onNavigate }: FinanceDashboardProps) {
  const [records, setRecords] = useState<FinanceRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })
  const [filterMonth, setFilterMonth] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 持久化
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)) } catch {}
  }, [records])

  // ── Excel 上传解析 ──
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('请上传 .xlsx / .xls / .csv 格式的 Excel 文件')
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const wsName = wb.SheetNames[0]
        const ws = wb.Sheets[wsName]
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

        if (rows.length === 0) {
          alert('Excel 文件为空或无法解析')
          return
        }

        // 列名自动映射（支持中英文）
        const headers = Object.keys(rows[0])
        const colMap: Record<string, string> = {}
        for (const h of headers) {
          const lh = String(h).toLowerCase()
          if (/日期|date/.test(lh)) colMap.date = h
          else if (/类目|类别|分类|类型|category|type/.test(lh)) colMap.category = h
          else if (/摘要|说明|描述|备注|desc|note|remark/.test(lh)) colMap.description = h
          else if (/收入|金额.*收|借.*方|in/.test(lh) && !/支出/.test(lh)) colMap.income = h
          else if (/支出|金额.*支|贷.*方|out|expense/.test(lh)) colMap.expense = h
        }

        // 如果没有识别到类目/日期列，尝试假设第1=日期，第2=类目，第3=摘要，按数值判断收入/支出
        if (!colMap.date) colMap.date = headers[0]
        if (!colMap.category) colMap.category = headers[1] || ''
        if (!colMap.description) colMap.description = headers[2] || ''

        const now = new Date().toISOString()
        const newRecords: FinanceRecord[] = []

        for (const row of rows) {
          const rawDate = String(row[colMap.date] ?? '')
          const category = String(row[colMap.category] ?? '其他')
          const description = String(row[colMap.description] ?? '')

          // 解析日期（支持多种格式：2024-01-15, 2024/1/15, 1月15日, etc）
          let date = ''
          const dateMatch = rawDate.match(/(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})/)
          if (dateMatch) {
            date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
          } else {
            // 尝试 Excel 序列号日期
            const num = Number(rawDate)
            if (!isNaN(num) && num > 40000 && num < 60000) {
              const dt = new Date((num - 25569) * 86400 * 1000)
              date = dt.toISOString().split('T')[0]
            }
          }
          if (!date) date = new Date().toISOString().split('T')[0] // fallback

          // 解析收入/支出
          let income = 0, expense = 0
          if (colMap.income) {
            income = parseFloat(String(row[colMap.income])) || 0
          }
          if (colMap.expense) {
            expense = parseFloat(String(row[colMap.expense])) || 0
          }
          // 如果没有明确的收入/支行列，尝试从数值列判断（正数=收入，负数或金额列=支出）
          if (!colMap.income && !colMap.expense) {
            for (const h of headers.slice(3)) {
              const val = parseFloat(String(row[h]))
              if (isNaN(val) || val === 0) continue
              if (val > 0) income = val
              else expense = Math.abs(val)
              break
            }
          }

          if (income === 0 && expense === 0) continue // 跳过无金额行

          const uploadMonth = date.substring(0, 7)
          newRecords.push({
            id: genId(),
            date,
            category: category || (income > 0 ? '其他收入' : '其他支出'),
            description: description || '',
            income,
            expense,
            uploadMonth,
            uploadTime: now,
          })
        }

        if (newRecords.length === 0) {
          alert('未能从 Excel 中解析到有效的收支记录。请检查格式：需包含 日期、类目、收入/支出 列。')
          return
        }

        setRecords(prev => {
          // 去重：同日期+同类目+同金额+同摘要的跳过
          const existing = new Set(
            prev.map(r => `${r.date}|${r.category}|${r.income}|${r.expense}|${r.description}`)
          )
          const toAdd = newRecords.filter(
            r => !existing.has(`${r.date}|${r.category}|${r.income}|${r.expense}|${r.description}`)
          )
          return [...prev, ...toAdd]
        })

        alert(`成功导入 ${newRecords.length} 条记录${newRecords.length !== newRecords.filter(r => true).length ? '' : ''}`)
      } catch (err) {
        console.error(err)
        alert('Excel 解析失败，请检查文件格式')
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }, [])

  // ── 删除记录 ──
  const deleteRecord = useCallback((id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id))
  }, [])

  // ── 清空全部 ──
  const clearAll = useCallback(() => {
    if (records.length === 0) return
    if (confirm(`确认清空全部 ${records.length} 条收支记录？此操作不可撤销。`)) {
      setRecords([])
    }
  }, [records.length])

  // ── 筛选 ──
  const availableMonths = useMemo(() => {
    const set = new Set(records.map(r => r.date.substring(0, 7)))
    return Array.from(set).sort().reverse()
  }, [records])

  const filteredRecords = useMemo(() => {
    if (!filterMonth) return records
    return records.filter(r => r.date.substring(0, 7) === filterMonth)
  }, [records, filterMonth])

  // ── 统计 ──
  const stats = useMemo(() => {
    const r = filteredRecords
    const totalIncome = r.reduce((s, rr) => s + rr.income, 0)
    const totalExpense = r.reduce((s, rr) => s + rr.expense, 0)
    return {
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
      count: r.length,
    }
  }, [filteredRecords])

  return (
    <div className="relative min-h-screen bg-[#0B1838] overflow-hidden py-6 px-4 sm:py-8">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-400/4 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-cyan-400/4 blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto space-y-6">
        {/* 返回 */}
        <button
          onClick={() => onNavigate('finance-hub')}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-purple-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回财务中心
        </button>

        {/* 页头 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-rose-600 text-white flex items-center justify-center text-xl shadow-lg shadow-purple-500/20">
              📊
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">收支明细看板</h1>
              <p className="text-xs text-white/35">
                上传月度 Excel · 自动解析 · {records.length} 条记录
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 border-purple-400/20 text-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              上传 Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearAll}
              className="gap-1.5 text-xs border-red-400/20 text-red-300/70 hover:bg-red-400/10 hover:text-red-200"
              disabled={records.length === 0}
            >
              <Trash2 className="w-3.5 h-3.5" />
              清空
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* ===== 概览卡片 ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* 总收入 */}
          <div className="rounded-xl border border-emerald-400/20 p-4 sm:p-5"
            style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(13,25,55,0.6) 100%)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-400/15 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs text-white/40">总收入</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400">¥ {fmt(stats.totalIncome)}</div>
            {filterMonth && <div className="text-[10px] text-white/20 mt-1">{filterMonth}</div>}
          </div>

          {/* 总支出 */}
          <div className="rounded-xl border border-rose-400/20 p-4 sm:p-5"
            style={{ background: 'linear-gradient(135deg, rgba(251,113,133,0.06) 0%, rgba(13,25,55,0.6) 100%)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-rose-400/15 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xs text-white/40">总支出</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-rose-400">¥ {fmt(stats.totalExpense)}</div>
            {filterMonth && <div className="text-[10px] text-white/20 mt-1">{filterMonth}</div>}
          </div>

          {/* 净收支 */}
          <div className="rounded-xl border p-4 sm:p-5"
            style={{
              borderColor: stats.net >= 0 ? 'rgba(34,211,238,0.2)' : 'rgba(251,113,133,0.2)',
              background: `linear-gradient(135deg, ${stats.net >= 0 ? 'rgba(34,211,238,0.06)' : 'rgba(251,113,133,0.06)'} 0%, rgba(13,25,55,0.6) 100%)`,
              backdropFilter: 'blur(12px)',
            }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-400/15 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-xs text-white/40">净收支</span>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${stats.net >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {stats.net >= 0 ? '+' : ''}¥ {fmt(Math.abs(stats.net))}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-white/20">
                {stats.net >= 0 ? '盈利' : '亏损'}
              </span>
              <span className="text-[10px] text-white/20">{stats.count} 条记录</span>
            </div>
          </div>
        </div>

        {/* ===== 图表区 ===== */}
        {records.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* 月度趋势 */}
            <Card className="lg:col-span-3 border-white/8 bg-white/3 backdrop-blur-sm">
              <CardContent className="pt-4 pb-3">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">月度收支趋势</h3>
                <MonthlyTrendChart records={filteredRecords} />
              </CardContent>
            </Card>

            {/* 收入类目 + 支出类目 */}
            <Card className="lg:col-span-2 border-white/8 bg-white/3 backdrop-blur-sm">
              <CardContent className="pt-4 pb-3 space-y-5">
                <div>
                  <h3 className="text-xs font-semibold text-emerald-400/60 uppercase tracking-wider mb-3">收入类目分布</h3>
                  <CategoryDonut records={filteredRecords} type="income" />
                </div>
                <div className="border-t border-white/6 pt-4">
                  <h3 className="text-xs font-semibold text-rose-400/60 uppercase tracking-wider mb-3">支出类目分布</h3>
                  <CategoryDonut records={filteredRecords} type="expense" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== 筛选 + 记录表 ===== */}
        <Card className="border-white/8 bg-white/3 backdrop-blur-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                收支明细 · {filteredRecords.length} 条
              </h3>
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="h-7 rounded-md border border-white/15 bg-white/5 px-2 text-xs text-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="" className="bg-[#0B1838]">全部月份</option>
                {availableMonths.map(m => (
                  <option key={m} value={m} className="bg-[#0B1838]">{m}</option>
                ))}
              </select>
            </div>

            {records.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-white/10 mx-auto" />
                <p className="text-sm text-white/20">暂无收支记录</p>
                <p className="text-xs text-white/15">上传月度 Excel 对账单开始使用</p>
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5 bg-purple-600 hover:bg-purple-700 border-purple-400/20 text-xs mt-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  上传 Excel
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-white/30 border-b border-white/8">
                      <th className="px-3 py-2 font-medium">日期</th>
                      <th className="px-3 py-2 font-medium">类目</th>
                      <th className="px-3 py-2 font-medium">摘要</th>
                      <th className="px-3 py-2 text-right font-medium">收入</th>
                      <th className="px-3 py-2 text-right font-medium">支出</th>
                      <th className="px-3 py-2 text-right font-medium w-12">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords
                      .sort((a, b) => b.date.localeCompare(a.date) || a.description.localeCompare(b.description))
                      .map(r => (
                        <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                          <td className="px-3 py-2.5 text-white/60 font-mono text-xs">{r.date}</td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1.5 text-xs">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(r.category) }} />
                              <span className="text-white/70">{r.category}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-white/40 text-xs max-w-[200px] truncate" title={r.description}>
                            {r.description || '-'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs">
                            {r.income > 0 ? (
                              <span className="text-emerald-400/80">¥ {fmt(r.income)}</span>
                            ) : (
                              <span className="text-white/15">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs">
                            {r.expense > 0 ? (
                              <span className="text-rose-400/80">¥ {fmt(r.expense)}</span>
                            ) : (
                              <span className="text-white/15">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => deleteRecord(r.id)}
                              className="text-white/15 hover:text-red-400 transition-colors"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Excel 格式说明 */}
        <div className="rounded-xl border border-white/6 bg-white/2 backdrop-blur-sm px-4 py-3">
          <p className="text-[10px] text-white/20">
            💡 Excel 格式要求：支持 .xlsx/.xls/.csv。列名可以包含「日期」「类目/类别」「摘要/说明」「收入」「支出」等关键词，系统会自动识别。
            如果没有明确的收入/支行列，系统会尝试从数值列判断（正值=收入）。支持合并多个月份的文件，同一条记录不会重复导入。
          </p>
        </div>

        {/* 底部分隔 */}
        <div className="h-8" />
      </div>
    </div>
  )
}
