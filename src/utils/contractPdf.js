import { PDFDocument, rgb } from 'pdf-lib';
import { contractItems, contractNumber, contractPlanLabel, contractProjectCode, validateContract } from './customerContract.js';
import { salePaymentSummary } from './projectSalesLogic.js';

// Paint only variable sections. All other clauses remain in the supplied PDF.
export async function generateContractPdf(templateBytes, sale, details, canvasFactory = () => document.createElement('canvas')) {
  const error = validateContract(details);
  if (error) throw new Error(error);
  const pdf = await PDFDocument.load(templateBytes);
  const pages = pdf.getPages();
  const items = contractItems(sale);
  const payment = salePaymentSummary(sale);
  const ltr = value => `\u2066${value}\u2069`;
  const amount = value => ltr(`${Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${sale.currency || 'AFN'}`);
  async function box(page, x, top, width, height, lines, fontSize = 11, clear = true) {
    const crop = page.getCropBox();
    if (clear) page.drawRectangle({ x, y: crop.y + crop.height - top - height, width, height, color: rgb(1, 1, 1) });
    const canvas = canvasFactory();
    const scale = 3;
    canvas.width = Math.ceil(width * scale); canvas.height = Math.ceil(height * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale); ctx.direction = 'rtl'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillStyle = '#111827';
    let rendered;
    for (let size = fontSize; size >= 7; size -= 0.5) {
      ctx.font = `${size}px Tahoma, Arial, sans-serif`;
      rendered = [];
      for (const text of lines) {
        let line = '';
        for (const word of String(text).split(/\s+/)) {
          const next = line ? `${line} ${word}` : word;
          if (ctx.measureText(next).width > width - 8 && line) { rendered.push(line); line = word; }
          else line = next;
        }
        rendered.push(line);
      }
      if (rendered.length * size * 1.5 <= height - 4 && rendered.every(line => ctx.measureText(line).width <= width - 8)) {
        rendered.forEach((line, index) => ctx.fillText(line, width - 4, 2 + index * size * 1.5));
        const image = await pdf.embedPng(canvas.toDataURL('image/png'));
        page.drawImage(image, { x, y: crop.y + crop.height - top - height, width, height });
        return;
      }
    }
    throw new Error('Contract text is too long for the template. Shorten the field and try again.');
  }
  const seller = ['طرف اول - شرکت فروشنده', 'نام شرکت: شرکت توسعه تکنالوژی افغان پاور', 'نماینده: محمد صمیم میاخیل', 'وظیفه: رئیس شرکت', 'آدرس: شهرنو بین چهارراهی حاجی یعقوب و انصاری، مارکیت برگ طلایی، منزل پنجم، دفتر 73', 'شماره تماس: 0783828054'];
  const buyer = ['طرف دوم - خریدار', `نام / شرکت: ${details.buyerName}`, `تذکره / جواز: ${details.buyerIdNumber}`, `نماینده: ${details.representative}`, `آدرس: ${details.address}`, `تماس: ${details.phone}`];
  for (const page of [pages[0], pages[3]]) {
    await box(page, 30, 237, 530, 158, [], 11);
    await box(page, 300, 238, 250, 155, seller, 11);
    await box(page, 40, 238, 245, 155, buyer, 11);
  }
  await box(pages[0], 25, 451, 530, 183, [
    'موضوع این قرارداد عبارت است از فروش یک سیستم نرم‌افزاری آماده و واگذاری حق استفاده از آن به خریدار، مطابق مشخصات ذیل:',
    `۱. نام سیستم: ${items.length === 1 ? items[0].projectName : 'مطابق ضمیمه شماره یک'}`,
    `۲. نوع سیستم: ${details.systemType}`, `۳. نسخه سیستم: ${details.systemVersion}`,
    `۴. نوع حق استفاده: ${items.length === 1 ? contractPlanLabel(items[0].salePlan) : 'مطابق ضمیمه شماره یک'}`,
    '۵. امکانات و بخش‌های شامل قرارداد: مطابق ضمیمه شماره یک این قرارداد.',
    'این سیستم به‌صورت آماده به فروش می‌رسد و شامل ساخت امکانات جدید، تغییرات اختصاصی یا بازسازی سیستم نمی‌باشد؛ مگر این‌که طرفین در مورد آن توافق کتبی جداگانه نمایند.',
  ], 11);
  await box(pages[0], 25, 662, 530, 134, [
    `۱. قیمت مجموعی سیستم مبلغ ${amount(payment.total)} تعیین گردیده است.`,
    '۲. خریدار مکلف است مبلغ تعیین‌شده را مطابق شرایط ذیل پرداخت نماید:',
    `مبلغ پیش پرداخت: ${amount(payment.paid)}`, `مبلغ باقی مانده: ${amount(payment.remaining)}`, `تاریخ پرداخت: ${ltr(details.paymentDueDate)}`,
    '۳. شرکت پس از دریافت مبلغ مورد توافق، سیستم را مطابق شرایط این قرارداد در اختیار خریدار قرار می‌دهد.',
  ], 11);
  // Fill the numeric blank without changing the surrounding delivery clause.
  await box(pages[1], 163, 297, 43, 15, [String(details.acceptanceDays)], 10);
  await box(pages[1], 25, 421, 530, 59, [
    `۱. مدت خدمات حمایوی سیستم: ${details.supportDuration} تعیین می‌گردد.`,
    '۲. خدمات حمایوی شامل بررسی و رفع نواقص تخنیکی‌ای می‌باشد که مطابق شرایط قرارداد بر عهده شرکت قرار داشته باشند.',
  ], 11);
  // Other template pages use the bottom margin for clauses; keep those intact.
  for (const page of [pages[0], pages[3]]) await box(page, 32, 807, 530, 20, [`${ltr(contractNumber(sale))} | تاریخ قرارداد: ${ltr(details.contractDate)}`], 9);

  // The original contract explicitly refers to Appendix 1 for included features.
  let appendix = pdf.addPage([595.5, 842.25]);
  let y = 35;
  await box(appendix, 35, y, 525, 52, ['ضمیمه شماره یک - مشخصات پروژه‌ها و امکانات', `${ltr(contractNumber(sale))} | ${details.buyerName}`], 14);
  y += 65;
  for (const item of items) {
    if (y + 110 > 770) { appendix = pdf.addPage([595.5, 842.25]); y = 35; }
    await box(appendix, 35, y, 525, 100, [
      `پروژه: ${item.projectName} | کد: ${ltr(contractProjectCode(item))}`,
      `پلن: ${contractPlanLabel(item.salePlan)} | شروع: ${ltr(item.startDate || sale.saleDate || '-')} | ختم: ${item.salePlan === 'lifetime' ? 'دایمی' : ltr(item.endDate || '-')}`,
      `تعداد: ${item.quantity || 1} | مبلغ: ${Number(item.total ?? item.price ?? 0).toLocaleString('en-US')} ${item.currency || sale.currency || 'AFN'}`,
    ], 11);
    y += 110;
  }
  // Paragraph-sized chunks support long feature lists without clipping.
  const chunks = String(details.features).match(/[\s\S]{1,350}(?:\s|$)|[\s\S]{1,350}/g) || [];
  for (const chunk of chunks) {
    if (y + 110 > 770) { appendix = pdf.addPage([595.5, 842.25]); y = 35; }
    await box(appendix, 35, y, 525, 100, [chunk], 11); y += 110;
  }
  pdf.setTitle(`Contract ${contractNumber(sale)}`);
  pdf.setSubject('Completed customer contract');
  return pdf.save();
}
