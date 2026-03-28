# create-pura-agent

Bootstrap a Pura-connected agent in one command.

```bash
npx create-pura-agent
```

The CLI will:

1. Optionally collect your OpenAI/Anthropic API keys
2. Request a Pura API key from the gateway
3. Write a `.env` file
4. Run a test cascade request and show the cost savings
5. Print next steps

No dependencies. No framework lock-in. Just a `.env` and a working endpoint.

## What you get

```
PURA_API_KEY=pura_abc123...
```

Then use Pura as a drop-in OpenAI replacement:

```javascript
import OpenAI from "openai";
const openai = new OpenAI({ baseURL: "https://api.pura.xyz/v1" });
```

## Cascade routing

Add `routing: { cascade: true }` to try the cheapest provider first:

```javascript
const response = await openai.chat.completions.create({
  messages: [{ role: "user", content: "Explain backpressure" }],
  routing: { cascade: true },
});
```

Response headers include `X-Pura-Cascade-Depth`, `X-Pura-Cascade-Savings`, and `X-Pura-Confidence`.
