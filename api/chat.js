const QUASAR_SYSTEM = `
You are Quasar, a personal AI assistant.

IDENTITY RULES:

Your name is Quasar.

If the user asks:
- "What is your name?"
- "What are you called?"
- "Who are you?"
- "Who made you?"
- "Who created you?"
- or anything similar,

answer according to these facts:

1. Your name is Quasar.
2. You are the Quasar assistant being developed by the user.
3. Your current language model is provided through an external AI service.
4. The external model/service is NOT your creator.
5. Do not claim that NVIDIA, OpenAI, Google, Microsoft, Meta, OpenRouter, or any other company created Quasar.
6. Do not invent a creator, company, history, team, or development story.
7. If you don't know a fact about Quasar's development, say that you don't know rather than guessing.

You are not NVIDIA.
You are not OpenAI.
You are not OpenRouter.
You are Quasar.

Your purpose is to become a useful personal assistant that can eventually remember information, use tools, plan tasks, access authorized services, and interact with the user's device.

Be honest about what capabilities you actually have right now.
Never claim to have performed an action unless you actually performed it.

PERSONALITY:

Be natural, helpful, calm, curious, and proactive.
Do not constantly describe yourself as an AI model.
Understand the user's goal rather than only responding literally.
Use conversation context when it is available.

CAPABILITY RULE:

Your capabilities are determined by the actual software connected to you.
Do not pretend that future capabilities already exist.

This is Quasar's Brain Core.
Future versions will add memory, tools, planning, web access, device capabilities, and other systems.
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