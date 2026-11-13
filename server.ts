import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { generateAgentDraftReply, generateWhatsAppAiReply } from './server/ai.ts';
import { store } from './server/store.ts';
import type {
  Appointment,
  AutomationRule,
  Conversation,
  FaqItem,
  Lead,
  Message,
  Order,
  WebhookLog,
} from './src/types.ts';

const PORT = 3000;
const CUSTOMER_AVATARS = [
  '/src/assets/images/avatar_customer_elena_1794578246591.jpg',
  '/src/assets/images/avatar_customer_marcus_1794578247030.jpg',
  '/src/assets/images/avatar_customer_priya_1794578247090.jpg',
  '/src/assets/images/avatar_customer_david_1794578247770.jpg',
];

function appendWebhookLog(log: Omit<WebhookLog, 'id' | 'timestamp'>) {
  store.update((draft) => {
    draft.webhookLogs.unshift({
      ...log,
      id: `wh-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
    });
    if (draft.webhookLogs.length > 50) {
      draft.webhookLogs = draft.webhookLogs.slice(0, 50);
    }
  });
}

async function dispatchOutboundWhatsAppIfConfigured(toPhone: string, text: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { dispatchedLive: false };
  }
  const normalizedTo = toPhone.replace(/\D/g, '');
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalizedTo,
      type: 'text',
      text: { body: text },
    }),
  });
  return { dispatchedLive: res.ok, status: res.status };
}

async function processCustomerMessage(conversationId: string, text: string, sourceLabel: string) {
  const nowIso = new Date().toISOString();
  let targetConv: Conversation | undefined;

  store.update((draft) => {
    const conv = draft.conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    targetConv = conv;

    const customerMsg: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      sender: 'customer',
      text,
      timestamp: nowIso,
      status: 'read',
    };

    conv.messages.push(customerMsg);
    conv.lastMessageAt = nowIso;
    conv.lastMessagePreview = text;
    conv.unreadCount += 1;

    if (conv.mode === 'resolved') {
      conv.mode = conv.aiAutoReplyEnabled ? 'ai' : 'human';
    }
  });

  if (!targetConv) {
    throw new Error('Conversation not found');
  }

  appendWebhookLog({
    direction: 'inbound',
    eventType: sourceLabel,
    phone: targetConv.phone,
    summary: `${targetConv.customerName}: "${text.slice(0, 90)}"`,
    payloadPreview: JSON.stringify({
      object: 'whatsapp_business_account',
      from: targetConv.phone,
      text: text.slice(0, 120),
    }),
    status: 'ok',
  });

  const currentState = store.getState();
  const convNow = currentState.conversations.find((c) => c.id === conversationId)!;

  const shouldAutoReply =
    currentState.settings.globalAutoReply &&
    convNow.aiAutoReplyEnabled &&
    convNow.mode === 'ai';

  if (!shouldAutoReply) {
    return { aiReplied: false, state: store.getState() };
  }

  const aiResult = await generateWhatsAppAiReply(currentState, convNow);
  const replyIso = new Date().toISOString();

  store.update((draft) => {
    const conv = draft.conversations.find((c) => c.id === conversationId);
    if (!conv) return;

    const aiMsg: Message = {
      id: `msg-${Date.now() + 1}`,
      conversationId,
      sender: 'ai',
      text: aiResult.replyText,
      timestamp: replyIso,
      status: 'delivered',
      toolActions: aiResult.toolActions.length > 0 ? aiResult.toolActions : undefined,
    };

    conv.messages.push(aiMsg);
    conv.lastMessageAt = replyIso;
    conv.lastMessagePreview = aiResult.replyText;
    conv.unreadCount = 0;

    // Sort most recently active conversation to the top
    draft.conversations.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  });

  await dispatchOutboundWhatsAppIfConfigured(convNow.phone, aiResult.replyText).catch(() => null);

  appendWebhookLog({
    direction: 'outbound',
    eventType: convNow.mode === 'human' ? 'handoff.escalated' : 'ai.auto_reply',
    phone: convNow.phone,
    summary:
      aiResult.toolActions.length > 0
        ? `AI replied using ${aiResult.toolActions.map((t) => t.toolName).join(', ')}`
        : `AI auto-replied to ${convNow.customerName}`,
    payloadPreview: JSON.stringify({
      messaging_product: 'whatsapp',
      to: convNow.phone,
      toolsExecuted: aiResult.toolActions.map((t) => t.toolName),
    }),
    status: 'ok',
  });

  return { aiReplied: true, state: store.getState() };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/state', (_req, res) => {
    res.json(store.getState());
  });

  // Start a new simulated customer conversation
  app.post('/api/conversations', async (req, res) => {
    try {
      const customerName = String(req.body.customerName || '').trim();
      const phone = String(req.body.phone || '').trim();
      const initialMessage = String(req.body.initialMessage || '').trim();

      if (!customerName || !phone) {
        return res.status(400).json({ error: 'Customer name and phone number are required.' });
      }

      const convId = `conv-${Date.now()}`;
      const avatarUrl =
        CUSTOMER_AVATARS[store.getState().conversations.length % CUSTOMER_AVATARS.length];
      const nowIso = new Date().toISOString();

      store.update((draft) => {
        draft.conversations.unshift({
          id: convId,
          customerName,
          phone,
          avatarUrl,
          mode: 'ai',
          unreadCount: 0,
          lastMessageAt: nowIso,
          lastMessagePreview: initialMessage || 'New conversation started',
          intent: 'General Inquiry',
          aiAutoReplyEnabled: true,
          messages: [],
        });
      });

      if (initialMessage) {
        const result = await processCustomerMessage(convId, initialMessage, 'messages.text');
        return res.json({ conversationId: convId, ...result });
      }

      return res.json({ conversationId: convId, state: store.getState() });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create conversation';
      appendWebhookLog({
        direction: 'outbound',
        eventType: 'ai.error',
        phone: String(req.body.phone || ''),
        summary: message,
        payloadPreview: JSON.stringify({ error: message }),
        status: 'error',
      });
      return res.status(500).json({ error: message, state: store.getState() });
    }
  });

  // Simulate an incoming WhatsApp message from a customer (triggers AI Auto-Reply if enabled)
  app.post('/api/conversations/:id/simulate-customer', async (req, res) => {
    try {
      const { id } = req.params;
      const text = String(req.body.text || '').trim();
      if (!text) {
        return res.status(400).json({ error: 'Message text is required.' });
      }
      const result = await processCustomerMessage(id, text, 'messages.text');
      return res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI processing failed';
      appendWebhookLog({
        direction: 'outbound',
        eventType: 'ai.error',
        phone: req.params.id,
        summary: message,
        payloadPreview: JSON.stringify({ error: message }),
        status: 'error',
      });
      return res.status(500).json({ error: message, state: store.getState() });
    }
  });

  // Human agent sends a direct reply
  app.post('/api/conversations/:id/agent-reply', async (req, res) => {
    try {
      const { id } = req.params;
      const text = String(req.body.text || '').trim();
      if (!text) {
        return res.status(400).json({ error: 'Reply text is required.' });
      }

      const nowIso = new Date().toISOString();
      let phone = '';

      const updated = store.update((draft) => {
        const conv = draft.conversations.find((c) => c.id === id);
        if (!conv) return;
        phone = conv.phone;
        conv.messages.push({
          id: `msg-${Date.now()}`,
          conversationId: id,
          sender: 'agent',
          text,
          timestamp: nowIso,
          status: 'delivered',
        });
        conv.lastMessageAt = nowIso;
        conv.lastMessagePreview = text;
        conv.unreadCount = 0;
        if (conv.mode === 'ai') {
          conv.mode = 'human';
          conv.aiAutoReplyEnabled = false;
          conv.assignedAgent = draft.settings.agentName;
        }
      });

      if (phone) {
        await dispatchOutboundWhatsAppIfConfigured(phone, text).catch(() => null);
        appendWebhookLog({
          direction: 'outbound',
          eventType: 'agent.reply',
          phone,
          summary: `Human specialist replied: "${text.slice(0, 80)}"`,
          payloadPreview: JSON.stringify({ to: phone, sender: 'agent' }),
          status: 'ok',
        });
      }

      return res.json({ state: updated });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to send agent reply',
      });
    }
  });

  // Generate AI-assisted reply draft for a human agent
  app.post('/api/conversations/:id/ai-draft', async (req, res) => {
    try {
      const state = store.getState();
      const conv = state.conversations.find((c) => c.id === req.params.id);
      if (!conv) {
        return res.status(404).json({ error: 'Conversation not found.' });
      }
      const draft = await generateAgentDraftReply(state, conv);
      return res.json({ draft });
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate AI draft',
      });
    }
  });

  // Update conversation mode, auto-reply toggle, or mark read
  app.patch('/api/conversations/:id', (req, res) => {
    const { id } = req.params;
    const { mode, aiAutoReplyEnabled, unreadCount, handoffReason } = req.body as Partial<Conversation>;

    const updated = store.update((draft) => {
      const conv = draft.conversations.find((c) => c.id === id);
      if (!conv) return;

      if (mode && mode !== conv.mode) {
        conv.mode = mode;
        if (mode === 'human') {
          conv.aiAutoReplyEnabled = false;
          conv.assignedAgent = draft.settings.agentName;
          conv.handoffReason = handoffReason || conv.handoffReason || 'Manual agent takeover';
          conv.messages.push({
            id: `msg-${Date.now()}`,
            conversationId: id,
            sender: 'system',
            text: `Conversation taken over by ${draft.settings.agentName}. AI Auto-Reply paused.`,
            timestamp: new Date().toISOString(),
          });
        } else if (mode === 'ai') {
          conv.aiAutoReplyEnabled = true;
          conv.handoffReason = undefined;
          conv.messages.push({
            id: `msg-${Date.now()}`,
            conversationId: id,
            sender: 'system',
            text: 'AI Auto-Reply resumed for this conversation.',
            timestamp: new Date().toISOString(),
          });
        } else if (mode === 'resolved') {
          conv.messages.push({
            id: `msg-${Date.now()}`,
            conversationId: id,
            sender: 'system',
            text: 'Conversation marked as resolved.',
            timestamp: new Date().toISOString(),
          });
        }
      }

      if (typeof aiAutoReplyEnabled === 'boolean') {
        conv.aiAutoReplyEnabled = aiAutoReplyEnabled;
      }
      if (typeof unreadCount === 'number') {
        conv.unreadCount = unreadCount;
      }
    });

    res.json({ state: updated });
  });

  // Orders CRUD
  app.post('/api/orders', (req, res) => {
    const body = req.body as Partial<Order>;
    const updated = store.update((draft) => {
      const orderNum =
        body.orderNumber?.trim() || `ORD-${4822 + draft.orders.length}`;
      draft.orders.unshift({
        id: `ord-${Date.now()}`,
        orderNumber: orderNum,
        customerName: String(body.customerName || 'Walk-in Customer'),
        phone: String(body.phone || '+1 (415) 555-0100'),
        items: String(body.items || 'Custom Home Order'),
        totalAmount: Number(body.totalAmount || 0),
        status: body.status || 'Processing',
        trackingCode: String(body.trackingCode || 'PENDING-DISPATCH'),
        eta: String(body.eta || new Date(Date.now() + 4 * 86400_000).toISOString().slice(0, 10)),
        updatedAt: new Date().toISOString(),
      });
    });
    res.json({ state: updated });
  });

  app.patch('/api/orders/:id', (req, res) => {
    const body = req.body as Partial<Order>;
    const updated = store.update((draft) => {
      const ord = draft.orders.find((o) => o.id === req.params.id);
      if (!ord) return;
      if (body.status) ord.status = body.status;
      if (body.eta !== undefined) ord.eta = body.eta;
      if (body.trackingCode !== undefined) ord.trackingCode = body.trackingCode;
      ord.updatedAt = new Date().toISOString();
    });
    res.json({ state: updated });
  });

  // Appointments CRUD
  app.post('/api/appointments', (req, res) => {
    const body = req.body as Partial<Appointment>;
    const updated = store.update((draft) => {
      const nextCode = `APT-${212 + draft.appointments.length}`;
      draft.appointments.unshift({
        id: `apt-${Date.now()}`,
        bookingCode: nextCode,
        customerName: String(body.customerName || 'Guest'),
        phone: String(body.phone || ''),
        service: String(body.service || 'Virtual Interior Styling (30 min)'),
        date: String(body.date || new Date().toISOString().slice(0, 10)),
        timeSlot: String(body.timeSlot || '14:00'),
        status: body.status || 'Confirmed',
        notes: String(body.notes || ''),
        createdAt: new Date().toISOString(),
      });
    });
    res.json({ state: updated });
  });

  app.patch('/api/appointments/:id', (req, res) => {
    const body = req.body as Partial<Appointment>;
    const updated = store.update((draft) => {
      const apt = draft.appointments.find((a) => a.id === req.params.id);
      if (!apt) return;
      if (body.status) apt.status = body.status;
      if (body.date) apt.date = body.date;
      if (body.timeSlot) apt.timeSlot = body.timeSlot;
    });
    res.json({ state: updated });
  });

  // Leads CRUD
  app.post('/api/leads', (req, res) => {
    const body = req.body as Partial<Lead>;
    const updated = store.update((draft) => {
      draft.leads.unshift({
        id: `lead-${Date.now()}`,
        name: String(body.name || 'Prospect'),
        phone: String(body.phone || ''),
        email: String(body.email || ''),
        interest: String(body.interest || ''),
        consentGiven: Boolean(body.consentGiven ?? true),
        consentTimestamp: new Date().toISOString(),
        source: String(body.source || 'Manual Entry'),
        status: body.status || 'New',
        notes: String(body.notes || ''),
      });
    });
    res.json({ state: updated });
  });

  app.patch('/api/leads/:id', (req, res) => {
    const body = req.body as Partial<Lead>;
    const updated = store.update((draft) => {
      const lead = draft.leads.find((l) => l.id === req.params.id);
      if (!lead) return;
      if (body.status) lead.status = body.status;
      if (body.notes !== undefined) lead.notes = body.notes;
    });
    res.json({ state: updated });
  });

  // FAQs CRUD
  app.post('/api/faqs', (req, res) => {
    const body = req.body as Partial<FaqItem>;
    const updated = store.update((draft) => {
      draft.faqs.unshift({
        id: `faq-${Date.now()}`,
        category: String(body.category || 'General'),
        question: String(body.question || ''),
        answer: String(body.answer || ''),
        active: body.active ?? true,
      });
    });
    res.json({ state: updated });
  });

  app.patch('/api/faqs/:id', (req, res) => {
    const body = req.body as Partial<FaqItem>;
    const updated = store.update((draft) => {
      const faq = draft.faqs.find((f) => f.id === req.params.id);
      if (!faq) return;
      if (body.active !== undefined) faq.active = body.active;
      if (body.question !== undefined) faq.question = body.question;
      if (body.answer !== undefined) faq.answer = body.answer;
      if (body.category !== undefined) faq.category = body.category;
    });
    res.json({ state: updated });
  });

  app.delete('/api/faqs/:id', (req, res) => {
    const updated = store.update((draft) => {
      draft.faqs = draft.faqs.filter((f) => f.id !== req.params.id);
    });
    res.json({ state: updated });
  });

  // Automation Rules CRUD
  app.post('/api/rules', (req, res) => {
    const body = req.body as Partial<AutomationRule>;
    const updated = store.update((draft) => {
      draft.rules.push({
        id: `rule-${Date.now()}`,
        name: String(body.name || 'New Automation Rule'),
        triggerType: body.triggerType || 'intent',
        triggerValue: String(body.triggerValue || ''),
        actionSummary: String(body.actionSummary || ''),
        enabled: body.enabled ?? true,
        executionsCount: 0,
      });
    });
    res.json({ state: updated });
  });

  app.patch('/api/rules/:id', (req, res) => {
    const body = req.body as Partial<AutomationRule>;
    const updated = store.update((draft) => {
      const rule = draft.rules.find((r) => r.id === req.params.id);
      if (!rule) return;
      if (body.enabled !== undefined) rule.enabled = body.enabled;
      if (body.name !== undefined) rule.name = body.name;
    });
    res.json({ state: updated });
  });

  app.delete('/api/rules/:id', (req, res) => {
    const updated = store.update((draft) => {
      draft.rules = draft.rules.filter((r) => r.id !== req.params.id);
    });
    res.json({ state: updated });
  });

  // Business Settings
  app.patch('/api/settings', (req, res) => {
    const updated = store.update((draft) => {
      draft.settings = {
        ...draft.settings,
        ...req.body,
      };
    });
    res.json({ state: updated });
  });

  // Meta WhatsApp Business Cloud API Webhook Verification
  app.get('/api/webhook/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'relaydesk_verify_token';

    if (mode === 'subscribe' && token === expectedToken) {
      return res.status(200).send(String(challenge ?? 'OK'));
    }
    return res.status(403).json({ error: 'Verification token mismatch.' });
  });

  // Meta WhatsApp Business Cloud API Inbound Webhook Receiver
  app.post('/api/webhook/whatsapp', async (req, res) => {
    try {
      const payload = req.body as Record<string, any>;
      const entry = payload?.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const incomingMsg = change?.messages?.[0];
      const contact = change?.contacts?.[0];

      if (!incomingMsg || !incomingMsg.text?.body) {
        return res.status(200).json({ received: true, ignored: 'No text message in payload' });
      }

      const rawFrom = String(incomingMsg.from || '');
      const formattedPhone = rawFrom.startsWith('+') ? rawFrom : `+${rawFrom}`;
      const senderName = String(contact?.profile?.name || `WhatsApp User ${rawFrom.slice(-4)}`);
      const textBody = String(incomingMsg.text.body);

      let convId = store
        .getState()
        .conversations.find(
          (c) => c.phone.replace(/\D/g, '') === rawFrom.replace(/\D/g, '')
        )?.id;

      if (!convId) {
        convId = `conv-${Date.now()}`;
        const avatarUrl =
          CUSTOMER_AVATARS[store.getState().conversations.length % CUSTOMER_AVATARS.length];
        store.update((draft) => {
          draft.conversations.unshift({
            id: convId!,
            customerName: senderName,
            phone: formattedPhone,
            avatarUrl,
            mode: 'ai',
            unreadCount: 0,
            lastMessageAt: new Date().toISOString(),
            lastMessagePreview: textBody,
            intent: 'Cloud API Inbound',
            aiAutoReplyEnabled: true,
            messages: [],
          });
        });
      }

      const result = await processCustomerMessage(convId, textBody, 'webhook.whatsapp_cloud');
      return res.status(200).json({
        received: true,
        conversationId: convId,
        aiReplied: result.aiReplied,
        state: result.state,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Webhook processing error';
      appendWebhookLog({
        direction: 'inbound',
        eventType: 'webhook.error',
        phone: 'unknown',
        summary: message,
        payloadPreview: JSON.stringify(req.body).slice(0, 160),
        status: 'error',
      });
      return res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RelayDesk WhatsApp AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
