// Customer list export. Designed for readable multi-page PDF reports with RTL support.
export function readCustomerTable(table) {
  const value = (cell) => {
    const copy = cell.cloneNode(true);
    copy.querySelectorAll('svg, img, .consultant-name-avatar, .consultant-name-copy small').forEach((node) => node.remove());
    copy.querySelectorAll('.consultant-contact span').forEach((node) => node.append(' '));
    return (copy.textContent || '').replace(/\s+/g, ' ').trim();
  };
  return {
    headers: Array.from(table.tHead?.rows?.[0]?.cells || []).slice(0, -1).map(value),
    rows: Array.from(table.tBodies?.[0]?.rows || []).filter((row) => !row.querySelector('[colspan]'))
      .map((row) => Array.from(row.cells).slice(0, -1).map(value)),
  };
}

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
const escaped = (text) => String(text || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function makeReport(doc, { title, headers, rtl, count, date }) {
  doc.documentElement.lang = rtl ? 'fa' : 'en';
  doc.documentElement.dir = rtl ? 'rtl' : 'ltr';
  doc.head.innerHTML = '';
  const style = doc.createElement('style');
  style.textContent = `
    *{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#13213a}
    body{font-family:Tahoma,"Segoe UI",Arial,sans-serif;direction:${rtl ? 'rtl' : 'ltr'};font-size:14px;-webkit-font-smoothing:antialiased}
    .sheet{width:1600px;min-height:1010px;padding:50px 54px 42px;position:relative;background:#fff;display:flex;flex-direction:column}
    .stripe{position:absolute;inset:0 0 auto;height:10px;background:linear-gradient(90deg,#f59e0b,#1853a4,#111c38)}
    .brand{display:flex;justify-content:space-between;align-items:center;gap:22px;padding-bottom:22px;border-bottom:2px solid #dce6f1}
    .brand-name{font-size:25px;font-weight:800;letter-spacing:.1px;color:#12274b;direction:ltr;text-align:left}
    .brand-sub{font-size:13px;color:#61718c;margin-top:3px;direction:ltr;text-align:left}
    .mark{width:53px;height:53px;border-radius:12px;background:#152c53;color:#fbbf24;font-weight:900;font-size:29px;display:grid;place-items:center}
    .brand-left{display:flex;align-items:center;gap:16px;direction:ltr}
    .report-label{background:#eaf2ff;border:1px solid #d4e3fd;color:#28538e;padding:9px 15px;border-radius:8px;font-size:13px;font-weight:700}
    .heading{display:flex;justify-content:space-between;align-items:end;gap:20px;margin:24px 0 20px}
    h1{font-size:28px;line-height:1.35;margin:0;color:#102140;font-weight:800}
    .desc{font-size:14px;color:#73839b;margin:7px 0 0}
    .summary{padding:12px 16px;border:1px solid #dce7f3;background:#f6f9fd;border-radius:9px;display:flex;gap:25px;align-items:center;font-weight:700;color:#243b61;white-space:nowrap}
    table{table-layout:fixed;width:100%;border-collapse:separate;border-spacing:0;text-align:start;border:1px solid #dbe3ef;border-radius:9px;overflow:hidden}
    th{background:#152b4d;color:white;padding:15px 10px;font-size:12.7px;font-weight:750;line-height:1.4;text-align:start;vertical-align:middle;overflow-wrap:anywhere;border-inline-end:1px solid #3d526d}
    th:last-child{border-inline-end:0}
    td{padding:12px 10px;color:#23334e;vertical-align:middle;font-size:12.9px;line-height:1.55;border-bottom:1px solid #dbe5f0;overflow-wrap:anywhere;word-break:normal;unicode-bidi:plaintext}
    tr:nth-child(even) td{background:#f3f7fc}tr:last-child td{border-bottom:0}
    .footer{margin-top:auto;padding-top:18px;border-top:1px solid #dce5f0;display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#6c7e98}
    .footer strong{color:#263d5f}.nowrap{white-space:nowrap}
  `;
  doc.head.append(style);
  doc.body.innerHTML = '';
  const sheet = doc.createElement('main'); sheet.className = 'sheet'; doc.body.append(sheet);
  sheet.innerHTML = `<div class="stripe"></div><div class="brand"><div class="brand-left"><div class="mark">AP</div><div><div class="brand-name">Afghan Power</div><div class="brand-sub">Asset & Inventory Management</div></div></div><div class="report-label">${rtl ? 'راپور مشتریان' : 'CUSTOMER REPORT'}</div></div><div class="heading"><div><h1>${escaped(title)}</h1><p class="desc">${rtl ? 'فهرست مشتریان، تهیه‌شده توسط افغان پاور' : 'Professional customer register and contact information'}</p></div><div class="summary"><span>${rtl ? 'مجموع ریکاردها' : 'Total records'}: ${count.toLocaleString('en-US')}</span><span dir="ltr">${escaped(date)}</span></div></div>`;
  const table = doc.createElement('table'); sheet.append(table);
  const head = table.createTHead().insertRow();
  headers.forEach((label) => { const th = doc.createElement('th'); th.textContent = label; head.append(th); });
  const body = table.createTBody();
  const footer = doc.createElement('div'); footer.className = 'footer'; sheet.append(footer);
  return { sheet, body, footer };
}

export async function exportCustomerList({ table, title, format, rtl, onProgress = () => {} }) {
  onProgress({ stage: 'collecting', done: 0, total: 0 });
  const { headers, rows } = readCustomerTable(table);
  if (!headers.length) throw new Error('No customer table was found for export.');
  const filename = `customers-${new Date().toISOString().slice(0, 10)}`;
  if (format === 'excel') {
    onProgress({ stage: 'library', done: 0, total: 1 });
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    sheet['!cols'] = headers.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(workbook, sheet, 'Customers');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    onProgress({ stage: 'done', done: 1, total: 1 });
    return;
  }
  const frame = document.createElement('iframe');
  frame.title = title;
  frame.style.cssText = 'position:fixed;left:-20000px;top:0;width:1600px;height:1100px;border:0;pointer-events:none';
  document.body.append(frame);
  try {
    const doc = frame.contentDocument;
    const layout = makeReport(doc, { title, headers, rtl, count: rows.length, date: new Date().toLocaleDateString('en-GB') });
    await Promise.race([doc.fonts?.ready || Promise.resolve(), new Promise((resolve) => setTimeout(resolve, 1500))]);
    if (format === 'print') {
      const printStyle = doc.createElement('style');
      printStyle.textContent = '@media print{@page{size:A3 landscape;margin:0}.sheet{break-after:page}}';
      doc.head.append(printStyle);
      for (const values of rows) {
        const tr = layout.body.insertRow();
        values.forEach((value) => { const td = tr.insertCell(); td.textContent = value; });
      }
      frame.contentWindow.addEventListener('afterprint', () => frame.remove(), { once: true });
      frame.contentWindow.focus(); frame.contentWindow.print();
      setTimeout(() => frame.remove(), 60000);
      return;
    }
    onProgress({ stage: 'library', done: 0, total: 1 });
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3', compress: true });
    const pixelWidth = 1600;
    // A3 landscape usable content is 396 x 277 mm; keep each page in one image, never split a row.
    const maxHeight = 1040;
    const pageSets = [];
    let index = 0;
    // Determine page boundaries by actual browser row heights to prevent clipping.
    while (index < rows.length || (rows.length === 0 && pageSets.length === 0)) {
      layout.body.replaceChildren();
      const start = index;
      const maxRowsPerPage = 24;
      while (index < rows.length && index - start < maxRowsPerPage) {
        const tr = layout.body.insertRow();
        rows[index].forEach((value) => { const td = tr.insertCell(); td.textContent = value; });
        if (layout.sheet.scrollHeight > maxHeight && index > start) { tr.remove(); break; }
        index += 1;
      }
      pageSets.push(rows.slice(start, index));
    }
    const total = pageSets.length;
    for (let pageIndex = 0; pageIndex < total; pageIndex++) {
      layout.body.replaceChildren();
      pageSets[pageIndex].forEach((values) => {
        const tr = layout.body.insertRow();
        values.forEach((value) => { const td = tr.insertCell(); td.textContent = value; });
      });
      layout.footer.innerHTML = `<span>Afghan Power &bull; ${rtl ? 'گزارش مشتریان' : 'Customer Records'}</span><strong>${rtl ? 'صفحه' : 'Page'} ${pageIndex + 1} / ${total}</strong><span>${rtl ? 'گزارش رسمی سیستم' : 'System-generated report'}</span>`;
      onProgress({ stage: 'rendering', done: pageIndex, total });
      await nextFrame();
      const canvas = await html2canvas(layout.sheet, {
        scale: 1.5, backgroundColor: '#ffffff', windowWidth: pixelWidth,
        logging: false, useCORS: false,
      });
      const widthMm = 397;
      const heightMm = canvas.height * widthMm / canvas.width;
      if (pageIndex) pdf.addPage();
      const jpeg = canvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(jpeg, 'JPEG', 11, 9, widthMm, Math.min(heightMm, 278), undefined, 'FAST');
      canvas.width = 0; canvas.height = 0;
      onProgress({ stage: 'rendering', done: pageIndex + 1, total });
    }
    onProgress({ stage: 'saving', done: total, total });
    await nextFrame();
    pdf.save(`${filename}.pdf`);
    onProgress({ stage: 'done', done: total, total });
  } finally {
    if (format !== 'print') frame.remove();
  }
}
