export interface CityConfig {
  id: string
  name: string
  province: string
  tier: 1 | 2
  companyRates: {
    pension: number
    medical: number
    unemployment: number
    injury: number
  }
  personalRates: {
    pension: number
    medical: number
    unemployment: number
  }
  socialBaseMin: number
  socialBaseMax: number
  housingFundRateRange: number[]
  housingFundBaseMin: number
  housingFundBaseMax: number
  minSalary: number
}

export const CITIES: CityConfig[] = [
  {
    id: 'beijing', name: '北京', province: '北京市', tier: 1,
    companyRates: { pension: 0.16, medical: 0.098, unemployment: 0.005, injury: 0.004 },
    personalRates: { pension: 0.08, medical: 0.02, unemployment: 0.005 },
    socialBaseMin: 7162, socialBaseMax: 35811,
    housingFundRateRange: [5, 6, 7, 8, 9, 10, 11, 12],
    housingFundBaseMin: 2540, housingFundBaseMax: 35283,
    minSalary: 2540,
  },
  {
    id: 'shanghai', name: '上海', province: '上海市', tier: 1,
    companyRates: { pension: 0.16, medical: 0.10, unemployment: 0.005, injury: 0.0026 },
    personalRates: { pension: 0.08, medical: 0.02, unemployment: 0.005 },
    socialBaseMin: 7310, socialBaseMax: 36549,
    housingFundRateRange: [5, 6, 7],
    housingFundBaseMin: 2740, housingFundBaseMax: 36921,
    minSalary: 2740,
  },
  {
    id: 'guangzhou', name: '广州', province: '广东省', tier: 1,
    companyRates: { pension: 0.14, medical: 0.06, unemployment: 0.008, injury: 0.002 },
    personalRates: { pension: 0.08, medical: 0.02, unemployment: 0.002 },
    socialBaseMin: 5510, socialBaseMax: 27549,
    housingFundRateRange: [5, 6, 7, 8, 9, 10, 11, 12],
    housingFundBaseMin: 2500, housingFundBaseMax: 39579,
    minSalary: 2500,
  },
  {
    id: 'shenzhen', name: '深圳', province: '广东省', tier: 1,
    companyRates: { pension: 0.14, medical: 0.06, unemployment: 0.007, injury: 0.0028 },
    personalRates: { pension: 0.08, medical: 0.02, unemployment: 0.003 },
    socialBaseMin: 6727, socialBaseMax: 33633,
    housingFundRateRange: [5, 6, 7, 8, 9, 10, 11, 12],
    housingFundBaseMin: 2520, housingFundBaseMax: 43659,
    minSalary: 2520,
  },
  {
    id: 'hangzhou', name: '杭州', province: '浙江省', tier: 2,
    companyRates: { pension: 0.16, medical: 0.095, unemployment: 0.005, injury: 0.002 },
    personalRates: { pension: 0.08, medical: 0.02, unemployment: 0.005 },
    socialBaseMin: 4986, socialBaseMax: 25299,
    housingFundRateRange: [5, 6, 7, 8, 9, 10, 11, 12],
    housingFundBaseMin: 2660, housingFundBaseMax: 38390,
    minSalary: 2660,
  },
  {
    id: 'nanjing', name: '南京', province: '江苏省', tier: 2,
    companyRates: { pension: 0.16, medical: 0.08, unemployment: 0.005, injury: 0.004 },
    personalRates: { pension: 0.08, medical: 0.02, unemployment: 0.005 },
    socialBaseMin: 4952, socialBaseMax: 24762,
    housingFundRateRange: [5, 6, 7, 8, 9, 10, 11, 12],
    housingFundBaseMin: 2660, housingFundBaseMax: 39900,
    minSalary: 2660,
  },
  {
    id: 'chengdu', name: '成都', province: '四川省', tier: 2,
    companyRates: { pension: 0.16, medical: 0.0675, unemployment: 0.006, injury: 0.002 },
    personalRates: { pension: 0.08, medical: 0.02, unemployment: 0.004 },
    socialBaseMin: 4588, socialBaseMax: 22938,
    housingFundRateRange: [5, 6, 7, 8, 9, 10, 11, 12],
    housingFundBaseMin: 2330, housingFundBaseMax: 31362,
    minSalary: 2330,
  },
  {
    id: 'wuhan', name: '武汉', province: '湖北省', tier: 2,
    companyRates: { pension: 0.16, medical: 0.08, unemployment: 0.007, injury: 0.005 },
    personalRates: { pension: 0.08, medical: 0.02, unemployment: 0.003 },
    socialBaseMin: 4498, socialBaseMax: 22488,
    housingFundRateRange: [5, 6, 7, 8, 9, 10, 11, 12],
    housingFundBaseMin: 2400, housingFundBaseMax: 33598,
    minSalary: 2400,
  },
  {
    id: 'suzhou', name: '苏州', province: '江苏省', tier: 2,
    companyRates: { pension: 0.16, medical: 0.07, unemployment: 0.005, injury: 0.004 },
    personalRates: { pension: 0.08, medical: 0.02, unemployment: 0.005 },
    socialBaseMin: 4952, socialBaseMax: 24762,
    housingFundRateRange: [5, 6, 7, 8, 9, 10, 11, 12],
    housingFundBaseMin: 2660, housingFundBaseMax: 33000,
    minSalary: 2660,
  },
  {
    id: 'xian', name: '西安', province: '陕西省', tier: 2,
    companyRates: { pension: 0.16, medical: 0.08, unemployment: 0.007, injury: 0.004 },
    personalRates: { pension: 0.08, medical: 0.02, unemployment: 0.003 },
    socialBaseMin: 4650, socialBaseMax: 23250,
    housingFundRateRange: [5, 6, 7, 8, 9, 10, 11, 12],
    housingFundBaseMin: 2376, housingFundBaseMax: 31761,
    minSalary: 2376,
  },
  {
    id: 'chongqing', name: '重庆', province: '重庆市', tier: 2,
    companyRates: { pension: 0.16, medical: 0.085, unemployment: 0.005, injury: 0.005 },
    personalRates: { pension: 0.08, medical: 0.02, unemployment: 0.005 },
    socialBaseMin: 4404, socialBaseMax: 22017,
    housingFundRateRange: [5, 6, 7, 8, 9, 10, 11, 12],
    housingFundBaseMin: 2330, housingFundBaseMax: 29362,
    minSalary: 2330,
  },
  {
    id: 'tianjin', name: '天津', province: '天津市', tier: 2,
    companyRates: { pension: 0.16, medical: 0.10, unemployment: 0.005, injury: 0.004 },
    personalRates: { pension: 0.08, medical: 0.02, unemployment: 0.005 },
    socialBaseMin: 5124, socialBaseMax: 25620,
    housingFundRateRange: [5, 6, 7, 8, 9, 10, 11, 12],
    housingFundBaseMin: 2510, housingFundBaseMax: 29730,
    minSalary: 2510,
  },
]

export function getCityById(id: string): CityConfig | undefined {
  return CITIES.find(c => c.id === id)
}

export const DEFAULT_CITY_ID = 'beijing'
