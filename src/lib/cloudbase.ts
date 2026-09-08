/**
 * CloudBase 数据库客户端
 *
 * 环境信息:
 * - envId: careooolv-d8gnyhzsnfe9e7356
 * - 集合: ecomflare_data (文档 ID: main)
 * - 权限: 公开读写 (CUSTOM, read/create/update/delete: true)
 * - 认证: 匿名登录
 *
 * 数据结构: { payload: { profiles, changes, payrollData } }
 * 部署域名: careooolv-d8gnyhzsnfe9e7356-1438923118.tcloudbaseapp.com (已在安全域名白名单)
 */

// @ts-expect-error - CloudBase SDK 没有完整的类型导出
import cloudbase from '@cloudbase/js-sdk'

const ENV_ID = 'careooolv-d8gnyhzsnfe9e7356'
const COLLECTION = 'ecomflare_data'
const DOC_ID = 'main'

let app: any = null
let db: any = null
let initPromise: Promise<void> | null = null

/** 初始化 CloudBase SDK + 匿名登录 (幂等，多次调用安全) */
async function ensureInit(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    app = cloudbase.init({ env: ENV_ID })
    const auth = app.auth({ persistence: 'local' })
    await auth.signInAnonymously()
    db = app.database()
  })()

  return initPromise
}

/** 读取云端数据 */
export async function readCloudData<T = any>(): Promise<T | null> {
  await ensureInit()
  const collection = db.collection(COLLECTION)
  try {
    const result = await collection.doc(DOC_ID).get()
    const doc = result.data?.[0]
    return doc?.payload ?? null
  } catch (err) {
    console.warn('[CloudBase] read failed, falling back:', err)
    return null
  }
}

/** 写入云端数据 (upsert) */
export async function writeCloudData(data: any): Promise<boolean> {
  await ensureInit()
  const collection = db.collection(COLLECTION)
  try {
    // 先尝试更新
    try {
      const updateRes = await collection.doc(DOC_ID).update({ payload: data })
      if (updateRes?.updated && updateRes.updated > 0) return true
    } catch {
      // 文档不存在，继续创建
    }
    // 创建新文档
    await collection.add({ _id: DOC_ID, payload: data })
    return true
  } catch (err) {
    console.warn('[CloudBase] write failed:', err)
    return false
  }
}

/** 同步写入 (用于 beforeunload，但 fetch 不能同步，这里做尽力而为) */
export async function flushCloudData(data: any): Promise<void> {
  try {
    await writeCloudData(data)
  } catch {
    // best effort
  }
}
