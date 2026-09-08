/**
 * 报销单生成工具 - 主应用逻辑
 * 财务合规版本：聚焦发票录入、OCR识别、预览导出
 */

const App = (() => {
    // ---- 状态 ----
    const state = {
        reimburser: '',
        department: '',
        date: '',
        items: [], // 报销明细 [{id, category, description, amount}]
        ocrResults: [], // OCR 识别到的建议条目
        nextId: 1,
    };

    // 类目选项（财务常用）
    const CATEGORIES = ['差旅费', '交通费', '招待费', '餐费', '办公用品', '采购垫资', '其他'];

    // ---- 初始化 ----
    function init() {
        setDefaultDate();
        bindEvents();
        addNewRow();
        renderTable();
    }

    function setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('reimburseDate').value = today;
        state.date = today;
    }

    // ---- 事件绑定 ----
    function bindEvents() {
        document.getElementById('reimburseName').addEventListener('input', (e) => {
            state.reimburser = e.target.value.trim();
        });
        document.getElementById('reimburseDept').addEventListener('input', (e) => {
            state.department = e.target.value.trim();
        });
        document.getElementById('reimburseDate').addEventListener('change', (e) => {
            state.date = e.target.value;
        });

        document.getElementById('btnAddRow').addEventListener('click', () => {
            addNewRow();
            renderTable();
        });

        document.getElementById('btnClearAll').addEventListener('click', () => {
            if (state.items.length === 0) return;
            if (confirm('确认清空所有报销明细？')) {
                state.items = [];
                state.nextId = 1;
                addNewRow();
                renderTable();
                updateSummary();
            }
        });

        document.getElementById('btnMergeRows').addEventListener('click', mergeSelectedRows);

        document.getElementById('btnPreview').addEventListener('click', () => {
            syncTableData();
            if (!validateBeforePreview()) return;
            showPreview();
        });

        document.getElementById('btnClosePreview').addEventListener('click', closePreview);
        document.getElementById('btnClosePreviewBottom').addEventListener('click', closePreview);
        document.getElementById('previewOverlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closePreview();
        });

        document.getElementById('btnDownloadPdf').addEventListener('click', () => {
            const titleEl = document.getElementById('previewReimburser');
            const dateEl = document.getElementById('previewDate');
            const savedTitle = document.title;
            document.title = `${titleEl?.textContent || '未命名'}_${dateEl?.textContent || ''}【报销单】`;
            window.print();
            setTimeout(() => { document.title = savedTitle; }, 100);
        });
        document.getElementById('btnDownloadExcel').addEventListener('click', () => {
            const validItems = state.items.filter(i => parseFloat(i.amount) > 0);
            if (validItems.length === 0) { alert('请先添加报销明细'); return; }
            ExportModule.exportToExcel({
                reimburser: state.reimburser,
                department: state.department,
                date: state.date,
                items: validItems.map(i => ({
                    category: i.category,
                    description: i.description,
                    amount: parseFloat(i.amount) || 0,
                })),
            });
        });
        document.getElementById('btnPrint').addEventListener('click', () => {
            const titleEl = document.getElementById('previewReimburser');
            const dateEl = document.getElementById('previewDate');
            const savedTitle = document.title;
            document.title = `${titleEl?.textContent || '未命名'}_${dateEl?.textContent || ''}【报销单】`;
            window.print();
            setTimeout(() => { document.title = savedTitle; }, 100);
        });

        bindUploadEvents();
    }

    function bindUploadEvents() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        let dragCounter = 0;

        uploadArea.addEventListener('click', (e) => { if (e.target !== fileInput) fileInput.click(); });
        fileInput.addEventListener('change', handleFileSelect);

        uploadArea.addEventListener('dragenter', (e) => { e.preventDefault(); dragCounter++; uploadArea.classList.add('drag-over'); });
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; uploadArea.classList.add('drag-over'); });
        uploadArea.addEventListener('dragleave', () => { dragCounter--; if (dragCounter <= 0) { dragCounter = 0; uploadArea.classList.remove('drag-over'); } });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            uploadArea.classList.remove('drag-over');
            const file = e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) { processImage(file); return; }
            const items = e.dataTransfer.items;
            if (items) {
                for (const item of items) {
                    if (item.kind === 'file') { const f = item.getAsFile(); if (f) processImage(f); return; }
                    if (item.kind === 'string' && item.type === 'text/uri-list') {
                        item.getAsString((url) => { if (url) fetchImageFromUrl(url); });
                        return;
                    }
                }
            }
            showToast('未检测到可识别的图片或 PDF 文件', 'error');
        });

        document.getElementById('btnApplyOcr').addEventListener('click', applyOcrResults);
        document.getElementById('ocrSelectAll').addEventListener('change', (e) => {
            const checked = e.target.checked;
            document.querySelectorAll('.ocr-select-item').forEach(cb => { cb.checked = checked; });
            document.querySelectorAll('.ocr-result-row').forEach(row => { row.classList.toggle('selected', checked); });
        });
    }

    // ---- 表格数据管理 ----
    function addNewRow() {
        state.items.push({ id: state.nextId++, category: '差旅费', description: '', amount: '' });
    }

    function removeRow(id) {
        const index = state.items.findIndex(item => item.id === id);
        if (index !== -1) state.items.splice(index, 1);
        if (state.items.length === 0) addNewRow();
        renderTable();
        updateSummary();
    }

    function syncTableData() {
        const rows = document.querySelectorAll('#expenseTableBody tr');
        state.items = [];
        rows.forEach((row) => {
            const select = row.querySelector('.cat-select');
            const descInput = row.querySelector('.desc-input');
            const amountInput = row.querySelector('.amount-input');
            const id = parseInt(row.dataset.id, 10);
            const description = descInput ? descInput.value.trim() : '';
            const amountStr = amountInput ? amountInput.value.trim() : '';
            const amount = parseFloat(amountStr);
            if (description || !isNaN(amount)) {
                state.items.push({ id, category: select ? select.value : '差旅费', description, amount: isNaN(amount) ? 0 : amount });
            }
        });
        if (state.items.length === 0) { state.nextId = 1; addNewRow(); renderTable(); }
    }

    function updateSummary() {
        const validItems = state.items.filter(i => parseFloat(i.amount) > 0);
        const total = validItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
        const summaryDiv = document.getElementById('summarySection');
        if (validItems.length > 0) {
            summaryDiv.innerHTML = `<div class="summary-row"><div><div class="total-label">报销合计</div><div class="total-cn">${CurrencyCN.toChinese(total)}</div></div><div class="total-amount">¥ ${total.toFixed(2)}</div></div>`;
            summaryDiv.style.display = 'block';
        } else {
            summaryDiv.style.display = 'none';
        }
    }

    // ---- 表格渲染 ----
    function renderTable() {
        const tbody = document.getElementById('expenseTableBody');
        if (state.items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-icon">📋</div><p>暂无报销明细，点击"添加一行"或上传发票截图自动识别</p></div></td></tr>`;
            return;
        }
        tbody.innerHTML = state.items.map((item, index) => `
            <tr data-id="${item.id}">
                <td class="merge-cell"><input type="checkbox" class="merge-select-item" data-id="${item.id}" onchange="App.onMergeCheckChange()"></td>
                <td class="seq-cell">${index + 1}</td>
                <td><select class="cat-select" onchange="App.updateItem(${item.id}, 'category', this.value)">${CATEGORIES.map(cat => `<option value="${cat}" ${item.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}</select></td>
                <td><input type="text" class="desc-input" placeholder="如：北京-上海高铁二等座" value="${escapeHtml(item.description)}" onchange="App.updateItem(${item.id}, 'description', this.value)" oninput="App.updateItem(${item.id}, 'description', this.value)"></td>
                <td><input type="text" class="amount-input" placeholder="0.00" value="${item.amount}" onchange="App.updateItem(${item.id}, 'amount', this.value); App.updateSummary();" oninput="App.handleAmountInput(this, ${item.id}); App.updateSummary();"></td>
                <td class="action-cell"><button class="btn-del-row" onclick="App.removeRow(${item.id})" title="删除此行">✕</button></td>
            </tr>
        `).join('');
        updateSummary();
    }

    function updateItem(id, field, value) {
        const item = state.items.find(i => i.id === id);
        if (item) item[field] = field === 'amount' ? (value === '' ? '' : parseFloat(value) || 0) : value;
    }

    function handleAmountInput(inputEl, id) {
        let value = inputEl.value.replace(/[^\d.]/g, '');
        const dotIndex = value.indexOf('.');
        if (dotIndex !== -1) { value = value.substring(0, dotIndex + 1) + value.substring(dotIndex + 1).replace(/\./g, ''); if (value.length - dotIndex > 3) value = value.substring(0, dotIndex + 3); }
        inputEl.value = value;
        updateItem(id, 'amount', value);
    }

    // ---- 合并行 ----
    function getSelectedRowIds() { return Array.from(document.querySelectorAll('.merge-select-item:checked')).map(cb => parseInt(cb.dataset.id, 10)); }
    function onMergeCheckChange() { syncTableData(); updateMergeButton(); }
    function toggleSelectAll(checked) { document.querySelectorAll('.merge-select-item').forEach(cb => { cb.checked = checked; }); syncTableData(); updateMergeButton(); }
    function updateMergeButton() { document.getElementById('btnMergeRows').disabled = getSelectedRowIds().length < 2; }

    function mergeSelectedRows() {
        syncTableData();
        const selectedIds = getSelectedRowIds();
        if (selectedIds.length < 2) { showToast('请至少选择两行进行合并', 'error'); return; }
        const selectedItems = state.items.filter(i => selectedIds.includes(i.id));
        const mergedAmount = selectedItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
        const descriptions = selectedItems.map(i => i.description).filter(Boolean);
        const mergedDescription = [...new Set(descriptions)].join('；');
        const mergedItem = { id: state.nextId++, category: selectedItems[0].category, description: mergedDescription, amount: mergedAmount };
        state.items = state.items.filter(i => !selectedIds.includes(i.id));
        state.items.push(mergedItem);
        renderTable();
        updateSummary();
        showToast(`已将 ${selectedIds.length} 行合并为 1 行`, 'success');
    }

    // ---- OCR 识别 ----
    function handleFileSelect(e) { const file = e.target.files[0]; if (file) processImage(file); e.target.value = ''; }

    async function fetchImageFromUrl(url) {
        try {
            const resp = await fetch(url); const blob = await resp.blob();
            const blobType = blob.type;
            if (!blobType.match(/^(image\/(jpeg|png|webp|bmp|gif)|application\/pdf)$/)) {
                showToast('拖拽内容不是图片或 PDF', 'error'); return;
            }
            const ext = blobType === 'application/pdf' ? '.pdf' : '.png';
            processImage(new File([blob], 'dropped-file' + ext, { type: blobType }));
        } catch (err) { showToast('无法读取拖拽的文件', 'error'); }
    }

    async function processImage(file) {
        // 判断文件类型
        const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        const isImage = file.type.match(/^image\/(jpeg|png|webp|bmp|gif)$/);

        if (!isImage && !isPDF) {
            showToast('请上传 JPG、PNG、WebP、BMP 或 PDF 格式的文件', 'error'); return;
        }
        if (file.size > 20 * 1024 * 1024) { showToast('文件不能超过 20MB', 'error'); return; }

        const preview = document.getElementById('imagePreview');

        // 渲染预览图
        if (isPDF) {
            preview.src = '';
            preview.classList.add('active');
            preview.alt = 'PDF 预览加载中...';
            OcrModule.renderPDFPreview(file).then(dataUrl => {
                if (dataUrl) {
                    preview.src = dataUrl;
                    preview.alt = 'PDF 发票预览';
                } else {
                    preview.classList.remove('active');
                }
            });
        } else {
            preview.src = URL.createObjectURL(file);
            preview.classList.add('active');
            preview.alt = '截图预览';
        }

        const progressDiv = document.getElementById('ocrProgress');
        const progressBar = document.getElementById('progressBarFill');
        const progressText = document.getElementById('progressText');
        progressDiv.classList.add('active');
        progressBar.style.width = '0%';
        progressText.textContent = isPDF ? '加载 PDF...' : '准备识别...';
        document.getElementById('ocrResults').classList.remove('active');

        try {
            let result;
            if (isPDF) {
                result = await OcrModule.recognizePDF(file, (percent, status) => {
                    progressBar.style.width = percent + '%';
                    progressText.textContent = `${status} ${percent}%`;
                });
            } else {
                result = await OcrModule.recognize(file, (percent, status) => {
                    progressBar.style.width = percent + '%';
                    progressText.textContent = `${status} ${percent}%`;
                });
            }
            state.ocrResults = result.entries;
            progressDiv.classList.remove('active');
            if (result.entries.length === 0) {
                const hint = isPDF ? '未能从 PDF 中识别到金额信息，请手动录入或核对' : '未能从图片中识别到金额信息，请手动录入或核对';
                showToast(hint, 'error');
                showOcrRawText(result.text, true);
            } else {
                // PDF 多页提示
                if (isPDF && result.pageCount && result.pageCount > 1) {
                    showToast(`已识别 PDF 共 ${result.pageCount} 页，找到 ${result.entries.length} 条记录`, 'success');
                }
                showOcrResults(result.entries);
            }
        } catch (err) {
            progressDiv.classList.remove('active');
            showToast(err.message || 'OCR 识别失败', 'error');
            console.error(err);
        }
    }

    function showOcrResults(entries) {
        const resultsDiv = document.getElementById('ocrResults');
        resultsDiv.innerHTML = '';
        const header = resultsDiv.querySelector('.ocr-results-header')?.cloneNode(true) || document.createElement('div');
        header.className = 'ocr-results-header';
        header.innerHTML = '<span class="title">识别到以下报销条目</span><label style="font-size:0.8125rem;cursor:pointer;display:flex;align-items:center;gap:4px;"><input type="checkbox" id="ocrSelectAll" checked> 全选</label>';
        resultsDiv.appendChild(header);
        const table = document.createElement('table'); table.className = 'ocr-results-table';
        table.innerHTML = '<thead><tr><th style="width:40px;">选择</th><th style="width:130px;">类目（可修改）</th><th>摘要</th><th style="width:110px;">金额</th></tr></thead><tbody id="ocrResultsBody"></tbody>';
        resultsDiv.appendChild(table);
        const footer = document.createElement('div'); footer.className = 'ocr-footer';
        footer.innerHTML = '<button class="btn btn-primary" id="btnApplyOcrNew">应用到报销明细</button><button class="btn btn-outline" onclick="document.getElementById(\'ocrResults\').classList.remove(\'active\')">取消</button>';
        resultsDiv.appendChild(footer);

        const tbody = table.querySelector('tbody');
        tbody.innerHTML = entries.map((entry, index) => `
            <tr class="ocr-result-row selected">
                <td><input type="checkbox" class="ocr-select-item" checked><input type="hidden" class="ocr-index" value="${index}"></td>
                <td><select class="ocr-cat-select" onchange="App.onOcrCatChange(${index}, this.value)">${CATEGORIES.map(cat => `<option value="${cat}" ${entry.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}</select></td>
                <td><input type="text" class="ocr-desc-input" value="${escapeHtml(entry.description)}" oninput="App.onOcrDescChange(${index}, this.value)"></td>
                <td><input type="text" class="ocr-amount-input" value="${entry.amount.toFixed(2)}" oninput="App.onOcrAmountInput(this); App.onOcrAmountChange(${index}, this.value)"></td>
            </tr>
        `).join('');
        resultsDiv.classList.add('active');

        document.getElementById('btnApplyOcrNew').addEventListener('click', applyOcrResults);
        document.getElementById('ocrSelectAll').addEventListener('change', (e) => {
            tbody.querySelectorAll('.ocr-select-item').forEach(cb => { cb.checked = e.target.checked; });
            tbody.querySelectorAll('.ocr-result-row').forEach(row => { row.classList.toggle('selected', e.target.checked); });
        });

        tbody.querySelectorAll('.ocr-result-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
                const cb = row.querySelector('.ocr-select-item'); cb.checked = !cb.checked; row.classList.toggle('selected', cb.checked);
            });
        });
        showToast(`识别到 ${entries.length} 条记录，确认后应用到报销明细`, 'success');
    }

    function onOcrDescChange(index, newDesc) { if (state.ocrResults[index]) state.ocrResults[index].description = newDesc; }
    function onOcrAmountInput(input) {
        let value = input.value.replace(/[^\d.]/g, '');
        const dotIndex = value.indexOf('.');
        if (dotIndex !== -1) { value = value.substring(0, dotIndex + 1) + value.substring(dotIndex + 1).replace(/\./g, ''); if (value.length - dotIndex > 3) value = value.substring(0, dotIndex + 3); }
        input.value = value;
    }
    function onOcrAmountChange(index, value) { if (state.ocrResults[index]) state.ocrResults[index].amount = parseFloat(value) || 0; }
    function onOcrCatChange(index, newCat) { if (state.ocrResults[index]) state.ocrResults[index].category = newCat; }

    function showOcrRawText(text, isInvoice = false) {
        const resultsDiv = document.getElementById('ocrResults');
        resultsDiv.innerHTML = `
            <div class="ocr-results-header"><span class="title">识别到的原始文本（OCR 未提取到金额，请手动录入或核对）</span></div>
            <table class="ocr-results-table">
                <tbody>
                    <tr><td colspan="4" style="padding:16px;"><pre style="white-space:pre-wrap;font-size:0.75rem;color:#64748b;background:#f8fafc;padding:12px;border-radius:6px;">${escapeHtml(text)}</pre></td></tr>
                </tbody>
            </table>
            <div style="padding:16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin:12px 16px;">
                <div style="font-weight:600;color:#0369a1;margin-bottom:12px;font-size:0.875rem;">
                    ${isInvoice ? '💡 发票识别失败？手动录入金额，一键添加' : '💡 手动录入金额'}
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;">
                    <div style="flex:1;min-width:120px;">
                        <label style="display:block;font-size:0.75rem;color:#475569;margin-bottom:4px;">金额（元）</label>
                        <input type="text" id="manualAmount" placeholder="如 128.50" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.875rem;box-sizing:border-box;">
                    </div>
                    <div style="flex:2;min-width:180px;">
                        <label style="display:block;font-size:0.75rem;color:#475569;margin-bottom:4px;">摘要/发票类型</label>
                        <input type="text" id="manualDesc" placeholder="如 增值税电子发票" value="${isInvoice ? '增值税电子发票' : ''}" style="width:100%;padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.875rem;box-sizing:border-box;">
                    </div>
                    <div>
                        <label style="display:block;font-size:0.75rem;color:#475569;margin-bottom:4px;">类目</label>
                        <select id="manualCategory" style="padding:8px 10px;border:1px solid #cbd5e1;border-radius:6px;font-size:0.875rem;background:#fff;">
                            ${CATEGORIES.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                    <button onclick="App.addManualEntry()" style="padding:8px 16px;background:#0284c7;color:#fff;border:none;border-radius:6px;font-size:0.875rem;cursor:pointer;white-space:nowrap;">添加到报销明细</button>
                </div>
            </div>
        `;
        resultsDiv.classList.add('active');
    }

    function addManualEntry() {
        const amountStr = document.getElementById('manualAmount').value.trim().replace(/,/g, '');
        const desc = document.getElementById('manualDesc').value.trim() || '发票费用';
        const category = document.getElementById('manualCategory').value;
        const amount = parseFloat(amountStr);
        if (!amountStr || isNaN(amount) || amount <= 0) {
            showToast('请输入有效的金额', 'error');
            document.getElementById('manualAmount').focus();
            return;
        }
        state.items.push({ id: state.nextId++, category, description: desc, amount });
        renderTable();
        updateSummary();
        document.getElementById('ocrResults').classList.remove('active');
        showToast(`已添加 "${desc}" ¥${amount.toFixed(2)} 到报销明细`, 'success');
    }

    function applyOcrResults() {
        if (state.ocrResults.length === 0) return;
        const checkboxes = document.querySelectorAll('.ocr-select-item');
        let addedCount = 0;
        checkboxes.forEach((cb) => {
            if (cb.checked) {
                const index = parseInt(cb.closest('tr').querySelector('.ocr-index').value, 10);
                const entry = state.ocrResults[index];
                if (entry) {
                    state.items.push({ id: state.nextId++, category: entry.category, description: entry.description, amount: entry.amount });
                    addedCount++;
                }
            }
        });
        if (addedCount === 0) { showToast('请至少选择一条记录', 'error'); return; }
        renderTable();
        updateSummary();
        document.getElementById('ocrResults').classList.remove('active');
        state.ocrResults = [];
        showToast(`已应用 ${addedCount} 条记录到报销明细`, 'success');
    }

    // ---- 验证 ----
    function validateBeforePreview() {
        syncTableData();
        if (!state.reimburser) { showToast('请填写报销人姓名', 'error'); document.getElementById('reimburseName').focus(); return false; }
        const validItems = state.items.filter(i => parseFloat(i.amount) > 0);
        if (validItems.length === 0) { showToast('请至少添加一条有效的报销明细', 'error'); return false; }
        return true;
    }

    // ---- 预览 ----
    function showPreview() {
        const validItems = state.items.filter(i => parseFloat(i.amount) > 0);
        const total = validItems.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);
        const totalCN = CurrencyCN.toChinese(total);
        const previewItems = document.getElementById('previewItems');
        previewItems.innerHTML = validItems.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.category)}</td><td class="col-desc">${escapeHtml(item.description)}</td><td class="col-amount">${(parseFloat(item.amount) || 0).toFixed(2)}</td></tr>`).join('');
        document.getElementById('previewReimburser').textContent = state.reimburser || '-';
        document.getElementById('previewDept').textContent = state.department || '-';
        document.getElementById('previewDate').textContent = state.date || '-';
        document.getElementById('previewTotal').textContent = `¥ ${total.toFixed(2)}`;
        document.getElementById('previewTotalCN').textContent = totalCN;
        document.getElementById('previewSigner').textContent = state.reimburser || '';
        document.getElementById('previewReviewer').textContent = document.getElementById('reviewerName').value.trim() || '-';
        document.getElementById('previewApprover').textContent = document.getElementById('approverName').value.trim() || '-';
        const companyName = document.getElementById('companyName').value.trim();
        const companyLine = document.getElementById('previewCompanyLine');
        if (companyName) { companyLine.textContent = companyName; companyLine.style.display = ''; document.getElementById('previewCompanyTitle').textContent = companyName + ' · 费用报销单'; }
        else { companyLine.style.display = 'none'; document.getElementById('previewCompanyTitle').textContent = '费 用 报 销 单'; }
        document.getElementById('previewOverlay').classList.add('active');
    }

    function closePreview() { document.getElementById('previewOverlay').classList.remove('active'); }

    // ---- Toast ----
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message; toast.className = `toast show ${type}`;
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function escapeHtml(str) {
        if (!str) return ''; const div = document.createElement('div'); div.textContent = str; return div.innerHTML;
    }

    // ---- 公开 API ----
    return {
        init, addNewRow, removeRow, updateItem, handleAmountInput, updateSummary, renderTable,
        onMergeCheckChange, toggleSelectAll, mergeSelectedRows,
        onOcrCatChange, onOcrDescChange, onOcrAmountChange, onOcrAmountInput,
        addManualEntry,
    };
})();

document.addEventListener('DOMContentLoaded', () => { App.init(); });
