import fs from "node:fs";
import path from "node:path";

export interface ComfyConfig {
  endpoint: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

export interface GenerateOptions {
  prompt: string;
  negative?: string;
  seed?: number;
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  workflowPath: string;
  outputDir: string;
}

export class ComfyClient {
  private endpoint: string;
  private timeoutMs: number;
  private pollIntervalMs: number;

  constructor(config: ComfyConfig) {
    this.endpoint = config.endpoint.replace(/\/+$/, "");
    this.timeoutMs = config.timeoutMs ?? 300_000;
    this.pollIntervalMs = config.pollIntervalMs ?? 2_000;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5_000);
      const res = await fetch(`${this.endpoint}/system_stats`, { signal: ctrl.signal });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  }

  async listCheckpoints(): Promise<string[]> {
    try {
      const res = await fetch(`${this.endpoint}/object_info/CheckpointLoaderSimple`);
      if (!res.ok) return [];
      const data = await res.json() as Record<string, { input?: { required?: { ckpt_name?: [string[]] } } }>;
      const node = data.CheckpointLoaderSimple;
      const list = node?.input?.required?.ckpt_name?.[0];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  private injectWorkflow(workflow: Record<string, unknown>, params: Record<string, string | number>): Record<string, unknown> {
    let s = JSON.stringify(workflow);
    for (const [k, v] of Object.entries(params)) {
      const token = `{{${k}}}`;
      const replacement = typeof v === "string" ? v.replace(/"/g, '\\"') : String(v);
      s = s.split(token).join(replacement);
    }
    return JSON.parse(s);
  }

  async generate(opts: GenerateOptions): Promise<string[]> {
    const workflowRaw = JSON.parse(fs.readFileSync(opts.workflowPath, "utf-8")) as Record<string, unknown>;

    const seed = opts.seed ?? Math.floor(Math.random() * 2_000_000_000);
    const params = {
      prompt: opts.prompt,
      negative: opts.negative ?? "",
      seed,
      width: opts.width ?? 768,
      height: opts.height ?? 768,
      steps: opts.steps ?? 28,
      cfg: opts.cfg ?? 6.5,
    };

    const workflow = this.injectWorkflow(workflowRaw, params);

    // ⚠️ client_id must be OUTSIDE the workflow object, as sibling of `prompt`
    const clientId = `chimera-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const body = {
      prompt: workflow,
      client_id: clientId,
    };

    // 1. Queue
    const queueRes = await fetch(`${this.endpoint}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!queueRes.ok) {
      const errText = await queueRes.text();
      console.error("=== ComfyUI /prompt error ===");
      console.error("Status:", queueRes.status);
      console.error("Body:", errText.slice(0, 1500));
      console.error("=== End error ===");
      throw new Error(`ComfyUI /prompt HTTP ${queueRes.status}: ${errText.slice(0, 500)}`);
    }

    const queueData = await queueRes.json() as { prompt_id?: string; error?: unknown; node_errors?: unknown };
    if (!queueData.prompt_id) {
      console.error("=== ComfyUI queue returned no prompt_id ===");
      console.error(JSON.stringify(queueData, null, 2).slice(0, 1500));
      throw new Error(`ComfyUI did not return a prompt_id: ${JSON.stringify(queueData).slice(0, 300)}`);
    }

    const promptId = queueData.prompt_id;
    console.log(`  [comfy] queued: ${promptId} (seed=${seed})`);

    // 2. Poll
    const start = Date.now();
    while (Date.now() - start < this.timeoutMs) {
      await new Promise((r) => setTimeout(r, this.pollIntervalMs));

      const histRes = await fetch(`${this.endpoint}/history/${promptId}`);
      if (!histRes.ok) continue;

      const hist = await histRes.json() as Record<string, {
        outputs?: Record<string, { images?: Array<{ filename: string; subfolder: string; type: string }> }>;
        status?: { completed?: boolean; status_str?: string };
      }>;

      const entry = hist[promptId];
      if (!entry) continue;

      const images = entry.outputs
        ? Object.values(entry.outputs).flatMap((o) => o.images || [])
        : [];

      if (images.length > 0) {
        fs.mkdirSync(opts.outputDir, { recursive: true });
        const saved: string[] = [];
        for (const img of images) {
          const viewUrl = new URL(`${this.endpoint}/view`);
          viewUrl.searchParams.set("filename", img.filename);
          viewUrl.searchParams.set("subfolder", img.subfolder || "");
          viewUrl.searchParams.set("type", img.type || "output");

          const imgRes = await fetch(viewUrl.toString());
          if (!imgRes.ok) continue;

          const buf = Buffer.from(await imgRes.arrayBuffer());
          const dest = path.join(opts.outputDir, img.filename);
          fs.writeFileSync(dest, buf);
          saved.push(dest);
        }
        return saved;
      }
    }

    throw new Error(`ComfyUI timeout after ${this.timeoutMs / 1000}s`);
  }
}
