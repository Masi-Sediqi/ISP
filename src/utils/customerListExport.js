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

export async function exportCustomerList({ table, title, format, rtl }) {
  const { headers, rows } = readCustomerTable(table);
  const filename = `customers-${new Date().toISOString().slice(0, 10)}`;
  if (format === 'excel') {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    sheet['!cols'] = headers.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(workbook, sheet, 'Customers');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
    return;
  }
  const frame = document.createElement('iframe');
  frame.title = title;
  frame.style.cssText = 'position:fixed;left:-20000px;top:0;width:1120px;height:800px;border:0';
  document.body.append(frame);
  try {
    const doc = frame.contentDocument;
    reportDocument(doc, title, headers, rows, rtl);
    await doc.fonts.ready;
    if (format === 'print') {
      frame.contentWindow.addEventListener('afterprint', () => frame.remove(), { once: true });
      frame.contentWindow.focus();
      frame.contentWindow.print();
      // Some browsers do not dispatch afterprint for an iframe.
      window.setTimeout(() => frame.remove(), 60000);
      return;
    }
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    // Render bounded groups of rows to avoid browser canvas limits on large lists.
    const body = doc.querySelector('tbody');
    const allRows = Array.from(body.rows);
    frame.style.height = '1px';
    let page = 0;
    while (allRows.length || page === 0) {
      body.replaceChildren();
      // Fit whole rows within the printable A4 height before capturing each page.
      while (allRows.length) {
        const next = allRows.shift();
        body.append(next);
        if (doc.body.scrollHeight > 190 * 1120 / 277 && body.rows.length > 1) {
          next.remove();
          allRows.unshift(next);
          break;
        }
      }
      const canvas = await html2canvas(doc.body, { scale: 1.5, backgroundColor: '#ffffff', windowWidth: 1120 });
      const height = canvas.height * 277 / canvas.width;
      // Tall notes can extend a group across multiple A4 pages without cropping.
      const pagePixels = Math.floor(190 * canvas.width / 277);
      for (let top = 0; top < canvas.height; top += pagePixels) {
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = Math.min(pagePixels, canvas.height - top);
        slice.getContext('2d').drawImage(canvas, 0, top, canvas.width, slice.height, 0, 0, slice.width, slice.height);
        if (page++) pdf.addPage();
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', 10, 10, 277, Math.min(height, slice.height * 277 / slice.width));
      }
    }
    pdf.save(`${filename}.pdf`);
  } finally {
    if (format !== 'print') frame.remove();
  }
}
