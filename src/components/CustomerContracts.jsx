import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Printer, X } from 'lucide-react';
import { CONTRACT_FIELDS, contractDefaults, contractItems, contractNumber, contractProjectCode, validateContract } from '../utils/customerContract';
import { notify } from '../utils/notify';
import { formatCurrencyAmount } from '../utils/currencyDisplay';

export default function CustomerContracts({ sales, customer, setSales }) {
  const [editing, setEditing] = useState(null);
  const [details, setDetails] = useState({});
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');
  const [preview, setPreview] = useState(null);
  const frame = useRef(null);
  useEffect(() => () => { if (preview?.url) URL.revokeObjectURL(preview.url); }, [preview]);
  const edit = sale => { setDetails(contractDefaults(sale, customer)); setEditing(sale); };
  const save = async event => {
    event.preventDefault();
    if (saving) return;
    const error = validateContract(details);
    if (error) { notify(error, 'error'); return; }
    setSaving(true);
    try {
      const trimmed = Object.fromEntries(Object.entries(details).map(([key, value]) => [key, String(value).trim()]));
      const saved = await setSales(previous => previous.map(sale => String(sale.id) === String(editing.id)
        ? { ...sale, contractId: contractNumber(sale), contractDetails: trimmed, contractUpdatedAt: new Date().toISOString() } : sale));
      if (saved) { setEditing(null); notify('Contract details saved.', 'success'); }
    } finally { setSaving(false); }
  };
  const generate = async (sale, download) => {
    if (busy) return;
    const data = contractDefaults(sale, customer);
    const error = validateContract(data);
    if (error) { edit(sale); notify('Complete the remaining contract details first.', 'warning'); return; }
    setBusy(String(sale.id));
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}contract-template.pdf`);
      if (!response.ok) throw new Error('Unable to load the contract template.');
      const { generateContractPdf } = await import('../utils/contractPdf');
      const bytes = await generateContractPdf(await response.arrayBuffer(), sale, data);
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
      const filename = `Contract-${String(sale.id).replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
      if (download) {
        const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
        document.body.append(anchor); anchor.click(); anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else setPreview({ url, filename });
    } catch (error) { notify(error.message || 'Unable to generate contract PDF.', 'error'); }
    finally { setBusy(''); }
  };
  return <div className="customer-contracts">
    <div className="customer-ledger-heading"><div><h3>Sales Contracts</h3><p>Each registered sale appears here. Complete missing details, then download or print the filled contract.</p></div></div>
    {sales.length ? <div className="customer-data-table"><table><thead><tr><th>Contract</th><th>Projects / Codes</th><th>Date</th><th>Total</th><th>Details</th><th>Actions</th></tr></thead><tbody>
      {sales.map(sale => <tr key={sale.id}><td><strong>{contractNumber(sale)}</strong></td><td>{contractItems(sale).map((item, index) => <div key={index}>{item.projectName}<small className="customer-contract-code">{contractProjectCode(item)}</small></div>)}</td><td>{sale.contractDetails?.contractDate || sale.saleDate || '—'}</td><td>{formatCurrencyAmount(sale.total ?? sale.price, sale.currency)}</td><td>{validateContract(contractDefaults(sale, customer)) ? 'Needs details' : 'Ready'}</td><td><div className="customer-contract-actions"><button type="button" onClick={() => edit(sale)}><FileText size={15} /> Complete / Edit</button><button type="button" disabled={Boolean(busy)} onClick={() => generate(sale, true)}><Download size={15} /> {busy === String(sale.id) ? 'Preparing...' : 'PDF'}</button><button type="button" disabled={Boolean(busy)} onClick={() => generate(sale, false)}><Printer size={15} /> Print / Preview</button></div></td></tr>)}
    </tbody></table></div> : <div className="customer-portal-empty">Register a project sale for this customer to create a contract.</div>}
    {editing && <div className="customer-stage-dialog-backdrop" onMouseDown={() => !saving && setEditing(null)}><form className="customer-stage-dialog customer-contract-dialog" role="dialog" aria-modal="true" aria-labelledby="contract-title" onMouseDown={e => e.stopPropagation()} onSubmit={save}>
      <div className="customer-stage-dialog-head"><div><h3 id="contract-title">Complete Contract</h3><p>{contractNumber(editing)} · {editing.projectName}</p></div><button type="button" disabled={saving} onClick={() => setEditing(null)} aria-label="Close contract"><X size={18} /></button></div>
      <p className="customer-contract-note">Projects, unique codes, plans, start/expiry dates, total, advance and remaining payment are filled automatically from the sale. Signatures remain blank for signing.</p>
      <fieldset disabled={saving} className="customer-contract-fields">{CONTRACT_FIELDS.map(([key, label, type = 'text']) => <label className={`customer-stage-field ${type === 'textarea' ? 'contract-wide' : ''}`} key={key}><span>{label}</span>{type === 'textarea' ? <textarea required rows={4} maxLength={6000} value={details[key] || ''} onChange={e => setDetails({ ...details, [key]: e.target.value })} /> : <input required type={type} min={type === 'number' ? 1 : undefined} step={type === 'number' ? 1 : undefined} maxLength={key === 'address' ? 180 : 120} value={details[key] || ''} onChange={e => setDetails({ ...details, [key]: e.target.value })} />}</label>)}</fieldset>
      <div className="customer-stage-dialog-actions"><button type="button" className="cancel" disabled={saving} onClick={() => setEditing(null)}>Cancel</button><button type="submit" className="save" disabled={saving}>{saving ? 'Saving...' : 'Save Contract Details'}</button></div>
    </form></div>}
    {preview && <div className="customer-stage-dialog-backdrop"><div className="customer-contract-preview" role="dialog" aria-modal="true" aria-label="Contract PDF preview"><div className="customer-contract-actions"><a href={preview.url} download={preview.filename}><Download size={15} /> Download PDF</a><button type="button" onClick={() => { try { frame.current?.contentWindow?.focus(); frame.current?.contentWindow?.print(); } catch { notify('Use the print button in the PDF toolbar.', 'info'); } }}><Printer size={15} /> Print</button><button type="button" onClick={() => setPreview(null)}><X size={15} /> Close</button></div><iframe ref={frame} src={preview.url} title="Completed contract PDF" /></div></div>}
  </div>;
}
