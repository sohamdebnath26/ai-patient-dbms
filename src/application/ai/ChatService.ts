import type { IAIModelProvider, ChatMessage } from "@application/ports/IAIModelProvider";

export interface NavigationAction {
  type: "navigate";
  route: string;
}

export interface ChatResponse {
  message: string;
  navigation?: NavigationAction;
}

const NAVIGATION_PATTERNS: { pattern: RegExp; route: string }[] = [
  { pattern: /\b(dashboard|home)\b/i, route: "/dashboard" },
  { pattern: /\b(patients|patient list|all patients)\b/i, route: "/patients" },
  { pattern: /\b(appointments|schedule|calendar)\b/i, route: "/appointments" },
  { pattern: /\b(new patient|register patient|add patient)\b/i, route: "/patients/new" },
  { pattern: /\b(new appointment|book appointment)\b/i, route: "/appointments/new" },
  { pattern: /\b(profile|account)\b/i, route: "/profile" },
];

export class ChatService {
  constructor(private readonly provider: IAIModelProvider) {}

  detectNavigation(message: string): NavigationAction | undefined {
    const lower = message.toLowerCase();
    for (const { pattern, route } of NAVIGATION_PATTERNS) {
      if (pattern.test(lower)) return { type: "navigate", route };
    }
    return undefined;
  }

  async chat(
    userMessage: string,
    context: {
      systemPrompt?: string;
      history?: ChatMessage[];
    },
  ): Promise<ChatResponse> {
    const navigation = this.detectNavigation(userMessage);
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: context.systemPrompt ?? this.defaultSystemPrompt(),
      },
      ...(context.history ?? []),
      { role: "user", content: userMessage },
    ];

    const completion = await this.provider.complete(messages, {
      temperature: 0.3,
      maxTokens: 2048,
    });

    return {
      message: completion.content,
      navigation,
    };
  }

  private defaultSystemPrompt(): string {
    return `You are ClinicOS AI, a clinical assistant embedded in a healthcare platform for doctors.

Your capabilities:
1. Answer clinical questions and assist doctors with navigation.
2. When provided patient data, generate structured diagnostic reports.
3. Be concise, professional, and evidence-aware.

Rules:
- Only reference data explicitly provided to you.
- Format diagnostic reports with clear sections (Summary, Findings, Assessment, Recommendations).
- If you do not have enough information, say so clearly.
- You are an assistant, not a replacement for clinical judgment.`;
  }
}
