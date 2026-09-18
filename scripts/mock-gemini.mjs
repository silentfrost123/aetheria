// Dev-only stand-in for the Gemini API, used to exercise rate-limit handling
// end-to-end without spending real quota. Not part of the production app.
//
//   node scripts/mock-gemini.mjs            → 429 twice, then a streamed reply
//   MOCK_FAIL_ALWAYS=1 node ...mock-gemini.mjs → always 429 (tests the failure path)
//
// Point the app at it with:
//   GEMINI_API_KEY=test GEMINI_BASE_URL=http://127.0.0.1:9099/v1beta npm run dev
import http from "node:http";

const PORT = Number(process.env.MOCK_PORT || 9099);
const FAIL_ALWAYS = process.env.MOCK_FAIL_ALWAYS === "1";
const FAIL_TIMES = Number(process.env.MOCK_FAIL_TIMES || 2);
const RETRY_IN = Number(process.env.MOCK_RETRY_IN || 1);

let attempts = 0;

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    attempts++;
    const shouldFail = FAIL_ALWAYS || attempts <= FAIL_TIMES;

    console.log(
      `[mock] #${attempts} ${req.method} ${req.url.split("?")[0]} → ${shouldFail ? "429" : "200"}`
    );

    if (shouldFail) {
      res.writeHead(429, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          error: {
            code: 429,
            message: `You exceeded your current quota... Please retry in ${RETRY_IN}.0s.`,
            status: "RESOURCE_EXHAUSTED",
            details: [
              {
                "@type": "type.googleapis.com/google.rpc.RetryInfo",
                retryDelay: `${RETRY_IN}s`,
              },
            ],
          },
        })
      );
      return;
    }

    // Background bookkeeping calls ask for JSON; the reply is streamed prose.
    const wantsJson = body.includes('"response_format"') || body.includes("Extract");
    if (wantsJson) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: '{"memories":[],"updates":[],"intervene":false}' }] } },
          ],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        })
      );
      return;
    }

    const reply =
      "*The candlelight bends as she turns toward you, amber eyes narrowing with amusement.* " +
      "\"Because the invitation was never the chase — it was the invitation.\"";

    if (req.url.includes("streamGenerateContent")) {
      res.writeHead(200, { "content-type": "text/event-stream" });
      for (const word of reply.split(" ")) {
        res.write(
          `data: ${JSON.stringify({
            candidates: [{ content: { parts: [{ text: word + " " }] } }],
          })}\n\n`
        );
      }
      res.write(
        `data: ${JSON.stringify({ usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 30 } })}\n\n`
      );
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: reply }] } }],
        usageMetadata: { promptTokenCount: 120, candidatesTokenCount: 30 },
      })
    );
  });
});

server.listen(PORT, "127.0.0.1", () =>
  console.log(
    `[mock] listening on http://127.0.0.1:${PORT} (fail ${FAIL_ALWAYS ? "always" : `first ${FAIL_TIMES}`})`
  )
);
