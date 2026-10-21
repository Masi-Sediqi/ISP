import {createRequire} from 'node:module';
import fs from 'node:fs';
import {generateContractPdf} from '../../src/utils/contractPdf.js';
const req=createRequire('C:/Users/NONAME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/package.json');
const {createCanvas}=req('@napi-rs/canvas');
const sale={id:'QA-ONLY',customerName:'احمد محمدی',currency:'AFN',total:20000,paid:5000,remaining:15000,saleDate:'2026-10-21',items:[{projectId:'project-1',projectCode:'PRJ-1786524810527',projectName:'سیستم مدیریت کلینیک دندان',salePlan:'one-month',startDate:'2026-10-21',endDate:'2026-11-21',quantity:1,total:20000,currency:'AFN'}]};
const details={buyerName:'شرکت خدمات صحی احمد محمدی',buyerIdNumber:'123456789',representative:'احمد محمدی',address:'کابل، شهرنو، چهارراهی انصاری، منزل دوم',phone:'0700000000',systemType:'سیستم مدیریت کلینیک',systemVersion:'1.0',contractDate:'2026-10-21',paymentDueDate:'2026-11-01',acceptanceDays:'7',supportDuration:'سه ماه',features:'مدیریت مشتریان، ثبت پرداخت‌ها، گزارش‌های مالی و مدیریت معلومات کلینیک.'};
fs.writeFileSync('tmp/pdfs/contract-qa.pdf',await generateContractPdf(fs.readFileSync('public/contract-template.pdf'),sale,details,()=>createCanvas(1,1)));
console.log('Synthetic contract generated; no database records written.');

