import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calculator, Download, RotateCcw, Plus, Users, MapPin, Zap } from 'lucide-react'
import { genId, getDefaultInput, calcEmployee, reverseCalcEmployee } from '@/calc'
import { exportExcel } from '@/export'
import { getCityConfig, getHousingFundRateOptions } from '@/constants'
import { CITIES, DEFAULT_CITY_ID } from '@/data/cityData'
import { CostOverview } from '@/components/CostOverview'
import { EmployeeCard } from '@/components/EmployeeCard'
import { BatchMode } from '@/components/BatchMode'
import { SalaryTable } from '@/components/SalaryTable'
import { SocialTable } from '@/components/SocialTable'
import { TaxTable } from '@/components/TaxTable'
import type { EmployeeData, EmployeeInput, BatchRow } from '@/types'

function emptyBatchRow(): BatchRow {
  return {
    id: genId(),
    name: '',
    baseSalary: '',
    performance: '',
    workDays: '',
    social: true,
    housingFund: true,
  }
}

export default function App() {
  const [cityId, setCityId] = useState(DEFAULT_CITY_ID)
  const [reverseMode, setReverseMode] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}年${now.getMonth() + 1}月`
  })
  const [employees, setEmployees] = useState<EmployeeData[]>([
    { id: genId(), input: getDefaultInput() },
  ])
  const [batchRows, setBatchRows] = useState<BatchRow[]>([])

  const city = getCityConfig(cityId)
  const housingFundRateOptions = getHousingFundRateOptions(cityId)

  const results = useMemo(
    () => employees.map(e => reverseMode ? (reverseCalcEmployee(e, cityId) || calcEmployee(e, cityId)) : calcEmployee(e, cityId)),
    [employees, cityId, reverseMode]
  )

  const addEmployee = () => {
    setEmployees(prev => [...prev, { id: genId(), input: getDefaultInput() }])
  }

  const duplicateEmployee = (id: string) => {
    setEmployees(prev => {
      const idx = prev.findIndex(e => e.id === id)
      if (idx === -1) return prev
      const source = prev[idx]
      const copy = { id: genId(), input: { ...source.input, name: '' } }
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
    })
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
    exportExcel(results, yearMonth, employees, city)
  }

  const addBatchRows = (count: number) => {
    setBatchRows(prev => [...prev, ...Array.from({ length: count }, () => emptyBatchRow())])
  }

  const toggleMode = () => {
    setBatchMode(!batchMode)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-6 px-4 sm:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              工资社保个税计算器
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            支持 {CITIES.length} 个城市费率 · 任意人数 · 可选公积金 · 导出工资表
            <br />
            <span className="inline-flex gap-2 mt-1.5">
              <button
                onClick={() => setReverseMode(!reverseMode)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${reverseMode ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                {reverseMode ? '🔄 税后倒推模式' : '🔄 切换税前→税后'}
              </button>
              <button
                onClick={toggleMode}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${batchMode ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}
              >
                {batchMode ? '⚡ 批量计算模式' : '⚡ 批量计算模式'}
              </button>
            </span>
          </p>
        </div>

        <Card className="shadow-md border-blue-100">
          <CardContent className="pt-6 pb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <Label className="text-sm font-semibold text-slate-700 whitespace-nowrap">城市</Label>
                  <select
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                    className="w-28 h-9 rounded-md border border-input bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CITIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold text-slate-700 whitespace-nowrap">工资月份</Label>
                  <Input value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} className="w-40 font-mono" />
                </div>
                <div className="text-xs text-slate-400 space-x-2">
                  <span>社保基数: {city.socialBaseMin.toLocaleString()} - {city.socialBaseMax.toLocaleString()}</span>
                  <span>|</span>
                  <span>最低工资: {city.minSalary.toLocaleString()}</span>
                </div>
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

        {!batchMode && employees.length > 0 && (
          <CostOverview results={results} employeeCount={employees.length} />
        )}

        {batchMode ? (
          <BatchMode
            city={city}
            rows={batchRows}
            onChange={setBatchRows}
            onAddRows={addBatchRows}
            onReset={() => setBatchRows([])}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {employees.map((emp, idx) => (
                <EmployeeCard
                  key={emp.id}
                  input={emp.input}
                  result={results[idx]}
                  city={city}
                  reverseMode={reverseMode}
                  onUpdate={(field, value) => updateInput(emp.id, field, value)}
                  onUpdateHousingFund={(field, value) => updateHousingFund(emp.id, field, value)}
                  onToggleDeduction={(itemKey) => toggleDeductionItem(emp.id, itemKey)}
                  onRemove={() => removeEmployee(emp.id)}
                  onDuplicate={() => duplicateEmployee(emp.id)}
                  housingFundRateOptions={housingFundRateOptions}
                />
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                onClick={addEmployee}
                variant="outline"
                className="gap-2 px-8 py-6 text-base border-dashed border-2 hover:border-blue-400 hover:bg-blue-50"
              >
                <Plus className="w-5 h-5" />
                添加员工
              </Button>
            </div>

            {employees.length > 0 && (
              <SalaryTable results={results} />
            )}

            {employees.length > 0 && (
              <SocialTable results={results} employees={employees} city={city} />
            )}

            {employees.length > 0 && (
              <TaxTable results={results} />
            )}
          </>
        )}

        <div className="text-center text-xs text-slate-400 pb-4 space-y-1">
          <p>
            当前城市：{city.name} |
            养老企业{(city.companyRates.pension * 100).toFixed(city.companyRates.pension % 1 === 0 ? 0 : 1)}%个人{(city.personalRates.pension * 100).toFixed(city.personalRates.pension % 1 === 0 ? 0 : 1)}% |
            医疗企业{(city.companyRates.medical * 100).toFixed(city.companyRates.medical % 1 === 0 ? 0 : 1)}%个人{(city.personalRates.medical * 100).toFixed(city.personalRates.medical % 1 === 0 ? 0 : 1)}% |
            失业企业{(city.companyRates.unemployment * 100).toFixed(city.companyRates.unemployment % 1 === 0 ? 0 : 1)}%个人{(city.personalRates.unemployment * 100).toFixed(city.personalRates.unemployment % 1 === 0 ? 0 : 1)}% |
            工伤企业{(city.companyRates.injury * 100).toFixed(city.companyRates.injury % 1 === 0 ? 0 : 1)}%
          </p>
          <p>个税起征点5,000元/月 | 公积金个人部分可抵扣个税 | 本工具仅供参考，以社保局和税务局实际核算为准</p>
        </div>
      </div>
    </div>
  )
}
