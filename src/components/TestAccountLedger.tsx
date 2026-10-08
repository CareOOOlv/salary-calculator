import { useState, useMemo, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Coins, Users, Hash, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/* ─────────── 类型 ─────────── */
interface GrantRecord {
  id: string
  account: string     // 测试账号号码
  owner: string       // 归属（人/渠道/用途方）
  points: number      // 发放积分
  note: string        // 备注（可选）
  recordedAt: string  // ISO 时间，自动记录
}

interface TestAccountLedgerProps {
  onNavigate: (tab: string) => void
}

const STORAGE_KEY = 'toolpro_test_account_ledger_v1'

let _idCounter = 1
function genId(): string { return `ta_${Date.now()}_${_idCounter++}` }

function fmt(n: number): string {
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function loadRecords(): GrantRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/* ─────────── 主组件 ─────────── */
export function TestAccountLedger({ onNavigate }: TestAccountLedgerProps) {
  const [records, setRecords] = useState<GrantRecord[]>(() => loadRecords())
  const [account, setAccount] = useState('')
  const [owner, setOwner] = useState('')
  const [points, setPoints] = useState('')
  const [note, setNote] = useState('')
  const [filterAccount, setFilterAccount] = useState('all')
  const [filterOwner, setFilterOwner] = useState('all')
  const [error, setError] = useState('')

  // 落盘 localStorage
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)) } catch {}
  }, [records])

  // 全部账号列表（按最近发放排序）
  const accountList = useMemo(() => {
    const map = new Map<string, { total: number; count: number; lastAt: string }>()
    for (const r of records) {
      const prev = map.get(r.account)
      map.set(r.account, {
        total: (prev?.total ?? 0) + r.points,
        count: (prev?.count ?? 0) + 1,
        lastAt: !prev || r.recordedAt > prev.lastAt ? r.recordedAt : prev.lastAt,
      })
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].lastAt.localeCompare(a[1].lastAt))
      .map(([acc, v]) => ({ account: acc, ...v }))
  }, [records])

  // 全部归属列表
  const ownerList = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>()
    for (const r of records) {
      const prev = map.get(r.owner)
      map.set(r.owner, { total: (prev?.total ?? 0) + r.points, count: (prev?.count ?? 0) + 1 })
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([o, v]) => ({ owner: o, ...v }))
  }, [records])

  // 筛选后的记录（时间倒序，账号 + 归属双条件叠加）
  const filtered = useMemo(() => {
    return records
      .filter(r => (filterAccount === 'all' || r.account === filterAccount) && (filterOwner === 'all' || r.owner === filterOwner))
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
  }, [records, filterAccount, filterOwner])

  // 汇总
  const filteredTotal = useMemo(() => filtered.reduce((s, r) => s + r.points, 0), [filtered])
  const grandTotal = useMemo(() => records.reduce((s, r) => s + r.points, 0), [records])

  const handleSubmit = () => {
    const acc = account.trim()
    const own = owner.trim()
    const pts = Number(points)
    if (!acc) { setError('请输入测试账号号码'); return }
    if (!own) { setError('请输入归属'); return }
    if (!points.trim() || !Number.isFinite(pts) || pts <= 0) { setError('请输入有效的积分数（大于 0）'); return }
    setRecords(prev => [...prev, { id: genId(), account: acc, owner: own, points: Math.round(pts), note: note.trim(), recordedAt: new Date().toISOString() }])
    setAccount('')
    setOwner('')
    setPoints('')
    setNote('')
    setError('')
  }

  const handleDelete = (id: string) => {
    if (!confirm('确定删除这条发放记录？')) return
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="relative min-h-screen bg-[#0B1838] overflow-hidden py-6 px-4 sm:py-8">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-400/4 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-indigo-500/4 blur-[120px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto space-y-5">
        {/* 返回 + 页头 */}
        <button
          onClick={() => onNavigate('finance-hub')}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回财务中心
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-lg shadow-cyan-500/20">
            🧪
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">测试账号台账</h1>
            <p className="text-xs text-white/35">测试账号积分发放记录 · 按账号筛选 · 累计统计</p>
          </div>
        </div>

        {/* 录入表单 */}
        <Card className="shadow-lg border-cyan-400/15 bg-white/5 backdrop-blur-sm">
          <CardContent className="pt-5 pb-5">
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">录入发放记录</div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-[11px] text-white/35 block mb-1">测试账号号码</label>
                <input
                  value={account}
                  onChange={(e) => { setAccount(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="如 10000123456"
                  className="w-full h-9 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div className="sm:w-40">
                <label className="text-[11px] text-white/35 block mb-1">归属</label>
                <input
                  value={owner}
                  onChange={(e) => { setOwner(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="人 / 渠道 / 用途"
                  className="w-full h-9 rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div className="sm:w-36">
                <label className="text-[11px] text-white/35 block mb-1">发放积分</label>
                <input
                  value={points}
                  onChange={(e) => { setPoints(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  inputMode="numeric"
                  placeholder="如 1000"
                  className="w-full h-9 rounded-md border border-white/15 bg-white/5 px-3 text-sm font-mono text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div className="sm:w-48">
                <label className="text-[11px] text-white/35 block mb-1">备注（可选）</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  placeholder="用途 / 申请人等"
                  className="w-full h-9 rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleSubmit} className="gap-1.5 bg-cyan-600 hover:bg-cyan-700 h-9">
                  <Plus className="w-4 h-4" />
                  记录
                </Button>
              </div>
            </div>
            {error && <div className="text-xs text-rose-400 mt-2">{error}</div>}
            <div className="text-[10px] text-white/20 mt-2">日期时间在记录时自动写入，无需手动填写</div>
          </CardContent>
        </Card>

        {/* 汇总卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-[11px] text-white/35 uppercase tracking-wider mb-1">
                <Coins className="w-3.5 h-3.5 text-amber-400/60" />
                累计发放积分
              </div>
              <div className="text-xl font-bold font-mono text-amber-400">{fmt(grandTotal)}</div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-[11px] text-white/35 uppercase tracking-wider mb-1">
                <Users className="w-3.5 h-3.5 text-cyan-400/60" />
                测试账号数
              </div>
              <div className="text-xl font-bold font-mono text-cyan-400">{accountList.length}</div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm col-span-2 lg:col-span-1">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 text-[11px] text-white/35 uppercase tracking-wider mb-1">
                <Hash className="w-3.5 h-3.5 text-white/40" />
                发放笔数
              </div>
              <div className="text-xl font-bold font-mono text-white/80">{records.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* 各账号 / 归属累计（点击可筛选） */}
        {accountList.length > 0 && (
          <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="pt-5 pb-4">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">账号累计积分</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterAccount('all')}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filterAccount === 'all'
                    ? 'bg-cyan-400/15 border-cyan-400/30 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'}`}
                >
                  全部账号 · {fmt(grandTotal)} 积分
                </button>
                {accountList.map(a => (
                  <button
                    key={a.account}
                    onClick={() => setFilterAccount(a.account)}
                    className={`px-3 py-1.5 rounded-full text-xs border font-mono transition-colors ${filterAccount === a.account
                      ? 'bg-cyan-400/15 border-cyan-400/30 text-cyan-300'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'}`}
                  >
                    {a.account} · {fmt(a.total)} 积分 / {a.count} 笔
                  </button>
                ))}
              </div>
              {ownerList.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 mt-4">归属累计积分</div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterOwner('all')}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filterOwner === 'all'
                        ? 'bg-indigo-400/15 border-indigo-400/30 text-indigo-300'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'}`}
                    >
                      全部归属
                    </button>
                    {ownerList.map(o => (
                      <button
                        key={o.owner}
                        onClick={() => setFilterOwner(o.owner)}
                        className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${filterOwner === o.owner
                          ? 'bg-indigo-400/15 border-indigo-400/30 text-indigo-300'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'}`}
                      >
                        {o.owner} · {fmt(o.total)} 积分 / {o.count} 笔
                      </button>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* 发放记录表 */}
        <Card className="shadow-lg border-white/10 bg-white/5 backdrop-blur-sm">
          <CardContent className="pt-5 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">积分发放记录</div>
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-white/30" />
                <select
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value)}
                  className="h-8 rounded-md border border-white/15 bg-white/5 px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="all" className="bg-[#0B1838]">全部账号</option>
                  {accountList.map(a => (
                    <option key={a.account} value={a.account} className="bg-[#0B1838]">{a.account}</option>
                  ))}
                </select>
                <select
                  value={filterOwner}
                  onChange={(e) => setFilterOwner(e.target.value)}
                  className="h-8 rounded-md border border-white/15 bg-white/5 px-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="all" className="bg-[#0B1838]">全部归属</option>
                  {ownerList.map(o => (
                    <option key={o.owner} value={o.owner} className="bg-[#0B1838]">{o.owner}</option>
                  ))}
                </select>
                {(filterAccount !== 'all' || filterOwner !== 'all') && (
                  <button
                    onClick={() => { setFilterAccount('all'); setFilterOwner('all') }}
                    className="text-[11px] text-cyan-400/70 hover:text-cyan-300"
                  >
                    清除筛选
                  </button>
                )}
              </div>
            </div>

            {(filterAccount !== 'all' || filterOwner !== 'all') && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-cyan-400/8 border border-cyan-400/20 text-xs text-cyan-300/90">
                {filterAccount !== 'all' && <>账号 <span className="font-mono font-semibold">{filterAccount}</span> </>}
                {filterOwner !== 'all' && <>归属 <span className="font-semibold">{filterOwner}</span> </>}
                筛选结果累计发放
                <span className="font-mono font-bold text-amber-400 mx-1">{fmt(filteredTotal)}</span> 积分 · 共 {filtered.length} 笔
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2 opacity-30">🧪</div>
                <p className="text-sm text-white/30">
                  {records.length === 0 ? '暂无发放记录，先在上方录入一条' : '当前筛选条件下暂无记录'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-white/5 text-left text-xs text-white/40">
                      <th className="px-3 py-2 font-semibold">测试账号</th>
                      <th className="px-3 py-2 font-semibold">归属</th>
                      <th className="px-3 py-2 text-right font-semibold">发放积分</th>
                      <th className="px-3 py-2 font-semibold">备注</th>
                      <th className="px-3 py-2 font-semibold">记录时间</th>
                      <th className="px-3 py-2 text-right font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id} className="border-t border-white/8 hover:bg-white/3 transition-colors">
                        <td className="px-3 py-2 font-mono font-medium text-white/90">{r.account}</td>
                        <td className="px-3 py-2 text-white/70">{r.owner}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-amber-400">{fmt(r.points)}</td>
                        <td className="px-3 py-2 text-white/50 text-xs">{r.note || <span className="text-white/15">—</span>}</td>
                        <td className="px-3 py-2 font-mono text-xs text-white/40">{fmtTime(r.recordedAt)}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="text-white/20 hover:text-rose-400 transition-colors p-1"
                            title="删除记录"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/15">
                      <td className="px-3 py-2 text-xs text-white/40" colSpan={4}>
                        {filterAccount === 'all' && filterOwner === 'all' ? '全部记录' : '当前筛选结果'} 小计
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-amber-400">{fmt(filteredTotal)}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-[10px] text-white/15 text-center">数据保存在本机浏览器中，如需跨设备使用请导出备份</p>
      </div>
    </div>
  )
}
