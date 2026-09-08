const tcb = require('@cloudbase/node-sdk')

const app = tcb.init({
  env: 'careooolv-d8gnyhzsnfe9e7356'
})

const db = app.database()
const collection = db.collection('ecomflare_data')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
}

exports.main = async (event, context) => {
  const method = event.httpMethod || 'GET'

  // Preflight
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  // GET → 读取数据
  if (method === 'GET') {
    try {
      const result = await collection.doc('main').get()
      const payload = result.data && result.data.length > 0 ? result.data[0].payload : null
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ ok: true, data: payload })
      }
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ ok: false, error: err.message || String(err) })
      }
    }
  }

  // POST → 写入数据（upsert）
  if (method === 'POST') {
    try {
      const body = JSON.parse(event.body || '{}')
      // 先尝试更新
      try {
        const updateRes = await collection.doc('main').update({ payload: body })
        if (!updateRes.updated || updateRes.updated === 0) {
          // 文档不存在，创建
          await collection.add({ _id: 'main', payload: body })
        }
      } catch (e) {
        // 更新失败（文档不存在等），尝试创建
        await collection.add({ _id: 'main', payload: body })
      }
      return {
        statusCode: 200,
        headers: CORS,
        body: JSON.stringify({ ok: true })
      }
    } catch (err) {
      return {
        statusCode: 500,
        headers: CORS,
        body: JSON.stringify({ ok: false, error: err.message || String(err) })
      }
    }
  }

  return {
    statusCode: 400,
    headers: CORS,
    body: JSON.stringify({ ok: false, error: 'Unknown method: ' + method })
  }
}
