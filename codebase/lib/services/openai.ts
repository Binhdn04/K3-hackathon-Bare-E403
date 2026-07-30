const API_URL = "https://api.openai.com/v1";

type ResponseOutput = {
  type?: string;
  content?: Array<{
    type?: string;
    text?: string;
    annotations?: Array<{
      type?: string;
      url?: string;
      title?: string;
      url_citation?: { url?: string; title?: string };
    }>;
  }>;
};

type OpenAIResponse = {
  output_text?: string;
  output?: ResponseOutput[];
  error?: { message?: string };
};

function apiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  return key;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000)
  });
  const json = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(json.error?.message ?? `OpenAI request failed (${response.status})`);
  return json;
}

function outputText(response: OpenAIResponse) {
  if (response.output_text) return response.output_text;
  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text ?? "")
    .join("");
}

export class OpenAIService {
  readonly model = process.env.OPENAI_MODEL ?? "gpt-5-mini";

  async createText(instructions: string, input: string) {
    const response = await post<OpenAIResponse>("/responses", {
      model: this.model,
      instructions,
      input,
      store: false
    });
    return outputText(response).trim();
  }

  async createJson<T>(instructions: string, input: string, name: string, schema: Record<string, unknown>): Promise<T> {
    const response = await post<OpenAIResponse>("/responses", {
      model: this.model,
      instructions,
      input,
      store: false,
      text: { format: { type: "json_schema", name, strict: true, schema } }
    });
    const text = outputText(response);
    if (!text) throw new Error("OpenAI returned an empty response");
    return JSON.parse(text) as T;
  }

  async embeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0 || !process.env.OPENAI_API_KEY) return [];
    const result = await post<{ data: Array<{ index: number; embedding: number[] }> }>("/embeddings", {
      model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small",
      input: texts,
      dimensions: 1536
    });
    return result.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
  }

  async searchWeb(question: string) {
    const response = await post<OpenAIResponse>("/responses", {
      model: this.model,
      instructions: "Tra loi bang tieng Viet, ngan gon. Moi khang dinh thuc te phai dua tren ket qua web search.",
      input: question,
      tools: [{ type: "web_search", search_context_size: "low" }],
      tool_choice: "auto",
      store: false
    });
    const sources = new Map<string, string>();
    for (const item of response.output ?? []) {
      for (const content of item.content ?? []) {
        for (const annotation of content.annotations ?? []) {
          const citation = annotation.url_citation ?? annotation;
          if (citation.url) sources.set(citation.url, citation.title ?? citation.url);
        }
      }
    }
    return { text: outputText(response).trim(), sources: [...sources].map(([url, title]) => ({ url, title })) };
  }
}

export const openAI = new OpenAIService();
