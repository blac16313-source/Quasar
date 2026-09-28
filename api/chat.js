export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    // AI connection will be added in the next step.
    return res.status(200).json({
      reply: `Quasar received: ${message}`
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Something went wrong"
    });
  }
}