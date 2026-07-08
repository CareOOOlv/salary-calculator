# 工资社保个税计算器

一个面向杭州地区企业的工资、社保、个税一体化计算工具。支持多员工批量录入、五险一金计算、七级累进个税、专项附加扣除，并可导出 Excel 明细表。

## 功能

- **工资计算**：基本工资、现金补贴、专项附加扣除（子女教育、赡养老人、住房贷款等）
- **社保计算**：企业缴纳部分 + 个人缴纳部分（养老、医疗、失业、工伤、生育）
- **个税计算**：累计预扣法，七级超额累进税率
- **Excel 导出**：工资明细表 + 专项扣除明细表 + 社保明细表，三个 Sheet
- **动态员工管理**：随时增减员工，实时重算

## 技术栈

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- shadcn/ui 组件库
- SheetJS (xlsx) for Excel 导出

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── App.tsx                 # 主应用组件
├── main.tsx                # 入口
├── types.ts                # 类型定义
├── constants.ts            # 社保税率常量
├── calc.ts                 # 工资/社保/个税计算逻辑
├── export.ts               # Excel 导出逻辑
├── index.css               # 全局样式
└── components/
    ├── EmployeeCard.tsx     # 员工录入卡片
    ├── CostOverview.tsx     # 成本概览
    ├── SalaryTable.tsx      # 工资明细表
    ├── SocialTable.tsx      # 社保明细表
    ├── TaxTable.tsx         # 个税明细表
    └── ui/                  # shadcn/ui 基础组件
```

## 说明

- 社保缴费基数和比例基于杭州地区标准，如需用于其他城市请修改 `src/constants.ts`
- 个税采用累计预扣法，按月计算
- 本工具仅供参考，实际发放请以当地社保局和税务局规定为准

## License

MIT
