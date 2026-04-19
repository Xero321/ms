import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PAGE_TOKEN = process.env.PAGE_TOKEN;
const VERIFY_TOKEN = "12345";

// ✅ VERIFY
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// ✅ WEBHOOK DEBUG VERSION
app.post("/webhook", (req, res) => {
  console.log("🔥 WEBHOOK HIT");
  console.log(JSON.stringify(req.body, null, 2));

  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach(entry => {

      console.log("📦 ENTRY:", JSON.stringify(entry, null, 2));

      // 🔥 COMMENT
      if (entry.changes) {
        console.log("🟡 CHANGES FOUND");

        entry.changes.forEach(change => {
          console.log("🔵 CHANGE:", JSON.stringify(change, null, 2));

          if (change.field === "feed") {
            console.log("🟢 FEED EVENT");

            if (change.value && change.value.comment_id) {
              console.log("💬 COMMENT DETECTED");

              const commentId = change.value.comment_id;
              const message = change.value.message || "";

              console.log("💬 COMMENT TEXT:", message);

              // reply (like түр хассан)
              replyComment(
                commentId,
                "Сайн байна уу 😊 inbox-р бичээрэй"
              );
            } else {
              console.log("⚠️ comment_id алга");
            }
          }
        });
      }

      // 🔥 MESSAGE
      if (entry.messaging) {
        console.log("📩 MESSAGE EVENT");

        entry.messaging.forEach(event => {
          console.log("📨 EVENT:", JSON.stringify(event, null, 2));

          if (event.message && event.message.text) {
            console.log("🟢 TEXT MESSAGE");

            const sender_id = event.sender.id;
            const text = event.message.text;

            sendMessage(sender_id, "Сайн байна уу 😊");
          }
        });
      }

    });

    res.sendStatus(200);
  } else {
    console.log("❌ NOT PAGE OBJECT");
    res.sendStatus(404);
  }
});

// 💬 REPLY COMMENT
async function replyComment(commentId, text) {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${commentId}/comments?access_token=${PAGE_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      }
    );

    const data = await res.text();
    console.log("💬 REPLY RESULT:", data);

  } catch (err) {
    console.log("❌ reply error:", err);
  }
}

// 📩 SEND MESSAGE
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Bot ажиллаж байна 🚀"));