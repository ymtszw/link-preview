/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { parse } from "node-html-parser";

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    if (query) {
      const res = await fetch(query, { redirect: "follow" });
      const body = await res.text();
      const md = extractMetadata(body);

      const ret = new Response(JSON.stringify(md));
      ret.headers.set("content-type", "application/json");
      return ret;
    } else {
      return new Response("Hello World!");
    }
  },
};

type Metadata = {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  image?: string | null;
};

function extractMetadata(html: string): Metadata {
  const parsed = parse(html);

  const title =
    parsed
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content") || parsed.querySelector("title")?.textContent;

  const description =
    parsed
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content") ||
    parsed.querySelector('meta[name="description"]')?.getAttribute("content") ||
    title;

  const url =
    parsed.querySelector('link[rel="canonical"]')?.getAttribute("href") ||
    parsed.querySelector('meta[property="og:url"]')?.getAttribute("content");

  const image = parsed
    .querySelector('meta[property="og:image"]')
    ?.getAttribute("content");

  return { title, description, url, image };
}
