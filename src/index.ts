/**
 * Cloudflare Workers implementation of link-preview API service.
 *
 * Workers doc: https://developers.cloudflare.com/workers/
 */

import { parse } from "node-html-parser";

export interface Env {}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const reqUrl = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    if (request.method === "OPTIONS") {
      return handleOptions(request, origin);
    } else {
      const query = reqUrl.searchParams.get("q");

      if (request.method === "GET" && query) {
        const md = await extractMetadata(query);
        const ret = new Response(JSON.stringify(md), {
          headers: {
            "content-type": "application/json",
            Vary: "Origin",
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET",
          },
        });
        return ret;
      } else {
        return new Response(
          JSON.stringify({
            error: "400 Bad Request",
            message: help(reqUrl.origin),
          }),
          { status: 400, headers: { "content-type": "application/json" } }
        );
      }
    }
  },
};

// From: https://stackoverflow.com/a/69685872
function handleOptions(request: Request, origin: string) {
  let headers = request.headers;
  if (
    headers.get("Origin") !== null &&
    headers.get("Access-Control-Request-Method") !== null &&
    headers.get("Access-Control-Request-Headers") !== null
  ) {
    return new Response(null, {
      headers: {
        Vary: "Origin",
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Headers":
          request.headers.get("Access-Control-Request-Headers") || "",
      },
    });
  } else {
    return new Response(null, {
      headers: { Allow: "GET" },
    });
  }
}

type Metadata = {
  title?: string | null;
  description?: string | null;
  url?: string | null;
  image?: string | null;
  error?: string | null;
};

async function extractMetadata(query: string): Promise<Metadata> {
  const res = await fetch(query, { redirect: "follow" });
  if (res.status >= 400) {
    return { error: `[Error] ${query} returned status code: ${res.status}!` };
  }
  const body = await res.text();
  const parsed = parse(body);

  const title =
    parsed
      .querySelector('meta[property="og:title"]')
      ?.getAttribute("content") || parsed.querySelector("title")?.textContent;

  const description =
    parsed
      .querySelector('meta[property="og:description"]')
      ?.getAttribute("content") ||
    parsed.querySelector('meta[name="description"]')?.getAttribute("content");

  let url = query;
  const canonicalUrl = parsed
    .querySelector('link[rel="canonical"]')
    ?.getAttribute("href");
  if (canonicalUrl) {
    if (
      canonicalUrl?.startsWith("https://") ||
      canonicalUrl?.startsWith("http://")
    ) {
      url = canonicalUrl;
    } else {
      // Resolve relative URL
      url = new URL(canonicalUrl, query).href;
    }
  } else {
    const ogpUrl = parsed
      .querySelector('meta[property="og:url"]')
      ?.getAttribute("content");
    if (ogpUrl) {
      if (ogpUrl?.startsWith("https://") || ogpUrl?.startsWith("http://")) {
        url = ogpUrl;
      } else {
        // Resolve relative URL
        url = new URL(ogpUrl, query).href;
      }
    }
  }

  let image;
  const ogpImage = parsed
    .querySelector('meta[property="og:image"]')
    ?.getAttribute("content");
  if (ogpImage) {
    if (ogpImage?.startsWith("https://") || ogpImage?.startsWith("http://")) {
      image = ogpImage;
    } else {
      // Resolve relative URL
      image = new URL(ogpImage, query).href;
    }
  }

  return { title, description, url, image };
}

function help(host: string): string {
  return `
Hi! This is a link-preview service on Cloudflare Workers.

If you are seeing this message, at least you connected to our endpoint successfully.

Correct usage is:

    GET ${host}?q=https://cloudflare.com

This should return JSON payload like this:

    {
      "title": "Cloudflare - The Web Performance & Security Company",
      "description": "Here at Cloudflare, we make the Internet work the way it should. Offering CDN, DNS, DDoS protection and security, find out how we can help your site.",
      "url": "https://www.cloudflare.com/",
      "image": "https://www.cloudflare.com/static/b30a57477bde900ba55c0b5f98c4e524/Cloudflare_default_OG_.png"
    }

In short, supply whatever public URL as a query parameter "q", then send GET request. That's all!
If the URL contains non-ASCII characters, url-encode them.

Source code: https://github.com/ymtszw/link-preview

This service is EXTREMELY easy to self-host; i.e. deploy on your own Cloudflare account.
If you are going to throw many link-preview requests here, do consider it!
`;
}
