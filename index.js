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

// ✅ MESSAGE + COMMENT RECEIVE (POST)
app.post("/webhook", (req, res) => {
  console.log("🔥 EVENT:", JSON.stringify(req.body, null, 2));

  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(entry => {

      // 🔥 COMMENT HANDLE (шинэ нэмсэн хэсэг)
      if (entry.changes) {
        entry.changes.forEach(change => {
          if (change.field === "feed") {
            const commentId = change.value.comment_id;
            const message = change.value.message;

            console.log("💬 COMMENT:", message);

            // 👍 Like comment
            likeComment(commentId);

            // 💬 Reply comment (SAFE for review)
            replyComment(
              commentId,
              "Сайн байна уу 😊 дэлгэрэнгүй мэдээллийг inbox-р бичээрэй"
            );
          }
        });
      }

      // 🔥 MESSENGER MESSAGE HANDLE
      if (entry.messaging) {
        const webhook_event = entry.messaging[0];

        if (webhook_event.message && webhook_event.message.text) {
          const sender_id = webhook_event.sender.id;
          const text = webhook_event.message.text;

          const reply = getSmartReply(text);
          sendMessage(sender_id, reply);
        }
      }

    });

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ✅ SEND MESSAGE
async function sendMessage(sender, text) {
  await fetch(
    `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: sender },
        message: { text }
      })
    }
  );
}

// 👍 LIKE COMMENT
async function likeComment(commentId) {
  await fetch(
    `https://graph.facebook.com/v18.0/${commentId}/likes?access_token=${PAGE_TOKEN}`,
    {
      method: "POST"
    }
  );
}

// 💬 REPLY COMMENT
async function replyComment(commentId, text) {
  await fetch(
    `https://graph.facebook.com/v18.0/${commentId}/comments?access_token=${PAGE_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text })
    }
  );
}

// 🚀 SERVER START
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Bot ажиллаж байна 🚀"));

// 🧠 SMART REPLY
function getSmartReply(text) {
  const msg = text.toLowerCase();

  if (msg.includes("сайн")) {
    return random([
      "Сайн байна уу 😊 Ямар зураг засуулах вэ?",
      "Сайн байна уу 👋 Та ямар төрлийн зураг засуулах гэж байна?",
      "Сайн уу 😊 Зургаа явуулбал үзээд хэлж өгье 👍"
    ]);
  }

  if (msg.includes("үнэ")) {
    return random([
      "Манай үнэ 5000₮-с эхэлдэг 😊",
      "Зургийн төрлөөс шалтгаална 👍 Зургаа явуулбал яг үнэ хэлж өгье",
      "Ихэвчлэн 5k–20k хооронд байдаг 😊"
    ]);
  }

  if (msg.includes("зас")) {
    return random([
      "Тийм үйлчилгээ хийдэг 😊 Зургаа явуулна уу",
      "Засвар хийж өгнө 👍 Ямар төрлийн засвар вэ?",
      "Болно 😊 Зургaa явуулбал шууд эхэлж болно"
    ]);
  }

  return random([
    "Зургаа явуулбал үзээд хэлж өгье 😊",
    "Илүү тодорхой бичвэл тусалж чадна 👍",
    "Ямар зураг засуулах гэж байна вэ?"
  ]);
}

// 🎲 RANDOM
function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
