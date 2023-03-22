# link-preview

## Develop locally

```sh
npm i
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
