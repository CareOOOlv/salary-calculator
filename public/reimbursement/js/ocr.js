/**
 * OCR 截图识别模块 — Tesseract.js 本地识别
 */

const OcrModule = (() => {
    let worker = null;
    let tesseractReady = false;

    // ---- 类目关键词 ----
    const CATEGORY_KEYWORDS = {
        '差旅': [
            '高铁', '火车', '动车', '机票', '航空', '航班', '飞机', '登机',
            '酒店', '住宿', '宾馆', '旅馆', '民宿', '出差', '行程', '列车',
            '车票', '船票', '长途', '客运', '签证', '护照', '行李',
            '携程', '去哪儿', '12306', 'booking',
        ],
        '交通补助': [
            '打车', '出租', '滴滴', '快车', '专车', '顺风车',
            '地铁', '公交', '公交车', '巴士', '停车', '加油',
            '过路', '高速', 'etc', '网约车', '骑行', '共享单车',
            '单车', '曹操', 'T3', '首汽', '花小猪',
        ],
        '招待费': [
            '招待', '宴请', '礼品', '客户', '接待', '送礼',
            '商务', '洽谈', '签约', '合作伙伴', '应酬',
        ],
        '餐补': [
            '餐', '饭', '食', '吃', '外卖', '食堂', '午餐', '晚餐',
            '早餐', '快餐', '便当', '盒饭', '餐厅', '饭店', '美团',
            '饿了么', '饿了吗',
        ],
        '采购垫资': [
            '采购', '垫资', '垫付', '代付', '预支', '采买',
            '购买', '购置', '订货', '进货', '办公用品', '耗材',
            '设备', '器材', '京东', '淘宝', '天猫', '拼多多',
            '发票', '订单', '商品', '物资', '材料', '物料',
        ],
    };

    // ---- 图片预处理（增强版，适配发票） ----
    function preprocessImage(imageSource) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let width = img.width, height = img.height;
                // 发票通常文字小，需要放大到至少 1500px 短边
                const minSide = Math.min(width, height);
                let scale = 1;
                if (minSide < 1500) scale = 1500 / minSide;
                else if (minSide > 3000) scale = 3000 / minSide;
                if (scale !== 1) {
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }

                canvas.width = width;
                canvas.height = height;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);

                // 发票增强：灰度化 + 对比度拉伸 + 自适应二值化
                const imgData = ctx.getImageData(0, 0, width, height);
                const data = imgData.data;
                const w = width, h = height;

                // 第一步：灰度化 + 轻微对比度增强
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i+1], b = data[i+2];
                    // 红色发票文字权重高
                    let gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    // 对比度增强 (factor ~1.5)
                    gray = ((gray - 128) * 1.5) + 128;
                    gray = Math.max(0, Math.min(255, gray));
                    data[i] = data[i+1] = data[i+2] = gray;
                }

                // 第二步：自适应二值化（Otsu 简化版 + 局部阈值）
                // 先计算全局阈值
                let hist = new Array(256).fill(0);
                for (let i = 0; i < data.length; i += 4) {
                    hist[data[i]]++;
                }
                let total = w * h;
                let sum = 0;
                for (let t = 0; t < 256; t++) sum += t * hist[t];
                let sumB = 0, wB = 0, wF = 0;
                let maxVar = 0, otsuTh = 128;
                for (let t = 0; t < 256; t++) {
                    wB += hist[t];
                    if (wB === 0) continue;
                    wF = total - wB;
                    if (wF === 0) break;
                    sumB += t * hist[t];
                    let mB = sumB / wB;
                    let mF = (sum - sumB) / wF;
                    let betweenVar = wB * wF * (mB - mF) * (mB - mF);
                    if (betweenVar > maxVar) {
                        maxVar = betweenVar;
                        otsuTh = t;
                    }
                }
                // 局部微调：让阈值偏向白（发票背景是白色），文字偏黑
                const threshold = Math.min(otsuTh + 15, 200);

                for (let i = 0; i < data.length; i += 4) {
                    const v = data[i];
                    const val = v < threshold ? 0 : 255;
                    data[i] = data[i+1] = data[i+2] = val;
                }

                ctx.putImageData(imgData, 0, 0);
                // 小幅度锐化
                ctx.globalCompositeOperation = 'source-over';
                ctx.filter = 'contrast(1.2) brightness(1.05)';
                ctx.drawImage(canvas, 0, 0, width, height, 0, 0, width, height);
                ctx.filter = 'none';

                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;

            if (typeof imageSource === 'string') {
                img.src = imageSource;
            } else if (imageSource instanceof Blob || imageSource instanceof File) {
                const url = URL.createObjectURL(imageSource);
                img.src = url;
                img._objectUrl = url;
            } else {
                reject(new Error('不支持的图片格式'));
            }
        });
    }

    // ---- 发票专用解析增强 ----
    const INVOICE_KEYWORDS = [
        '价税合计', '合计金额', '合计', '总计', '总金额', '开票金额',
        '金额', '小写', '¥', '￥', '合计(小写)', '合计（小写）',
    ];

    // 常见发票类目映射（从文字到报销类目）
    function inferInvoiceCategory(text) {
        const t = text.toLowerCase();
        if (/高铁|动车|火车|机票|航班|航空|酒店|住宿|宾馆|出差|携程|行程/.test(t)) return '差旅费';
        if (/打车|出租|滴滴|地铁|公交|停车|加油|高速|过路|ETC|网约车/.test(t)) return '交通费';
        if (/餐|饭|食|外卖|食堂|餐厅|饭店|美团|饿了么|餐饮/.test(t)) return '餐费';
        if (/招待|宴请|客户|接待|商务|应酬|礼品/.test(t)) return '招待费';
        if (/办公|耗材|文具|打印|复印|纸|笔|墨盒|硒鼓/.test(t)) return '办公用品';
        if (/采购|购买|购置|垫付|京东|淘宝|天猫|拼多多|亚马逊|采买/.test(t)) return '采购垫资';
        return '其他';
    }

    function isInvoiceAmountLine(line) {
        // 发票的合计行通常包含这些关键词 + 金额
        const invoiceKws = /(?:价税合计|合计金额|合计|总计|总金额|开票金额|小写|金额)/;
        const hasAmount = /[¥￥]\s*\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/.test(line) || /\d{1,3}(?:,\d{3})*(?:\.\d{1,2})\s*元/.test(line);
        return invoiceKws.test(line) && hasAmount;
    }

    function extractInvoiceAmount(text) {
        // 1. 优先匹配 "价税合计" 或 "合计" 后面的金额
        const totalPatterns = [
            /(?:价税合计|合计金额|合计|总计|总金额|开票金额|小写|金额)[（(]?[大小]?写?[）)]?[:：\s]*[¥￥]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/i,
            /[¥￥]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:元|￥)?/,
            /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2}))\s*(?:元|￥)/,
        ];
        for (const p of totalPatterns) {
            const m = text.match(p);
            if (m) {
                const amount = parseFloat(m[1].replace(/,/g, ''));
                if (amount > 0 && amount <= 10000000) return amount;
            }
        }
        // 2. 兜底：找文本中所有金额，取最大的（通常发票的最大金额就是合计）
        const allAmounts = text.match(/[¥￥]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2}))/g) || [];
        let maxAmount = 0;
        for (const am of allAmounts) {
            const num = parseFloat(am.replace(/[¥￥\s,]/g, ''));
            if (num > maxAmount && num > 0 && num <= 10000000) maxAmount = num;
        }
        return maxAmount > 0 ? maxAmount : null;
    }

    function extractInvoiceDescription(text) {
        // 尝试提取发票的商品/服务名称（项目、货物/劳务等后面）
        const descPatterns = [
            /(?:项目|货物|劳务|服务|名称)[：:\s]*([^\n\r]{2,40})/,
            /(?:商品|产品)[：:\s]*([^\n\r]{2,40})/,
        ];
        for (const p of descPatterns) {
            const m = text.match(p);
            if (m && m[1] && m[1].trim().length >= 2) {
                return m[1].trim().replace(/[（(][大小小]?写[）)]/g, '').replace(/\s+/g, '');
            }
        }
        return null;
    }

    function postProcessOcrText(text) {
        return text
            .replace(/([0-9])\s*[Oo]\s*([0-9])/g, '$10$2')
            .replace(/[¥￥]/g, '¥')
            .replace(/[（(]\s*小\s*写\s*[）)]/g, '（小写）')
            .replace(/[（(]\s*大\s*写\s*[）)]/g, '（大写）')
            .split('\n')
            .map(line => line.replace(/^[-+~·.。,，;；:\s\u3000]+|[-+~·.。,，;；:\s\u3000]+$/g, '').trim())
            .filter(line => line.length > 0)
            .join('\n');
    }

    // ---- Tesseract 引擎 ----
    async function initTesseract(onProgress) {
        if (tesseractReady && worker) return;
        onProgress && onProgress(0, '下载 Tesseract 引擎...');
        try {
            worker = await Tesseract.createWorker(['chi_sim', 'eng'], 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        onProgress && onProgress(Math.round(m.progress * 100), '本地识别中...');
                    } else if (m.status === 'loading language traineddata') {
                        onProgress && onProgress(Math.round(m.progress * 100), '下载语言包...');
                    }
                },
            });
            tesseractReady = true;
        } catch (err) {
            console.error('Tesseract 初始化失败:', err);
            throw new Error('离线 OCR 引擎加载失败，请检查网络后重试');
        }
    }

    // ---- 主识别 ----
    async function recognize(imageSource, onProgress) {
        if (!tesseractReady || !worker) {
            await initTesseract(onProgress);
        }

        let src = imageSource;
        if (imageSource instanceof Blob || imageSource instanceof File) {
            src = URL.createObjectURL(imageSource);
        }

        try {
            onProgress && onProgress(5, '优化图片...');
            const processed = await preprocessImage(src);

            const { data } = await worker.recognize(processed);
            const rawText = data.text || '';
            const text = postProcessOcrText(rawText);

            onProgress && onProgress(100, '识别完成');
            const entries = parseOcrText(text);
            return { text, entries, provider: 'tesseract' };
        } catch (err) {
            console.error('Tesseract 识别失败:', err);
            throw new Error('离线识别失败，请重试或手动录入');
        } finally {
            if (imageSource instanceof Blob || imageSource instanceof File) {
                URL.revokeObjectURL(src);
            }
        }
    }

    // ---- 文本解析（发票专用增强） ----

    // 发票通常只有一条核心记录：价税合计金额
    function parseInvoiceText(text) {
        const entries = [];
        // 1. 先尝试提取"价税合计"或"合计"后面的金额
        const amount = extractInvoiceAmount(text);
        if (!amount) return entries;
        // 2. 提取摘要描述
        let description = extractInvoiceDescription(text);
        if (!description) description = inferInvoiceDescription(text);
        if (!description) description = '发票未识别明细';
        // 3. 判断类目
        const category = inferInvoiceCategory(text + ' ' + description);
        entries.push({ amount, description, category, rawLine: description + ' ¥' + amount.toFixed(2) });
        return entries;
    }

    function inferInvoiceDescription(text) {
        if (/增值税.*发票|电子发票/.test(text)) return '增值税电子发票';
        if (/出租车/.test(text)) return '出租车发票';
        if (/滴滴|打车|网约车/.test(text)) return '网约车出行';
        if (/高铁|动车|火车/.test(text)) return '火车票';
        if (/机票|航空|航班/.test(text)) return '机票';
        if (/酒店|住宿|宾馆/.test(text)) return '住宿费';
        if (/餐饮|餐费|饭店|餐厅|美团|饿了么/.test(text)) return '餐饮费';
        if (/加油|停车|高速|过路/.test(text)) return '交通费';
        if (/办公|文具|耗材/.test(text)) return '办公用品';
        if (/采购|购买|商品/.test(text)) return '采购垫资';
        return '发票费用';
    }

    function isSummaryLine(line) {
        const summaryKeywords = /(?:支出|收入|结余|合计|总计|汇总|累计|总额|总金额|共\s*[¥￥]|总\s*[¥￥]|共\d)/;
        if (summaryKeywords.test(line)) return true;

        const amounts = line.match(/[¥￥-]?\s*\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?/g) || [];
        if (amounts.length >= 2 && /(?:支出|收入|结余|合计|总计|汇总|累计|共)/.test(line)) {
            return true;
        }
        return false;
    }

    function suggestCategory(text) {
        const lower = text.toLowerCase();
        let bestCategory = '采购垫资';
        let bestScore = 0;
        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            let score = 0;
            for (const kw of keywords) {
                if (lower.includes(kw)) score++;
            }
            if (score > bestScore) {
                bestScore = score;
                bestCategory = category;
            }
        }
        return bestCategory;
    }

    function extractAmount(line) {
        const patterns = [
            /[¥￥]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
            /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2}))\s*元/,
            /金额[：:]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
            /合计[：:]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
            /小写[：:]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
            /实付[：:]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
            /收款[：:]\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/,
            /^[^\d\-+]?(\d+\.\d{2})\s*$/,
            /(\d+\.\d{2})/,
        ];
        for (const pattern of patterns) {
            const m = line.match(pattern);
            if (m) {
                const amount = parseFloat(m[1].replace(/,/g, ''));
                if (amount >= 0.01 && amount <= 1000000) {
                    return { amount, matchText: m[0], start: m.index };
                }
            }
        }
        return null;
    }

    function parseOcrText(text) {
        // 优先用发票模式解析（从整段文本提取价税合计）
        const invoiceEntries = parseInvoiceText(text);
        if (invoiceEntries.length > 0) {
            return invoiceEntries;
        }
        // 兜底：按行解析（旧逻辑，适配小票/账单）
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const entries = [];
        const seenKeys = new Set();

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (/^[-+\s.]+$/.test(line)) continue;

            // 跳过汇总行 / 合计行
            if (isSummaryLine(line)) continue;

            const extracted = extractAmount(line);
            if (!extracted) continue;

            const { amount, matchText, start } = extracted;

            // 跳过超长粘连数字
            const rawDigits = matchText.replace(/[,.\s]/g, '');
            if (rawDigits.length >= 9 && !matchText.includes('.')) continue;

            // 取金额左侧文字作为描述
            let description = line.substring(0, start)
                .replace(/[¥￥:：合计小写金额实付收款\s\u3000]+/g, '')
                .trim();

            if (!description && i > 0) {
                description = lines[i - 1]
                    .replace(/[¥￥:：\s\u3000]+/g, '')
                    .trim();
            }

            if (!description) {
                description = line.replace(matchText, '').trim();
            }

            if (!description) description = '未识别项目';
            if (description.length > 50) description = description.substring(0, 50);

            const category = suggestCategory(description + ' ' + line);
            const key = `${description}_${amount.toFixed(2)}`;
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);

            entries.push({ amount, description, category, rawLine: line });
        }
        return entries;
    }

    // ---- PDF 识别 ----
    async function recognizePDF(file, onProgress) {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF 引擎未加载，请刷新页面后重试');
        }

        // 初始化 Tesseract（如果还没加载）
        if (!tesseractReady || !worker) {
            await initTesseract((pct, status) => {
                onProgress && onProgress(Math.round(pct * 0.2), status);
            });
        }

        // 设置 PDF.js worker
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        let allText = '';
        let allEntries = [];

        // 逐页渲染 + OCR
        for (let i = 1; i <= numPages; i++) {
            const baseProgress = Math.round((i - 1) / numPages * 85);
            onProgress && onProgress(baseProgress, `渲染第 ${i}/${numPages} 页...`);

            const page = await pdf.getPage(i);
            // 2x scale 保证 OCR 精度
            const viewport = page.getViewport({ scale: 2.0 });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            await page.render({ canvasContext: ctx, viewport }).promise;

            // OCR 识别当前页
            onProgress && onProgress(baseProgress + 2, `识别第 ${i}/${numPages} 页...`);
            try {
                const { data } = await worker.recognize(canvas);
                const pageText = postProcessOcrText(data.text || '');
                const pageEntries = parseOcrText(pageText);

                if (pageText) {
                    allText += (allText ? '\n' : '') + `--- 第 ${i} 页 ---\n` + pageText;
                }
                allEntries.push(...pageEntries);
            } catch (pageErr) {
                console.warn(`PDF 第 ${i} 页识别失败，已跳过:`, pageErr);
            }
        }

        // 跨页去重
        const seen = new Set();
        const unique = allEntries.filter(e => {
            const key = `${e.description}_${e.amount.toFixed(2)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        onProgress && onProgress(100, '识别完成');
        return { text: allText.trim(), entries: unique, provider: 'tesseract+pdf', pageCount: numPages };
    }

    // ---- 渲染 PDF 第一页为预览图 ----
    async function renderPDFPreview(file) {
        if (typeof pdfjsLib === 'undefined') return null;

        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');

            await page.render({ canvasContext: ctx, viewport }).promise;
            return canvas.toDataURL('image/png');
        } catch (err) {
            console.warn('PDF 预览渲染失败:', err);
            return null;
        }
    }

    async function terminate() {
        if (worker) {
            try { await worker.terminate(); } catch (e) { /* ignore */ }
            worker = null;
            tesseractReady = false;
        }
    }

    return {
        recognize,
        recognizePDF,
        renderPDFPreview,
        parseOcrText,
        parseInvoiceText,
        extractInvoiceAmount,
        inferInvoiceCategory,
        inferInvoiceDescription,
        suggestCategory,
        terminate,
    };
})();
