import { Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { AutomationRule, BusinessSettings, FaqItem, WorkspaceState } from '../types';

interface KnowledgeRulesViewProps {
  state: WorkspaceState;
  onUpdateSettings: (patch: Partial<BusinessSettings>) => Promise<void>;
  onCreateFaq: (payload: Partial<FaqItem>) => Promise<void>;
  onUpdateFaq: (id: string, patch: Partial<FaqItem>) => Promise<void>;
  onDeleteFaq: (id: string) => Promise<void>;
  onCreateRule: (payload: Partial<AutomationRule>) => Promise<void>;
  onUpdateRule: (id: string, patch: Partial<AutomationRule>) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
}

export function KnowledgeRulesView({
  state,
  onUpdateSettings,
  onCreateFaq,
  onUpdateFaq,
  onDeleteFaq,
  onCreateRule,
  onUpdateRule,
  onDeleteRule,
}: KnowledgeRulesViewProps) {
  const [settingsForm, setSettingsForm] = useState<BusinessSettings>(state.settings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const [faqCategory, setFaqCategory] = useState('Customer Support');
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  const [ruleName, setRuleName] = useState('');
  const [ruleTrigger, setRuleTrigger] = useState('');
  const [ruleAction, setRuleAction] = useState('');

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSavedNotice(false);
    try {
      await onUpdateSettings(settingsForm);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddFaq = async (e: FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) return;
    await onCreateFaq({
      category: faqCategory.trim() || 'General',
      question: faqQuestion.trim(),
      answer: faqAnswer.trim(),
      active: true,
    });
    setFaqQuestion('');
    setFaqAnswer('');
  };

  const handleAddRule = async (e: FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim() || !ruleTrigger.trim() || !ruleAction.trim()) return;
    await onCreateRule({
      name: ruleName.trim(),
      triggerType: 'intent',
      triggerValue: ruleTrigger.trim(),
      actionSummary: ruleAction.trim(),
      enabled: true,
    });
    setRuleName('');
    setRuleTrigger('');
    setRuleAction('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-6xl">
      {/* 24/7 Availability & AI Behavior Settings */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              AI Assistant & 24/7 Availability Configuration
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Control global WhatsApp auto-reply behavior, tone, operating schedule, and human escalation rules.
            </p>
          </div>
          {savedNotice && (
            <span className="text-xs font-medium text-teal-800">Settings saved</span>
          )}
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-center justify-between gap-4 p-4 border border-slate-200 rounded-lg cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-900">Global AI Auto-Reply</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically respond to incoming WhatsApp messages in AI-active threads.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.globalAutoReply}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, globalAutoReply: e.target.checked })
                }
                className="w-4 h-4 accent-teal-700 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-4 p-4 border border-slate-200 rounded-lg cursor-pointer">
              <div>
                <p className="text-sm font-medium text-slate-900">24/7 Always-On Coverage</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Handle customer queries, bookings, and order checks around the clock.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settingsForm.alwaysAvailable247}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, alwaysAvailable247: e.target.checked })
                }
                className="w-4 h-4 accent-teal-700 cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Business Display Name
              </label>
              <input
                type="text"
                value={settingsForm.businessName}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, businessName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Operator / Specialist Name
              </label>
              <input
                type="text"
                value={settingsForm.agentName}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, agentName: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                AI Communication Tone
              </label>
              <select
                value={settingsForm.tone}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    tone: e.target.value as BusinessSettings['tone'],
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
              >
                <option value="Warm & Concise">Warm & Concise</option>
                <option value="Formal Enterprise">Formal Enterprise</option>
                <option value="Friendly Retail">Friendly Retail</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Operating Hours
              </label>
              <input
                type="text"
                value={settingsForm.operatingHours}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, operatingHours: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Human Handoff Escalation Policy
            </label>
            <textarea
              rows={2}
              value={settingsForm.handoffThreshold}
              onChange={(e) =>
                setSettingsForm({ ...settingsForm, handoffThreshold: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-700 rounded-lg hover:bg-teal-800 disabled:opacity-60 cursor-pointer"
            >
              {savingSettings ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </section>

      {/* Business FAQ Knowledge Base */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Customer Support Knowledge Base (FAQs)
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Active entries are grounded directly into Gemini AI responses in real time.
          </p>
        </div>

        <form onSubmit={handleAddFaq} className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-5 border-b border-slate-100">
          <input
            type="text"
            value={faqCategory}
            onChange={(e) => setFaqCategory(e.target.value)}
            placeholder="Category"
            className="md:col-span-2 px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <input
            type="text"
            value={faqQuestion}
            onChange={(e) => setFaqQuestion(e.target.value)}
            placeholder="Frequently asked question..."
            className="md:col-span-4 px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <input
            type="text"
            value={faqAnswer}
            onChange={(e) => setFaqAnswer(e.target.value)}
            placeholder="Authoritative answer..."
            className="md:col-span-4 px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <button
            type="submit"
            className="md:col-span-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add FAQ</span>
          </button>
        </form>

        <div className="divide-y divide-slate-100">
          {state.faqs.map((faq) => (
            <div key={faq.id} className="py-4 flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <p className="text-xs font-medium text-teal-800">{faq.category}</p>
                <p className="text-sm font-semibold text-slate-900">{faq.question}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={faq.active}
                    onChange={(e) => onUpdateFaq(faq.id, { active: e.target.checked })}
                    className="accent-teal-700 cursor-pointer"
                  />
                  <span>Active</span>
                </label>
                <button
                  type="button"
                  onClick={() => onDeleteFaq(faq.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                  aria-label={`Delete FAQ ${faq.question}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Business Automation Rules */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-900">
            Business Automation Workflows
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Automated triggers executed by the WhatsApp AI engine during live conversations.
          </p>
        </div>

        <form onSubmit={handleAddRule} className="grid grid-cols-1 md:grid-cols-12 gap-3 pb-5 border-b border-slate-100">
          <input
            type="text"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            placeholder="Workflow name"
            className="md:col-span-3 px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <input
            type="text"
            value={ruleTrigger}
            onChange={(e) => setRuleTrigger(e.target.value)}
            placeholder="Trigger condition or customer intent..."
            className="md:col-span-4 px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <input
            type="text"
            value={ruleAction}
            onChange={(e) => setRuleAction(e.target.value)}
            placeholder="Automated action..."
            className="md:col-span-3 px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <button
            type="submit"
            className="md:col-span-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Rule</span>
          </button>
        </form>

        <div className="divide-y divide-slate-100">
          {state.rules.map((rule) => (
            <div key={rule.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span>{rule.name}</span>
                  <span className="text-xs font-normal font-mono tabular-nums text-slate-500">
                    · {rule.executionsCount} runs
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  When: {rule.triggerValue} → {rule.actionSummary}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.enabled}
                    onChange={(e) => onUpdateRule(rule.id, { enabled: e.target.checked })}
                    className="accent-teal-700 cursor-pointer"
                  />
                  <span>Enabled</span>
                </label>
                <button
                  type="button"
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 cursor-pointer"
                  aria-label={`Delete rule ${rule.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
