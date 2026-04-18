import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = "12345";
const OPENAI_KEY = "PUT_OPENAI_KEY";

// 🧠 Memory
const memory = {};

// 🧠 Prompt
const systemPrompt = `
Чи зураг засварын студийн админ.
Монгол хэлээр найрсаг бич.
Хэт урт биш.
Хэрэглэгчийг зураг явуулахад хүргэ.

Үнэ: 5000₮
Хугацаа: 1 өдөр
`;

// 🧠 AI function
async function getReply(userId, text) {
  if (!memory[userId]) memory[userId] = [];

  memory[userId].push({ role: "user", content: text });

  const messages = [
    { role: "system", content: systemPrompt },
    ...memory[userId].slice(-10)
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages
    })
  });

  const data = await res.json();
  const reply = data.choices[0].message.content;

  memory[userId].push({ role: "assistant", content: reply });

  return reply;
}

// webhook verify
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

// message receive
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0];
  const event = entry?.messaging?.[0];

  if (event?.message?.text) {
    const sender = event.sender.id;
    const text = event.message.text;

    const reply = await getReply(sender, text);

    // typing effect
    await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: sender },
        sender_action: "typing_on"
      })
    });

    // delay
    setTimeout(async () => {
      await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: sender },
          message: { text: reply }
        })
      });
    }, 1500);
  }

  res.sendStatus(200);
});

app.listen(3000, () => console.log("Bot ажиллаж байна 🚀"));