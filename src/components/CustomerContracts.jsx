import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Printer, X } from 'lucide-react';
import { standaloneSoftwareRecord, contractFields, contractDefaults, contractItems, contractNumber, contractProjectCode, validateContract } from '../utils/customerContract';
import { CONTRACT_TEMPLATES, contractTemplateId, getContractTemplate } from '../utils/contractTemplates';
import { notify } from '../utils/notify';
import { formatCurrencyAmount } from '../utils/currencyDisplay';
import { projectUniqueCode, salePlanEndDate } from '../utils/projectSalePlans';

export default function CustomerContracts({ sales, customer, setSales, contracts = [], setContracts }) {
  const [gallery, setGallery] = useState(null);
  const [templateId, setTemplateId] = useState('software-sale');
  const records = [...sales.map(sale => ({ ...sale, _contractSource: 'sale' })), ...contracts.map(contract => ({ ...contract, _contractSource: 'standalone' }))];
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState({});
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');
  const [preview, setPreview] = useState(null);
  const frame = useRef(null);
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url); }, [preview]);
  const edit = (sale, chosenTemplate = contractTemplateId(sale)) => {
    const record = sale._contractSource === 'standalone' ? { ...sale, contractStandalone: true } : sale;
    setTemplateId(chosenTemplate);
    setDetails(contractDefaults(record, customer, chosenTemplate)); setEditing(record); setGallery(null);
  };
  const chooseTemplate = template => {
    const record = (template.id === 'software-sale' || gallery.existing ? gallery.sale : null) || { id: crypto.randomUUID(), _contractSource: 'standalone', customerId: customer.id || customer.customerId,
      customerName: customer.fullName || customer.customerName || customer.name || '', customerPhone: customer.phone || '',
      contractTemplateId: template.id, contractStandalone: true, createdAt: new Date().toISOString() };
    edit(record, template.id);
  };
  const save = async event => {
    event.preventDefault();
    if (saving) return;
    const error = validateContract(details, templateId, editing?.contractStandalone);
    if (error) { notify(error, 'error'); return; }
    setSaving(true);
    try {
      const trimmed = Object.fromEntries(Object.entries(details).map(([key, value]) => [key, String(value).trim()]));
      const changes = { contractId: contractNumber(editing), contractTemplateId: templateId, contractDetails: trimmed,
        contractDetailsByTemplate: { ...editing.contractDetailsByTemplate,
          ...(editing.contractDetails ? { [contractTemplateId(editing)]: editing.contractDetails } : {}), [templateId]: trimmed },
        contractUpdatedAt: new Date().toISOString() };
      let saved;
      if (editing._contractSource === 'standalone') {
        let record = { ...editing, ...changes }; delete record._contractSource;
        if (templateId === 'software-sale') record = standaloneSoftwareRecord(record, trimmed);
        saved = await setContracts(previous => previous.some(item => String(item.id) === String(record.id))
          ? previous.map(item => String(item.id) === String(record.id) ? record : item) : [...previous, record]);
      } else {
        saved = await setSales(previous => previous.map(sale => String(sale.id) === String(editing.id) ? { ...sale, ...changes } : sale));
      }
      if (saved) { setEditing(null); notify('Contract details saved.', 'success'); }
    } finally { setSaving(false); }
  };
  const generate = async (sale, download) => {
    if (busy) return;
    const chosenTemplate = getContractTemplate(contractTemplateId(sale));
    if (!chosenTemplate) { notify('Unknown contract design. Choose a supported design.', 'error'); return; }
    const data = contractDefaults(sale, customer);
    const error = validateContract(data, chosenTemplate.id, sale.contractStandalone);
    if (error) { edit(sale); notify('Complete the remaining contract details first.', 'warning'); return; }
    setBusy(String(sale.id));
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}${chosenTemplate.file}`);
      if (!response.ok) throw new Error('Unable to load the contract template.');
      const generatePdf = chosenTemplate.id === 'turkey-visa'
        ? (await import('../utils/visaContractPdf')).generateVisaContractPdf
        : (await import('../utils/contractPdf')).generateContractPdf;
      const bytes = await generatePdf(await response.arrayBuffer(), sale, data);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const filename = `Contract-${chosenTemplate.id}-${String(sale.id).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      if (download) {
        const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
        document.body.append(anchor); anchor.click(); anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else setPreview({ url, filename });
    } catch (error) { notify(error.message || 'Unable to generate contract PDF.', 'error'); }
    finally { setBusy(''); }
  };
  return <div className="customer-contracts">
    <div className="customer-ledger-heading"><div><h3>Customer Contracts</h3><p>Choose a design, complete its form, then download or print the contract.</p></div><button type="button" className="customer-adjustment-button" onClick={() => setGallery({ sale: null })}><FileText size={16} /> Choose Contract Design</button></div>
    {records.length ? <div className="customer-data-table"><table><thead><tr><th>Contract</th><th>Project / Service</th><th>Date</th><th>Total</th><th>Details</th><th>Actions</th></tr></thead><tbody>
      {records.map(sale => <tr key={`${sale._contractSource}-${sale.id}`}><td><strong>{contractNumber(sale)}</strong><small className="customer-contract-code">{getContractTemplate(contractTemplateId(sale))?.name || 'Unknown design'}</small></td><td>{contractTemplateId(sale) === 'turkey-visa' ? <span>Turkey tourist visa · {sale.customerName}</span> : contractItems(sale).map((item, index) => <div key={index}>{item.projectName}<small className="customer-contract-code">{contractProjectCode(item)}</small></div>)}</td><td>{sale.contractDetails?.contractDate || sale.saleDate || '—'}</td><td>{formatCurrencyAmount(contractTemplateId(sale) === 'turkey-visa' ? sale.contractDetails?.totalAmount : sale.total ?? sale.price, contractTemplateId(sale) === 'turkey-visa' ? 'USD' : sale.currency)}</td><td>{validateContract(contractDefaults(sale, customer), contractTemplateId(sale), sale.contractStandalone) ? 'Needs details' : 'Ready'}</td><td><div className="customer-contract-actions"><button type="button" onClick={() => edit(sale)}><FileText size={15} /> Complete / Edit</button><button type="button" onClick={() => setGallery({ sale, existing: true })}>Choose Design</button><button type="button" disabled={Boolean(busy)} onClick={() => generate(sale, true)}><Download size={15} /> {busy === String(sale.id) ? 'Preparing...' : 'PDF'}</button><button type="button" disabled={Boolean(busy)} onClick={() => generate(sale, false)}><Printer size={15} /> Print / Preview</button></div></td></tr>)}
    </tbody></table></div> : <div className="customer-portal-empty">Choose a design above to create a software or visa contract for this customer.</div>}
    {gallery && <div className="customer-stage-dialog-backdrop" onMouseDown={() => setGallery(null)}><section className="customer-template-gallery" role="dialog" aria-modal="true" aria-labelledby="contract-gallery-title" onMouseDown={event => event.stopPropagation()}>
      <div className="customer-stage-dialog-head"><div><h3 id="contract-gallery-title">Choose Contract Design</h3><p>Preview every design and select the form you need.</p></div><button type="button" aria-label="Close designs" onClick={() => setGallery(null)}><X size={18} /></button></div>
      <div className="customer-template-grid">{CONTRACT_TEMPLATES.map(template => <article className="customer-template-card" key={template.id}>
        <img src={`${import.meta.env.BASE_URL}${template.thumbnail}`} alt={`${template.name} contract design`} />
        <div><h4>{template.name}</h4><p dir="auto">{template.description}</p><small>{template.pages} original pages</small>
        {template.id === 'software-sale' && <label className="customer-stage-field"><span>Related software sale (optional)</span><select value={gallery.sale?._contractSource === 'sale' ? gallery.sale.id : ''} onChange={event => setGallery({ ...gallery, sale: records.find(record => record._contractSource === 'sale' && String(record.id) === event.target.value) || null })}><option value="">Select a sale</option>{sales.map(sale => <option key={sale.id} value={sale.id}>{sale.projectName} · {contractNumber(sale)}</option>)}</select>{!sales.length && <small>No sale is required: enter project and payment details in the form.</small>}</label>}
        <div className="customer-contract-actions"><button type="button" onClick={() => setPreview({ url: `${import.meta.env.BASE_URL}${template.file}`, filename: `${template.id}-template.pdf` })}>View all pages</button><button type="button" onClick={() => chooseTemplate(template)}>Use this design</button></div></div>
      </article>)}</div>
    </section></div>}
    {editing && <div className="customer-stage-dialog-backdrop" onMouseDown={() => !saving && setEditing(null)}><form className="customer-stage-dialog customer-contract-dialog" role="dialog" aria-modal="true" aria-labelledby="contract-title" onMouseDown={e => e.stopPropagation()} onSubmit={save}>
      <div className="customer-stage-dialog-head"><div><h3 id="contract-title">{getContractTemplate(templateId)?.name}</h3><p>{contractNumber(editing)} · {editing.projectName}</p></div><button type="button" disabled={saving} onClick={() => setEditing(null)} aria-label="Close contract"><X size={18} /></button></div>
      <p className="customer-contract-note">{templateId === 'turkey-visa' ? 'Enter the applicant and USD payment details for the Turkey visa agreement. The original terms and blank signature spaces are preserved.' : editing.contractStandalone ? 'Enter project and payment details below. The project code and expiry date are calculated automatically.' : 'Projects, unique codes, plans, start/expiry dates and payments are filled from the sale. Complete the remaining details below.'}</p>
      <fieldset disabled={saving} className="customer-contract-fields">{contractFields(templateId, editing.contractStandalone).map(([key, label, type = 'text', options]) => <label className={`customer-stage-field ${type === 'textarea' ? 'contract-wide' : ''}`} key={key}><span>{label}</span>{type === 'select' ? <select required value={details[key] || ''} onChange={e => setDetails({ ...details, [key]: e.target.value })}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select> : type === 'textarea' ? <textarea required rows={4} maxLength={6000} value={details[key] || ''} onChange={e => setDetails({ ...details, [key]: e.target.value })} /> : <input required type={type} min={type === 'number' ? (key === 'paidAmount' ? 0 : key === 'totalAmount' ? 0.01 : 1) : undefined} step={type === 'number' ? (['totalAmount', 'paidAmount'].includes(key) ? '0.01' : 1) : undefined} maxLength={key === 'address' ? 180 : 120} value={details[key] || ''} onChange={e => setDetails({ ...details, [key]: e.target.value })} />}</label>)}</fieldset>
      {templateId === 'software-sale' && editing.contractStandalone && <p className="customer-contract-note">Project code: {projectUniqueCode(editing.id)} · Expiry: {details.salePlan === 'lifetime' ? 'Lifetime - No expiry' : salePlanEndDate(details.startDate, details.salePlan) || 'Choose a start date and plan'}</p>}
      <div className="customer-stage-dialog-actions"><button type="button" className="cancel" disabled={saving} onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="save" disabled={saving}>{saving ? 'Saving...' : 'Save Contract Details'}</button></div>
    </form></div>}
    {preview && <div className="customer-stage-dialog-backdrop"><div className="customer-contract-preview" role="dialog" aria-modal="true" aria-label="Contract PDF preview"><div className="customer-contract-actions"><a href={preview.url} download={preview.filename}><Download size={15} /> Download PDF</a><button type="button" onClick={() => { try { frame.current?.contentWindow?.focus(); frame.current?.contentWindow?.print(); } catch { notify('Use the print button in the PDF toolbar.', 'info'); } }}><Printer size={15} /> Print</button><button type="button" onClick={() => setPreview(null)}><X size={15} /> Close</button></div><iframe ref={frame} src={preview.url} title="Completed contract PDF" /></div></div>}
  </div>;
}
