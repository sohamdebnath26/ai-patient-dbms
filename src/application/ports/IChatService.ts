import type { ChatRequest, ChatResponse } from "@domain/chat";

export interface IChatService {
  send(request: ChatRequest): Promise<ChatResponse>;
}
