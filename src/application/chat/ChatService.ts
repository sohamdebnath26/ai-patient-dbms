import type { ChatRequest, ChatResponse } from "@domain/chat";
import type { IChatService } from "@application/ports/IChatService";

export class ChatService {
  constructor(private readonly client: IChatService) {}

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    if (request.messages.length === 0) {
      throw new Error("Cannot send an empty chat request.");
    }
    return this.client.send(request);
  }
}
