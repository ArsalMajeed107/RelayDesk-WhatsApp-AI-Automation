import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

interface NewConversationModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: {
    customerName: string;
    phone: string;
    initialMessage: string;
  }) => Promise<void>;
  submitting: boolean;
}

const PRESETS = [
  {
    label: 'Order Inquiry',
    name: 'Liam Carter',
    phone: '+1 (415) 702-9910',
    message: 'Hi! Can you check the status of order #ORD-4808?',
  },
  {
    label: 'Book Consultation',
    name: 'Sofia Patel',
    phone: '+1 (212) 488-3021',
    message: 'Hello, I would like to book a Virtual Interior Styling consultation for 2026-11-20. What slots are open?',
  },
  {
    label: 'Trade Lead',
    name: 'Noah Meyer',
    phone: '+1 (310) 904-1122',
    message: 'Do you offer trade pricing for boutique hotels? Yes, you can save my email noah@meyerdesign.com to send a quote.',
  },
];

export function NewConversationModal({
  open,
  onClose,
  onCreate,
  submitting,
}: NewConversationModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('+1 (415) 555-0182');
  const [initialMessage, setInitialMessage] = useState('');
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!customerName.trim() || !phone.trim()) {
      setError('Customer name and WhatsApp phone number are required.');
      return;
    }
    try {
      await onCreate({
        customerName: customerName.trim(),
        phone: phone.trim(),
        initialMessage: initialMessage.trim(),
      });
      setCustomerName('');
      setInitialMessage('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start conversation.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Start Simulated WhatsApp Chat
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Send an incoming customer message to test Gemini AI auto-reply and tool automation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-600 mb-2">Quick Scenario Presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setCustomerName(preset.name);
                    setPhone(preset.phone);
                    setInitialMessage(preset.message);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Jordan Rivera"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (415) 555-0182"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Opening WhatsApp Message
            </label>
            <textarea
              rows={3}
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Ask about an order, consultation slot, product FAQ, or request a human specialist..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {submitting ? 'Sending & Running AI...' : 'Start Conversation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
