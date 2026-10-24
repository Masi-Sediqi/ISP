import { PDFDocument } from 'pdf-lib';
import { createPdfTextWriter } from './pdfTextBox.js';
import { contractNumber, validateContract } from './customerContract.js';

export async function generateVisaContractPdf(templateBytes, record, details, canvasFactory = () => document.createElement('canvas')) {
  const error = validateContract(details, 'turkey-visa');
  if (error) throw new Error(error);
  const pdf = await PDFDocument.load(templateBytes);
  const pages = pdf.getPages();
  if (pages.length !== 3) throw new Error('Invalid visa contract template.');
  const box = createPdfTextWriter(pdf, canvasFactory, [247 / 255, 252 / 255, 1]);
  const ltr = value => `\u2066${value}\u2069`;
  await box(pages[0], 225, 187, 153, 24, [ltr(details.contractDate)], 11);
  await box(pages[0], 25, 218, 570, 128, [], 10);
  await box(pages[0], 310, 220, 275, 122, ['طرف اول - شرکت', 'Afghan Power Travel & Consultancy Company', 'مسئول باصلاحیت: عمران افضلی', 'تماس: 0788845351', 'آدرس: میان چهارراهی انصاری و حاجی یعقوب، مارکیت بزرگ طلایی، دفتر 73'], 10);
  await box(pages[0], 30, 220, 260, 122, ['طرف دوم - متقاضی', `نام: ${details.buyerName}`, `نام پدر: ${details.fatherName}`, `تذکره / پاسپورت: ${ltr(details.buyerIdNumber)}`, `تماس: ${ltr(details.phone)}`, `آدرس: ${details.address}`], 10);
  await box(pages[1], 30, 306, 525, 94, [
    `مبلغ مجموعی خدمات: ${ltr(`${Number(details.totalAmount).toLocaleString('en-US')} USD`)}`,
    'پیش پرداخت: بدون پیش‌پرداخت',
    `نحوه پرداخت: ${details.paymentMethod}`,
    `اسم صراف: ${details.exchangeName} | جواز: ${ltr(details.exchangeLicense)}`,
    `آدرس صرافی: ${details.exchangeAddress}`,
  ], 10);
  await box(pages[2], 330, 482, 110, 24, [ltr(details.contractDate)], 10);
  await box(pages[2], 35, 535, 525, 89, [
    `نام و نام خانوادگی: ${details.buyerName}`, `شماره پاسپورت / تذکره: ${ltr(details.buyerIdNumber)}`,
    `شماره تماس: ${ltr(details.phone)}`, `تاریخ: ${ltr(details.contractDate)}`,
  ], 11);
  await box(pages[2], 35, 735, 525, 22, [ltr(contractNumber(record))], 9);
  pdf.setTitle(`Visa contract ${contractNumber(record)}`);
  return pdf.save();
}
