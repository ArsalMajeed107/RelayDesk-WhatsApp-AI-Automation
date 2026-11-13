import { Download, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Lead, LeadStatus, WorkspaceState } from '../types';

interface LeadsViewProps {
  state: WorkspaceState;
  onUpdateLead: (id: string, patch: Partial<Lead>) => Promise<void>;
}

const LEAD_STATUSES: LeadStatus[] = ['New', 'Qualified', 'Contacted', 'Converted'];

export function LeadsView({ state, onUpdateLead }: LeadsViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.leads.filter((lead) => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (!q) return true;
      return (
        lead.name.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.interest.toLowerCase().includes(q)
      );
    });
  }, [state.leads, search, statusFilter]);

  const handleExportCsv = () => {
    const headers = ['Name', 'Phone', 'Email', 'Interest', 'Consent', 'Consent Timestamp', 'Source', 'Status'];
    const rows = filteredLeads.map((l) => [
      l.name,
      l.phone,
      l.email,
      l.interest,
      l.consentGiven ? 'Yes' : 'No',
      l.consentTimestamp,
      l.source,
      l.status,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relaydesk-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Consent-Verified Lead Pipeline
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Inquiries and contact details collected automatically after explicit customer opt-in on WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 self-start cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 bg-slate-200/70 rounded-lg self-start overflow-x-auto">
          {(['all', ...LEAD_STATUSES] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                statusFilter === status
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status === 'all' ? 'All Leads' : status}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lead name, email, interest..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-teal-700"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Inquiry Interest</th>
                <th className="py-3 px-4">Consent Status</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    No consented leads found. Test lead capture in the Inbox simulator to add entries here.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4">
                      <p className="font-medium text-slate-900">{lead.name}</p>
                      <p className="text-xs font-mono tabular-nums text-slate-500 mt-0.5">
                        {lead.phone} · {lead.email}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="text-slate-800">{lead.interest}</p>
                      {lead.notes && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{lead.notes}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-teal-800">
                        <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                        <span>{lead.consentGiven ? 'Consent Granted' : 'Pending'}</span>
                      </div>
                      <p className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                        {new Date(lead.consentTimestamp).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {lead.source}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        aria-label={`Lead status for ${lead.name}`}
                        value={lead.status}
                        onChange={(e) =>
                          onUpdateLead(lead.id, { status: e.target.value as LeadStatus })
                        }
                        className="text-xs font-medium px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-800 focus:outline-none focus:border-teal-700 cursor-pointer"
                      >
                        {LEAD_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
