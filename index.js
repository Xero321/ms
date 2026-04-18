import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = "12345";

// ✅ VERIFY (GET)
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// ✅ MESSAGE RECEIVE (POST)
app.post("/webhook", (req, res) => {
  console.log("🔥 EVENT:", JSON.stringify(req.body, null, 2));

  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(entry => {
      const webhook_event = entry.messaging[0];

      if (webhook_event.message && webhook_event.message.text) {
        const sender_id = webhook_event.sender.id;
        const text = webhook_event.message.text;

        const reply = getSmartReply(text);
sendMessage(sender_id, reply);
      }
    });

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ✅ SEND MESSAGE
async function sendMessage(sender, text) {
  await fetch(`https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: sender },
      message: { text }
    })
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Bot ажиллаж байна 🚀"));

function getSmartReply(text) {
    const msg = text.toLowerCase();
  
    // Сайн уу
    if (msg.includes("сайн")) {
      return random([
        "Сайн байна уу 😊 Ямар зураг засуулах вэ?",
        "Сайн байна уу 👋 Та ямар төрлийн зураг засуулах гэж байна?",
        "Сайн уу 😊 Зургаа явуулбал үзээд хэлж өгье 👍"
      ]);
    }
  
    // Үнэ
    if (msg.includes("үнэ")) {
      return random([
        "Манай үнэ 5000₮-с эхэлдэг 😊",
        "Зургийн төрлөөс шалтгаална 👍 Зургаа явуулбал яг үнэ хэлж өгье",
        "Ихэвчлэн 5k–20k хооронд байдаг 😊"
      ]);
    }
  
    // Засвар
    if (msg.includes("зас")) {
      return random([
        "Тийм үйлчилгээ хийдэг 😊 Зургаа явуулна уу",
        "Засвар хийж өгнө 👍 Ямар төрлийн засвар вэ?",
        "Болно 😊 Зургaa явуулбал шууд эхэлж болно"
      ]);
    }
  
    // Default
    return random([
      "Зургаа явуулбал үзээд хэлж өгье 😊",
      "Илүү тодорхой бичвэл тусалж чадна 👍",
      "Ямар зураг засуулах гэж байна вэ?"
    ]);
  }
  
  // random helper
  function random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }