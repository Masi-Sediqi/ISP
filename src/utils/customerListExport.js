// Read the displayed values so every department exports the same columns as its list.
export function readCustomerTable(table) {
  const value = (cell) => {
    const copy = cell.cloneNode(true);
    copy.querySelectorAll('svg, img, .consultant-name-avatar, .consultant-name-copy small').forEach((node) => node.remove());
    copy.querySelectorAll('.consultant-contact span').forEach((node) => node.append(' '));
    return copy.textContent.replace(/\s+/g, ' ').trim();
  };
  return {
    headers: Array.from(table.tHead.rows[0].cells).slice(0, -1).map(value),
    rows: Array.from(table.tBodies[0].rows).filter((row) => !row.querySelector('[colspan]')).map((row) => Array.from(row.cells).slice(0, -1).map(value)),
  };
}

function reportDocument(doc, title, headers, rows, rtl) {
  const style = doc.createElement('style');
  style.textContent = `@page{size:A4 landscape;margin:10mm}body{font-family:Arial,sans-serif;color:#111;background:white;margin:0}h1{font-size:20px;margin:0 0 8px}p{font-size:11px;color:#555}table{border-collapse:collapse;width:100%;table-layout:fixed;font-size:10px}th,td{border:1px solid #ddd;padding:6px;text-align:start;overflow-wrap:anywhere}th{background:#f1f5f9}thead{display:table-header-group}tr{break-inside:avoid}td{vertical-align:top}`;
  doc.head.append(style);
  doc.documentElement.dir = rtl ? 'rtl' : 'ltr';
  const heading = doc.createElement('h1');
  heading.textContent = `Afghan Power — ${title}`;
  doc.body.append(heading);
  const table = doc.createElement('table');
  const head = table.createTHead().insertRow();
  headers.forEach((value) => { const cell = doc.createElement('th'); cell.textContent = value; head.append(cell); });
  const body = table.createTBody();
  rows.forEach((values) => { const row = body.insertRow(); values.forEach((value) => { row.insertCell().textContent = value; }); });
  doc.body.append(table);
}

export async function exportCustomerList({ table, title, format, rtl, onProgress = () => {} }) {
  onProgress({ stage: "collecting", done: 0, total: 0 });
  const { headers, rows } = readCustomerTable(table);
  if (!headers.length) throw new Error("No customer table was found for export.");
  const filename = `customers-${new Date().toISOString().slice(0, 10)}`;
  if (format === 'excel') {
    onProgress({ stage: "library", done: 0, total: 1 });
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    sheet['!cols'] = headers.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(workbook, sheet, 'Customers');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    onProgress({ stage: "done", done: 1, total: 1 });
    return;
  }
  const frame = document.createElement('iframe');
  frame.title = title;
  frame.style.cssText = 'position:fixed;left:-20000px;top:0;width:1120px;height:800px;border:0';
  document.body.append(frame);
  try {
    const doc = frame.contentDocument;
    reportDocument(doc, title, headers, rows, rtl);
    // Limit font wait: a missing web font must not stall exports indefinitely.
    await Promise.race([doc.fonts?.ready || Promise.resolve(), new Promise(resolve => setTimeout(resolve, 1200))]);
    if (format === 'print') {
      frame.contentWindow.addEventListener('afterprint', () => frame.remove(), { once: true });
      frame.contentWindow.focus();
      frame.contentWindow.print();
      // Some browsers do not dispatch afterprint for an iframe.
      window.setTimeout(() => frame.remove(), 60000);
      return;
    }
    onProgress({ stage: 'library', done: 0, total: 1 });
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    // Separate a full list into predictable, bounded pages. Avoid the quadratic
    // layout loop and giant off-screen canvases on 1,000+ customer exports.
    const body = doc.querySelector('tbody');
    const originalRows = Array.from(body.rows);
    const pageSize = 24;
    const totalPages = Math.max(1, Math.ceil(originalRows.length / pageSize));
    frame.style.height = '1px';
    let pdfPages = 0;
    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      body.replaceChildren(...originalRows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize));
      onProgress({ stage: 'rendering', done: pageIndex, total: totalPages });
      // Yield so React can paint the updated progress, and the browser can stay responsive.
      await new Promise(resolve => setTimeout(resolve, 0));
      const canvas = await html2canvas(doc.body, {
        scale: 1.15, backgroundColor: '#ffffff', windowWidth: 1120,
        logging: false, useCORS: false,
      });
      const pagePixels = Math.floor(190 * canvas.width / 277);
      for (let top = 0; top < canvas.height; top += pagePixels) {
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = Math.min(pagePixels, canvas.height - top);
        slice.getContext('2d').drawImage(canvas, 0, top, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        if (pdfPages++) pdf.addPage();
        pdf.addImage(slice.toDataURL('image/jpeg', 0.8), 'JPEG', 10, 10, 277,
          slice.height * 277 / slice.width, undefined, 'FAST');
        slice.width = 0;
        slice.height = 0;
      }
      canvas.width = 0;
      canvas.height = 0;
      onProgress({ stage: 'rendering', done: pageIndex + 1, total: totalPages });
    }
    onProgress({ stage: 'saving', done: totalPages, total: totalPages });
    await new Promise(resolve => setTimeout(resolve, 0));
    pdf.save(`${filename}.pdf`);
    onProgress({ stage: "done", done: totalPages, total: totalPages });
  } finally {
    if (format !== 'print') frame.remove();
  }
}
