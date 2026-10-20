import { useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useJsonCollection } from '../hooks/useJsonCollection';
import { getCallCenterEvents, hasContractTarget, isCallCenter, kabulDate, targetSalaryForPeriod } from '../utils/callCenterPerformance';
import { formatCurrencyAmount } from '../utils/currencyDisplay';
import './CallCenterPerformance.css';

export default function CallCenterPerformance({ employeeId, accountId, language = 'en' }) {
  const [employees, , , employeesLoaded] = useJsonCollection('employees');
  const [customers, , , customersLoaded] = useJsonCollection('customers');
  const [projects, , , projectsLoaded] = useJsonCollection('projects');
  const [visits, , , visitsLoaded] = useJsonCollection('customerVisits');
  const [month, setMonth] = useState(() => kabulDate(new Date().toISOString()).slice(0, 7));
  const employee = employees.find((item) => String(item.id) === String(employeeId));
  const tx = (en, dr, ps) => language === 'dr' ? dr : language === 'ps' ? ps : en;
  const events = useMemo(() => getCallCenterEvents({ employee, accountId, customers, projects, visits }), [employee, accountId, customers, projects, visits]);
  if (!isCallCenter(employee)) return null;
  const start = `${month}-01`;
  const end = `${month}-31`;
  const introduced = events.filter((event) => event.introducedDate.startsWith(month));
  const contracted = events.filter((event) => event.contractDate.startsWith(month));
  const totalDays = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const data = Array.from({ length: totalDays }, (_, index) => {
    const date = `${month}-${String(index + 1).padStart(2, '0')}`;
    return { date, introduced: introduced.filter((event) => event.introducedDate === date).length, visited: events.filter((event) => event.visitDates.includes(date)).length, contracted: contracted.filter((event) => event.contractDate === date).length };
  });
  const target = Number(employee.monthlyContractTarget || 0);
  const ready = employeesLoaded && customersLoaded && projectsLoaded && visitsLoaded;
  return <section className="call-center-performance" dir={language === 'en' ? 'ltr' : 'rtl'}>
    <header><h2>{tx('Call Center Performance', 'عملکرد کال سنتر', 'د کال سنټر فعالیت')}</h2><label>{tx('Month', 'ماه', 'میاشت')} <input aria-label={tx('Performance month', 'ماه گزارش عملکرد', 'د فعالیت میاشت')} type="month" required value={month} onChange={(event) => { if (event.target.value) setMonth(event.target.value); }} /></label></header>
    {!ready ? <p>{tx('Loading performance…', 'در حال بارگذاری عملکرد…', 'فعالیت بارېږي…')}</p> : <>
      <div className="call-center-performance-stats">
        <div><span>{tx('Customers introduced', 'مشتریان معرفی‌شده', 'معرفي شوي پېرودونکي')}</span><strong>{introduced.length}</strong></div>
        <div><span>{tx('Customers contracted', 'مشتریان قراردادشده', 'قرارداد لرونکي پېرودونکي')}</span><strong>{contracted.length}</strong></div>
        <div><span>{tx('Customers who visited', 'مشتریان مراجعه‌کرده', 'راغلي پېرودونکي')}</span><strong>{events.filter((event) => event.visitDates.some((date) => date.startsWith(month))).length}</strong></div>
        {hasContractTarget(employee) && <>
          <div><span>{tx('Monthly target', 'تارگیت ماهانه', 'میاشتنی هدف')}</span><strong>{contracted.length} / {target}</strong><progress max={target} value={Math.min(target, contracted.length)} /></div>
          <div><span>{tx('Salary earned (before adjustments)', 'معاش کسب‌شده (قبل از تعدیلات)', 'تر تعدیلاتو مخکې ترلاسه شوی معاش')}</span><strong>{formatCurrencyAmount(targetSalaryForPeriod(employee, events, start, end), employee.salaryCurrency || 'AFN')}</strong><small>{tx('Full salary', 'معاش کامل', 'بشپړ معاش')}: {formatCurrencyAmount(employee.fixedSalary, employee.salaryCurrency || 'AFN')}</small></div>
        </>}
      </div>
      <p>{tx('Each customer counts once at their first recorded project contract. Cancelled and draft projects are excluded. Introduction and contract dates may fall in different months.', 'هر مشتری در اولین قرارداد ثبت‌شده در پروژه‌ها یک‌بار حساب می‌شود. پروژه‌های لغوشده و پیش‌نویس حساب نمی‌شوند. ماه معرفی و قرارداد ممکن است متفاوت باشد.', 'هر پېرودونکی په لومړي ثبت شوي قرارداد کې یو ځل شمېرل کېږي. لغوه او مسوده پروژې نه شمېرل کېږي. د معرفۍ او قرارداد میاشتې توپیر لرلای شي.')}</p>
      <div className="call-center-performance-chart"><ResponsiveContainer width="100%" height={290}><BarChart data={data} accessibilityLayer><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tickFormatter={(date) => date.slice(8)} /><YAxis allowDecimals={false} /><Tooltip /><Legend /><Bar dataKey="introduced" name={tx('Introduced', 'معرفی‌شده', 'معرفي شوي')} fill="#8b5cf6" /><Bar dataKey="visited" name={tx('Visited', 'مراجعه‌کرده', 'راغلي')} fill="#3b82f6" /><Bar dataKey="contracted" name={tx('Contracted', 'قراردادشده', 'قرارداد شوي')} fill="#10b981" /></BarChart></ResponsiveContainer></div>
      <details><summary>{tx('Customer dates and contracts', 'تاریخ‌های مشتریان و قراردادها', 'د پېرودونکو او قراردادونو نېټې')}</summary><div className="call-center-performance-table"><table><thead><tr><th>{tx('Customer', 'مشتری', 'پېرودونکی')}</th><th>{tx('Introduced', 'تاریخ معرفی', 'د معرفۍ نېټه')}</th><th>{tx('First contract', 'اولین قرارداد', 'لومړی قرارداد')}</th><th>{tx('Visit dates', 'تاریخ‌های مراجعه', 'د راتګ نېټې')}</th></tr></thead><tbody>{events.filter((event) => event.introducedDate.startsWith(month) || event.contractDate.startsWith(month) || event.visitDates.some((date) => date.startsWith(month))).sort((a, b) => a.introducedDate.localeCompare(b.introducedDate)).map((event) => <tr key={event.customerId}><td>{event.name}</td><td>{event.introducedDate || '—'}</td><td>{event.contractDate || '—'}</td><td>{event.visitDates.join(', ') || '—'}</td></tr>)}</tbody></table></div></details>
    </>}
  </section>;
}
