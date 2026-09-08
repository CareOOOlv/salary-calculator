import fs from 'fs'
import path from 'path'
import os from 'os'
import type { Plugin, Connect } from 'vite'

// 固定数据文件路径：这台电脑上所有浏览器共享
const DATA_DIR = path.join(os.homedir(), '.ecomflare')
const DATA_FILE = path.join(DATA_DIR, 'data.json')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readData() {
  try {
    ensureDir()
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
    }
  } catch (e) {
    console.error('[ecomflare] 读取数据失败:', e)
  }
  return { profiles: {}, changes: [], payrollData: {} }
}

function writeData(data: unknown) {
  ensureDir()
  const tmp = DATA_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
  fs.renameSync(tmp, DATA_FILE) // 原子写入，防止写一半崩溃
}

function parseBody(req: Connect.IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let body = ''
    req.on('data', (chunk: string) => { body += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch { resolve(null) }
    })
    req.on('error', () => resolve(null))
  })
}

export function ecomflareDataPlugin(): Plugin {
  return {
    name: 'ecomflare-data-api',
    configureServer(server) {
      server.middlewares.use('/api/data', async (req: Connect.IncomingMessage, res, next) => {
        // CORS：允许任何浏览器访问
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
        res.setHeader('Content-Type', 'application/json')

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method === 'GET') {
          const data = readData()
          res.end(JSON.stringify({ ...data, _source: 'disk', _path: DATA_FILE }))
          return
        }

        if (req.method === 'POST') {
          const data = await parseBody(req)
          if (!data) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: '无效的 JSON 数据' }))
            return
          }
          try {
            writeData(data)
            res.end(JSON.stringify({ ok: true, _path: DATA_FILE }))
          } catch (e: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: '写入失败: ' + e.message }))
          }
          return
        }

        next()
      })
    },
  }
}
