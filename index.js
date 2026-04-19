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

// ✅ WEBHOOK (MESSAGE + COMMENT)
app.post("/webhook", (req, res) => {
  console.log("🔥 EVENT:", JSON.stringify(req.body, null, 2));

  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(entry => {

      // 🔥 COMMENT HANDLE (SAFE)
      if (entry.changes) {
        entry.changes.forEach(change => {
          if (
            change.field === "feed" &&
            change.value &&
            change.value.comment_id
          ) {
            const commentId = change.value.comment_id;
            const message = change.value.message || "";

            console.log("💬 COMMENT:", message);

            likeComment(commentId);
            replyComment(
              commentId,
              "Сайн байна уу 😊 дэлгэрэнгүй мэдээллийг inbox-р бичээрэй"
            );
          }
        });
      }

      // 🔥 MESSENGER HANDLE (SAFE)
      if (entry.messaging && entry.messaging.length > 0) {
        entry.messaging.forEach(event => {
          if (event.message && event.message.text) {
            const sender_id = event.sender.id;
            const text = event.message.text;

            const reply = getSmartReply(text);
            sendMessage(sender_id, reply);
          }
        });
      }

    });

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// ✅ SEND MESSAGE
async function sendMessage(sender, text) {
  try {
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
  } catch (err) {
    console.log("❌ sendMessage error:", err);
  }
}

// 👍 LIKE COMMENT
async function likeComment(commentId) {
  try {
    await fetch(
      `https://graph.facebook.com/v18.0/${commentId}/likes?access_token=${PAGE_TOKEN}`,
      {
        method: "POST"
      }
    );
  } catch (err) {
    console.log("❌ like error:", err);
  }
}

// 💬 REPLY COMMENT
async function replyComment(commentId, text) {
  try {
    await fetch(
      `https://graph.facebook.com/v18.0/${commentId}/comments?access_token=${PAGE_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      }
    );
  } catch (err) {
    console.log("❌ reply error:", err);
  }
}

// 🚀 SERVER
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
