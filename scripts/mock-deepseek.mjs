// Dev-only stand-in for the DeepSeek API (OpenAI-compatible format), used to
// exercise the DeepSeek provider path end-to-end without spending credit.
// It records every request body so tests can assert what the app actually sent.
//
//   node scripts/mock-deepseek.mjs
//   DEEPSEEK_API_KEY=test DEEPSEEK_BASE_URL=http://127.0.0.1:9098 npm run dev
import http from "node:http";
import fs from "node:fs";

const PORT = Number(process.env.MOCK_PORT || 9098);
const LOG = process.env.MOCK_LOG || "/tmp/mock-deepseek-requests.jsonl";
const FAIL_ALWAYS = process.env.MOCK_FAIL_ALWAYS === "1";

let attempts = 0;
const seen = [];

const server = http.createServer((req, res) => {
  let raw = "";
  req.on("data", (c) => (raw += c));
  req.on("end", () => {
    attempts++;
    let body = {};
    try {
      body = JSON.parse(raw);
    } catch {
      /* ignore */
    }

    // Record the shape of what the app sent, for test assertions.
    const DUMP = process.env.MOCK_DUMP;
    if (DUMP && Array.isArray(body.messages)) {
      fs.appendFileSync(
        DUMP,
        "\n===== REQUEST =====\n" +
          body.messages.map((m) => `--- ${m.role} ---\n${m.content}`).join("\n") +
          "\n"
      );
    }

    const record = {
      attempt: attempts,
      method: req.method,
      path: req.url,
      authorization: req.headers.authorization ? "Bearer <redacted>" : null,
      model: body.model,
      thinking: body.thinking ?? null,
      temperature: body.temperature ?? null,
      max_tokens: body.max_tokens ?? null,
      response_format: body.response_format ?? null,
      stream: body.stream ?? null,
      messages: Array.isArray(body.messages) ? body.messages.length : null,
    };
    seen.push(record);
    fs.appendFileSync(LOG, JSON.stringify(record) + "\n");

    console.log(`[mock-ds] #${attempts} POST ${req.url} model=${body.model} thinking=${JSON.stringify(body.thinking)}`);

    if (FAIL_ALWAYS) {
      res.writeHead(429, { "content-type": "application/json" });
      res.end(
        JSON.stringify({ error: { message: "Rate limit reached", type: "rate_limit_error", code: "rate_limit_exceeded" } })
      );
      return;
    }

    const wantsJson = body.response_format?.type === "json_object";
    if (wantsJson) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          id: "chatcmpl-mock",
          object: "chat.completion",
          model: body.model,
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: '{"memories":[],"updates":[],"intervene":false}' },
              finish_reason: "stop",
            },
          ],
          usage: { prompt_tokens: 40, completion_tokens: 12, total_tokens: 52 },
        })
      );
      return;
    }

    const reply =
      "*The candlelight steadies as she finally looks up, amber eyes catching the flame.* " +
      '"You came through the whole court to ask me that. Sit down — you\'ve earned an answer."';

    if (body.stream) {
      res.writeHead(200, { "content-type": "text/event-stream" });
      // DeepSeek sends interim keep-alive comments; the client must ignore them.
      res.write(": keep-alive\n\n");
      for (const word of reply.split(" ")) {
        res.write(
          `data: ${JSON.stringify({
            id: "chatcmpl-mock",
            object: "chat.completion.chunk",
            model: body.model,
            choices: [{ index: 0, delta: { content: word + " " }, finish_reason: null }],
          })}\n\n`
        );
      }
      res.write(
        `data: ${JSON.stringify({
          id: "chatcmpl-mock",
          object: "chat.completion.chunk",
          model: body.model,
          choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
          usage: { prompt_tokens: 120, completion_tokens: 40 },
        })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        id: "chatcmpl-mock",
        object: "chat.completion",
        model: body.model,
        choices: [{ index: 0, message: { role: "assistant", content: reply }, finish_reason: "stop" }],
        usage: { prompt_tokens: 120, completion_tokens: 40, total_tokens: 160 },
      })
    );
  });
});

server.listen(PORT, "127.0.0.1", () =>
  console.log(`[mock-ds] listening on http://127.0.0.1:${PORT} (requests → ${LOG})`)
);
