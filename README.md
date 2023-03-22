# link-preview

## What is this?

This is a **light-weight, no-auth "link-preview" service** powered by [Cloudflare Workers](https://www.cloudflare.com/products/workers/)
and [node-html-parser](https://github.com/taoqf/node-html-parser)

- For small- or single-purpose services, Cloudflare Workers are very good environment to work with.
  - It enables small-start from free tier, with generous feature offerings
  - It allows us exactly what we want in this context: writing in TypeScript, serving public HTTP APIs to the world
  - It has well-made development experience: rich documents, wrangler CLI, easy deploy from GitHub Actions, consice user-land directory structure, etc.
- `node-html-parser` fits here as well.
  - Reasonably small set of dependencies
  - Sufficiently fast (subjectively though, not benchmarked)
  - Well-known `querySelector` API

## Why a Service, not a Library?

There are libraries like [link-preview-js](https://github.com/ospfranco/link-preview-js) and they serve the purpose as long as you know what you are doing.

However, there are [gotchas](https://github.com/ospfranco/link-preview-js#gotchas):

- When you attempt to fetch a website of another origin from JavaScript run on a web browser, the browser ask the targeted website for **cross-origin request allowances (CORS; Cross-Origin Resource Sharing)** due to the same-origin policies
- However, not all websites allow CORS. Or rather, most websites just don't (default behavior of ordinary web servers)
- In this scenario, non-browser agent must fetch the website, and pass the result to the initiating script
- **This service exactly does that**
  - Fetch websites of another domain on behalf of browser-run script
  - Extract essential info for preview purpose from the website (`title` and `url`, optional `description` and `image`)
  - Give it back to the requester in JSON format

This service itself **allows** CORS, so you can just pitch requests from whatever environment and they should work.

Also it comes in rescue when your preferred language does not have well-maintained link-preview libraries.
You just need some HTTP client capability and JSON handling.

## How to deploy

1. Prepare your Cloudflare Account
2. Click: [![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ymtszw/link-preview)
   - It should fork this repository and set up your Cloudflare Account, then deploys the service

## Develop locally

```sh
npm install
npm start
```

Then, from another terminal:

```sh
$ curl 'http://localhost:8787?q=https://cloudflare.com' | jq .
{
  "title": "Cloudflare - The Web Performance & Security Company",
  "description": "Here at Cloudflare, we make the Internet work the way it should. Offering CDN, DNS, DDoS protection and security, find out how we can help your site.",
  "url": "https://www.cloudflare.com/",
  "image": "https://www.cloudflare.com/static/b30a57477bde900ba55c0b5f98c4e524/Cloudflare_default_OG_.png"
}
```
