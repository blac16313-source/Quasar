<script>
(function () {

  "use strict";

  const composer = document.getElementById("composer");
  const input = document.getElementById("input");

  composer.addEventListener("submit", async function (event) {

    event.preventDefault();

    const message = input.value.trim();

    if (!message) return;

    window.QuasarUI.addUserMessage(message);

    input.value = "";

    window.QuasarUI.startThinking();

    try {

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: message
        })
      });

      const text = await response.text();

      console.log("API STATUS:", response.status);
      console.log("API RESPONSE:", text);

      if (!response.ok) {
        throw new Error(
          "API " + response.status + ": " + text
        );
      }

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(
          "Server returned invalid JSON: " + text
        );
      }

      window.QuasarUI.stopThinking();

      window.QuasarUI.addAssistantMessage(
        data.reply || "No reply received."
      );

    } catch (error) {

      console.error("QUASAR ERROR:", error);

      window.QuasarUI.stopThinking();

      window.QuasarUI.addAssistantMessage(
        "ERROR: " + error.message
      );
    }

  });

})();
</script>