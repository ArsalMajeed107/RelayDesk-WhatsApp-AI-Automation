import { Check, Copy, Play } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { WorkspaceState } from '../types';

interface CloudApiViewProps {
  state: WorkspaceState;
  onRefreshState: (nextState: WorkspaceState) => void;
  onOpenThread: (conversationId: string) => void;
}

export function CloudApiView({
  state,
  onRefreshState,
  onOpenThread,
}: CloudApiViewProps) {
  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhook/whatsapp`
      : '/api/webhook/whatsapp';

  const [copied, setCopied] = useState(false);
  const [senderName, setSenderName] = useState('Maya Lin');
  const [senderPhone, setSenderPhone] = useState('14155550177');
  const [messageText, setMessageText] = useState(
    'Hi! Are virtual design consultations free, and what slots do you have on 2026-11-21?'
  );
  const [testing, setTesting] = useState(false);
  const [lastResponse, setLastResponse] = useState<string>('');
  const [lastConvId, setLastConvId] = useState<string>('');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTestWebhook = async (e: FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setLastResponse('');
    try {
      const metaPayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '109283746501',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: state.settings.whatsappDisplayPhone,
                    phone_number_id: '104928172635',
                  },
                  contacts: [
                    {
                      profile: { name: senderName },
                      wa_id: senderPhone.replace(/\D/g, ''),
                    },
                  ],
                  messages: [
                    {
                      from: senderPhone.replace(/\D/g, ''),
                      id: `wamid.HBgM${Date.now()}`,
                      timestamp: String(Math.floor(Date.now() / 1000)),
                      text: { body: messageText },
                      type: 'text',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const res = await fetch('/api/webhook/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaPayload),
      });
      const data = await res.json();
      if (data.state) {
        onRefreshState(data.state);
      }
      if (data.conversationId) {
        setLastConvId(data.conversationId);
      }
      setLastResponse(
        JSON.stringify(
          {
            httpStatus: res.status,
            received: data.received,
            conversationId: data.conversationId,
            aiReplied: data.aiReplied,
            error: data.error,
          },
          null,
          2
        )
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta Cloud API Endpoint Card */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              WhatsApp Business Cloud API Endpoint
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Connect Meta for Developers webhooks directly to this server to handle real incoming WhatsApp messages.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Callback Webhook URL (GET verify & POST events)
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800 truncate">
                  {webhookUrl}
                </code>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-teal-700" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-slate-500">Default Verify Token</p>
                <p className="font-mono font-medium text-slate-900 mt-1">
                  relaydesk_verify_token
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-slate-500">Business Display Number</p>
                <p className="font-mono font-medium text-slate-900 tabular-nums mt-1">
                  {state.settings.whatsappDisplayPhone}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Cloud API Webhook Payload Simulator */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Test Inbound Cloud API Webhook
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Dispatches a live Meta <code className="font-mono text-xs">whatsapp_business_account</code> payload to the server webhook.
            </p>
          </div>

          <form onSubmit={handleSendTestWebhook} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contact Profile Name
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sender wa_id (Digits)
                </label>
                <input
                  type="text"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Webhook Text Body
              </label>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="submit"
                disabled={testing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-60 whitespace-nowrap cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>{testing ? 'Executing Webhook...' : 'Dispatch Webhook'}</span>
              </button>

              {lastConvId && (
                <button
                  type="button"
                  onClick={() => onOpenThread(lastConvId)}
                  className="text-xs font-medium text-teal-800 hover:underline cursor-pointer"
                >
                  Open thread in Inbox
                </button>
              )}
            </div>
          </form>

          {lastResponse && (
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
              {lastResponse}
            </pre>
          )}
        </section>
      </div>

      {/* Webhook & AI Event Log Table */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-display text-base font-semibold text-slate-900">
            Recent Webhook & Dispatch Activity
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Direction</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Summary</th>
                <th className="py-3 px-4">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {state.webhookLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-700 capitalize whitespace-nowrap">
                    {log.direction}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-700 whitespace-nowrap">
                    {log.eventType}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                    {log.phone}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-700 max-w-md truncate">
                    {log.summary}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium whitespace-nowrap">
                    <span className={log.status === 'ok' ? 'text-teal-800' : 'text-red-700'}>
                      {log.status === 'ok' ? 'OK' : 'Error'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
