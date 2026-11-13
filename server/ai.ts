import { Content, FunctionDeclaration, GoogleGenAI, Type } from '@google/genai';
import type { Conversation, ToolActionLog, WorkspaceState } from '../src/types.ts';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment secrets.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const lookupOrderDeclaration: FunctionDeclaration = {
  name: 'lookup_order',
  description:
    'Look up a customer order in the database by order number (e.g. ORD-4821), customer phone, or customer name.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      orderNumber: {
        type: Type.STRING,
        description: 'Order number such as ORD-4821 (optional if searching by customerName or phone).',
      },
      customerName: {
        type: Type.STRING,
        description: 'Customer full name if orderNumber is not specified.',
      },
      phone: {
        type: Type.STRING,
        description: 'Customer phone number.',
      },
    },
  },
};

const checkAvailableSlotsDeclaration: FunctionDeclaration = {
  name: 'check_available_slots',
  description:
    'Check available 30-minute consultation/appointment time slots for a specific YYYY-MM-DD date.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: {
        type: Type.STRING,
        description: 'Target date in YYYY-MM-DD format.',
      },
    },
    required: ['date'],
  },
};

const bookAppointmentDeclaration: FunctionDeclaration = {
  name: 'book_appointment',
  description:
    'Book a confirmed appointment or consultation for a customer after checking availability or confirming their preferred date and time slot.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerName: { type: Type.STRING, description: 'Full name of the customer.' },
      phone: { type: Type.STRING, description: 'Customer WhatsApp phone number.' },
      service: {
        type: Type.STRING,
        description:
          'Service name, e.g. Virtual Interior Styling (30 min), Custom Dining Table Sizing Consult, or Material Consultation.',
      },
      date: { type: Type.STRING, description: 'Appointment date in YYYY-MM-DD format.' },
      timeSlot: {
        type: Type.STRING,
        description: '24h time slot such as 10:00, 11:00, 14:00, 15:30, or 17:00.',
      },
      notes: { type: Type.STRING, description: 'Brief context about what the customer wants to discuss.' },
    },
    required: ['customerName', 'phone', 'service', 'date', 'timeSlot'],
  },
};

const captureLeadDeclaration: FunctionDeclaration = {
  name: 'capture_lead',
  description:
    'Save a prospective customer lead inquiry to the CRM. ONLY call this tool when the customer has explicitly given consent to store or follow up with their contact details.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Customer name.' },
      phone: { type: Type.STRING, description: 'Customer WhatsApp phone number.' },
      email: { type: Type.STRING, description: 'Customer email address if provided.' },
      interest: { type: Type.STRING, description: 'Summary of product/service inquiry or custom quote request.' },
      consentGiven: {
        type: Type.BOOLEAN,
        description: 'Must be true only if the customer explicitly consented to follow-up or saving their contact details.',
      },
      notes: { type: Type.STRING, description: 'Additional context on consent and project scope.' },
    },
    required: ['name', 'phone', 'interest', 'consentGiven'],
  },
};

const requestHumanHandoffDeclaration: FunctionDeclaration = {
  name: 'request_human_handoff',
  description:
    'Transfer this WhatsApp conversation to a human support agent and pause AI auto-replies. Use whenever the customer asks for a human/manager, reports damaged high-value goods, needs a refund exception, or is frustrated.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: 'Clear summary of why human agent intervention is needed.',
      },
    },
    required: ['reason'],
  },
};

const ALL_SLOTS = ['10:00', '11:00', '14:00', '15:30', '17:00'];

function normalizePhone(p: string) {
  return p.replace(/\D/g, '').slice(-10);
}

function executeTool(
  name: string,
  args: Record<string, unknown>,
  state: WorkspaceState,
  conversation: Conversation
): { result: Record<string, unknown>; log: ToolActionLog } {
  const timestamp = new Date().toISOString();
  const id = `ta-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  if (name === 'lookup_order') {
    const orderNum = String(args.orderNumber ?? '').trim().toUpperCase();
    const targetPhone = normalizePhone(String(args.phone ?? conversation.phone));
    const targetName = String(args.customerName ?? '').trim().toLowerCase();

    const matches = state.orders.filter((o) => {
      if (orderNum && o.orderNumber.toUpperCase() === orderNum) return true;
      if (orderNum && o.orderNumber.toUpperCase().includes(orderNum.replace('#', ''))) return true;
      if (!orderNum && targetPhone && normalizePhone(o.phone) === targetPhone) return true;
      if (!orderNum && targetName && o.customerName.toLowerCase().includes(targetName)) return true;
      return false;
    });

    const rule = state.rules.find((r) => r.id === 'rule-1');
    if (rule) rule.executionsCount += 1;

    return {
      result: { found: matches.length > 0, orders: matches },
      log: {
        id,
        toolName: 'lookup_order',
        summary:
          matches.length > 0
            ? `Looked up ${matches.map((m) => `#${m.orderNumber} (${m.status})`).join(', ')}`
            : `Checked Orders DB · No match for "${orderNum || conversation.customerName}"`,
        payload: args,
        timestamp,
      },
    };
  }

  if (name === 'check_available_slots') {
    const date = String(args.date ?? '').trim();
    const booked = state.appointments
      .filter((a) => a.date === date && a.status !== 'Cancelled')
      .map((a) => a.timeSlot);
    const available = ALL_SLOTS.filter((slot) => !booked.includes(slot));

    return {
      result: { date, availableSlots: available, timezone: state.settings.timezone },
      log: {
        id,
        toolName: 'check_available_slots',
        summary: `Checked ${date} availability · ${available.length} slots open`,
        payload: { date, available },
        timestamp,
      },
    };
  }

  if (name === 'book_appointment') {
    const date = String(args.date ?? '').trim();
    const timeSlot = String(args.timeSlot ?? '').trim();
    const conflict = state.appointments.find(
      (a) => a.date === date && a.timeSlot === timeSlot && a.status !== 'Cancelled'
    );

    if (conflict) {
      return {
        result: {
          success: false,
          error: `Slot ${timeSlot} on ${date} is already booked. Please choose another available slot.`,
        },
        log: {
          id,
          toolName: 'book_appointment',
          summary: `Slot conflict on ${date} ${timeSlot}`,
          payload: args,
          timestamp,
        },
      };
    }

    const nextNum = 212 + state.appointments.length;
    const bookingCode = `APT-${nextNum}`;
    const newApt = {
      id: `apt-${Date.now()}`,
      bookingCode,
      customerName: String(args.customerName || conversation.customerName),
      phone: String(args.phone || conversation.phone),
      service: String(args.service || 'Virtual Interior Styling (30 min)'),
      date,
      timeSlot,
      status: 'Confirmed' as const,
      notes: String(args.notes || 'Booked via WhatsApp AI Assistant'),
      createdAt: timestamp,
    };
    state.appointments.unshift(newApt);
    conversation.intent = 'Appointment Booking';

    const rule = state.rules.find((r) => r.id === 'rule-2');
    if (rule) rule.executionsCount += 1;

    return {
      result: { success: true, appointment: newApt },
      log: {
        id,
        toolName: 'book_appointment',
        summary: `Booked #${bookingCode} · ${date} at ${timeSlot} PT`,
        payload: { bookingCode, date, timeSlot, service: newApt.service },
        timestamp,
      },
    };
  }

  if (name === 'capture_lead') {
    const consentGiven = Boolean(args.consentGiven);
    if (!consentGiven) {
      return {
        result: {
          success: false,
          error: 'Customer consent must be explicitly granted before saving lead contact details.',
        },
        log: {
          id,
          toolName: 'capture_lead',
          summary: 'Skipped lead save · Awaiting customer consent',
          payload: args,
          timestamp,
        },
      };
    }

    const newLead = {
      id: `lead-${Date.now()}`,
      name: String(args.name || conversation.customerName),
      phone: String(args.phone || conversation.phone),
      email: String(args.email || 'Not provided'),
      interest: String(args.interest || 'General product inquiry'),
      consentGiven: true,
      consentTimestamp: timestamp,
      source: 'WhatsApp AI Chat',
      status: 'New' as const,
      notes: String(args.notes || 'Captured with explicit WhatsApp consent'),
    };
    state.leads.unshift(newLead);
    conversation.intent = 'Lead Capture';

    const rule = state.rules.find((r) => r.id === 'rule-3');
    if (rule) rule.executionsCount += 1;

    return {
      result: { success: true, lead: newLead },
      log: {
        id,
        toolName: 'capture_lead',
        summary: `Saved consented lead · ${newLead.name}`,
        payload: { name: newLead.name, email: newLead.email, consentGiven: true },
        timestamp,
      },
    };
  }

  if (name === 'request_human_handoff') {
    const reason = String(args.reason || 'Customer requested human support');
    conversation.mode = 'human';
    conversation.handoffReason = reason;
    conversation.assignedAgent = state.settings.agentName;
    conversation.aiAutoReplyEnabled = false;
    conversation.intent = 'Human Escalation';

    const rule = state.rules.find((r) => r.id === 'rule-4');
    if (rule) rule.executionsCount += 1;

    return {
      result: {
        success: true,
        transferredTo: state.settings.agentName,
        reason,
      },
      log: {
        id,
        toolName: 'request_human_handoff',
        summary: `Escalated to ${state.settings.agentName} · ${reason}`,
        payload: { reason, assignedAgent: state.settings.agentName },
        timestamp,
      },
    };
  }

  return {
    result: { error: `Unknown tool: ${name}` },
    log: {
      id,
      toolName: name,
      summary: `Unknown tool ${name}`,
      payload: args,
      timestamp,
    },
  };
}

export async function generateWhatsAppAiReply(
  state: WorkspaceState,
  conversation: Conversation
): Promise<{ replyText: string; toolActions: ToolActionLog[] }> {
  const ai = getAiClient();

  const activeFaqs = state.faqs
    .filter((f) => f.active)
    .map((f) => `- [${f.category}] Q: ${f.question}\n  A: ${f.answer}`)
    .join('\n');

  const activeRules = state.rules
    .filter((r) => r.enabled)
    .map((r) => `- ${r.name}: Trigger (${r.triggerValue}) -> Action (${r.actionSummary})`)
    .join('\n');

  const todayIso = new Date().toISOString().slice(0, 10);

  const systemInstruction = [
    `You are the intelligent WhatsApp Business AI Assistant for "${state.settings.businessName}".`,
    `Today's date is ${todayIso}. Timezone: ${state.settings.timezone}.`,
    `Communication Tone: ${state.settings.tone}. Keep WhatsApp replies natural, crisp, helpful, and concise (2-5 short sentences unless listing available slots or order details). Do not use markdown headers or heavy formatting; plain conversational WhatsApp text works best.`,
    `Customer Context: Name="${conversation.customerName}", Phone="${conversation.phone}".`,
    `24/7 Availability Mode: ${state.settings.alwaysAvailable247 ? 'Enabled (24/7 live assistance)' : `Scheduled (${state.settings.operatingHours})`}.`,
    `Human Handoff Policy: ${state.settings.handoffThreshold}.`,
    `\nBusiness FAQ Knowledge Base:\n${activeFaqs || 'No active FAQs.'}`,
    `\nActive Automation Rules:\n${activeRules || 'No active automation rules.'}`,
    `\nCRITICAL TOOL RULES:`,
    `1. Always use lookup_order when the customer asks about an order, tracking, or delivery status.`,
    `2. Always use check_available_slots before confirming or suggesting appointment times for a date.`,
    `3. Use book_appointment only when date, timeSlot, and service are clear.`,
    `4. For lead generation (custom quotes, trade pricing, bulk inquiries), ALWAYS ask the customer for explicit consent before calling capture_lead with consentGiven: true.`,
    `5. Use request_human_handoff immediately if the customer asks for a human/manager, reports a damaged high-value item (> $150), requests a refund policy exception, or is frustrated. When transferring, warmly inform them that ${state.settings.agentName} will follow up directly here.`,
  ].join('\n');

  const contents: Content[] = conversation.messages
    .filter((m) => m.sender !== 'system')
    .slice(-16)
    .map((m) => ({
      role: m.sender === 'customer' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));

  const tools = [
    {
      functionDeclarations: [
        lookupOrderDeclaration,
        checkAvailableSlotsDeclaration,
        bookAppointmentDeclaration,
        captureLeadDeclaration,
        requestHumanHandoffDeclaration,
      ],
    },
  ];

  const toolActions: ToolActionLog[] = [];
  let rounds = 0;

  while (rounds < 4) {
    rounds += 1;
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction,
        tools,
      },
    });

    const functionCalls = response.functionCalls;
    const candidateContent = response.candidates?.[0]?.content;

    if (functionCalls && functionCalls.length > 0 && candidateContent) {
      contents.push(candidateContent);
      const responseParts = functionCalls.map((fc) => {
        const exec = executeTool(
          fc.name ?? '',
          (fc.args ?? {}) as Record<string, unknown>,
          state,
          conversation
        );
        toolActions.push(exec.log);
        return {
          functionResponse: {
            id: fc.id,
            name: fc.name ?? '',
            response: exec.result,
          },
        };
      });

      contents.push({
        role: 'user',
        parts: responseParts,
      });
      continue;
    }

    const replyText = (response.text ?? '').trim();
    if (!replyText) {
      throw new Error('AI returned an empty response.');
    }
    return { replyText, toolActions };
  }

  return {
    replyText: `I have updated your request details. Let me know if there is anything else I can help with!`,
    toolActions,
  };
}

export async function generateAgentDraftReply(
  state: WorkspaceState,
  conversation: Conversation
): Promise<string> {
  const ai = getAiClient();
  const transcript = conversation.messages
    .slice(-10)
    .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
    .join('\n');

  const customerOrders = state.orders
    .filter((o) => normalizePhone(o.phone) === normalizePhone(conversation.phone))
    .map((o) => `#${o.orderNumber} (${o.items}, $${o.totalAmount}, ${o.status})`)
    .join('; ');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Draft a helpful, empathetic WhatsApp reply from human specialist ${state.settings.agentName} at ${state.settings.businessName}.\nCustomer: ${conversation.customerName}\nKnown Orders: ${customerOrders || 'None'}\nHandoff Reason: ${conversation.handoffReason || 'General support'}\n\nRecent Conversation:\n${transcript}\n\nWrite ONLY the ready-to-send reply text (2-3 crisp sentences, warm and solution-oriented).`,
  });

  return (response.text ?? '').trim();
}
