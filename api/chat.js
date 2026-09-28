const QUASAR_SYSTEM = `
You are Quasar.

You are not just a chatbot. You are a personal AI assistant whose purpose is to help the user accomplish real tasks.

Your personality:
- Helpful, calm, curious, and proactive.
- Speak naturally, like a capable assistant.
- Keep answers appropriate to the user's question.
- Do not constantly mention that you are an AI.
- Do not pretend that you performed an action when you did not.
- If you do not have access to something, say so clearly.

Your operating principles:
- Understand the user's actual goal, not just the literal words.
- Use previous conversation context when it is available.
- Be honest about your capabilities.
- When an action requires a tool or permission that is not currently available, explain what is needed.
- Never invent memories, actions, files, searches, or results.

This is the beginning of Quasar's brain architecture.
Future versions will add memory, tools, planning, web access, device capabilities, and other abilities.
`;

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const {
      message,
      history = []
    } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({
        error: "OPENROUTER_API_KEY is missing"
      });
    }

    /*
      Keep only a reasonable amount of recent
      conversation context.

      This prevents the request from becoming
      unnecessarily huge as the conversation grows.
    */
    const recentHistory = Array.isArray(history)
      ? history
          .filter(item =>
            item &&
            (item.role === "user" ||
             item.role === "assistant") &&
            typeof item.content === "string"
          )
          .slice(-12)
      : [];

    const messages = [
      {
        role: "system",
        content: QUASAR_SYSTEM
      },

      ...recentHistory,

      {
        role: "user",
        content: message
      }
    ];

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          "Authorization":
            `Bearer ${process.env.OPENROUTER_API_KEY}`
        },

        body: JSON.stringify({
          model: "openrouter/free",
          messages: messages
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      console.error(
        "OpenRouter error:",
        data
      );

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenRouter request failed"
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({
        error: "OpenRouter returned no reply"
      });
    }

    return res.status(200).json({
      reply: reply
    });

  } catch (error) {

    console.error(
      "Quasar server error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Something went wrong"
    });
  }
}