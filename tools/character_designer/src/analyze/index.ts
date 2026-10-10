import { extractPalette } from "./palette.ts";
import { OllamaHttpClient } from "../ollama/client.ts";

export { extractPalette } from "./palette.ts";
export type { PaletteResult } from "./palette.ts";

export interface StyleDNA {
  ok: boolean;
  query: string;
  refsAnalyzed: number;
  palette: string[];
  dominant: string;
  styleName: string;
  mood: string;
  lighting: string;
  composition: string;
  keywords: string[];
  engine: "ollama" | "fallback";
}

export async function analyzeStyle(
  refsDir: string,
  query: string,
  ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434"
): Promise<StyleDNA> {
  const palette = extractPalette(refsDir);
  const client = new OllamaHttpClient({ endpoint: ollamaUrl, timeoutMs: 30000 });
  const available = await client.isAvailable();

  const base: StyleDNA = {
    ok: palette.ok,
    query,
    refsAnalyzed: palette.refsAnalyzed,
    palette: palette.palette,
    dominant: palette.dominant,
    styleName: query,
    mood: "cozy, warm, nostalgic",
    lighting: "soft amber, diffused",
    composition: "centered, balanced",
    keywords: [],
    engine: "fallback",
  };

  if (!available) return base;

  try {
    const prompt = `Analyze this moodboard and return ONLY valid JSON.

Query: "${query}"
Dominant colors: ${palette.palette.join(", ")}
References: ${palette.refsAnalyzed}

Shape:
{"styleName":"...","mood":"...","lighting":"...","composition":"...","keywords":["..."]}`;

    const model = process.env.OLLAMA_MODEL || "qwen2.5:0.5b";
    const result = await client.generate(model, prompt, { jsonFormat: true, temperature: 0.3 });
    let text = result.text.trim();
    if (text.startsWith("```")) text = text.split("```")[1]?.replace(/^json\s*/, "") || text;
    const parsed = JSON.parse(text) as Partial<StyleDNA>;
    return {
      ...base,
      styleName: parsed.styleName || base.styleName,
      mood: parsed.mood || base.mood,
      lighting: parsed.lighting || base.lighting,
      composition: parsed.composition || base.composition,
      keywords: parsed.keywords || [],
      engine: "ollama",
    };
  } catch {
    return base;
  }
}
