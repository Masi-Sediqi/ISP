function showBootError(error) {
  const root = document.getElementById("root");
  if (!root) return;

  const message = String(error?.message || error || "Unknown startup error");
  root.innerHTML = `
    <div class="boot-loading">
      <div class="boot-loading-card" role="alert">
        <div class="boot-loading-mark" style="background:#b42318">!</div>
        <strong>Afghan Power could not start.</strong>
        <span style="display:block;margin-bottom:12px">The browser could not load the application module.</span>
        <code style="display:block;white-space:pre-wrap;word-break:break-word;text-align:left;padding:10px;border-radius:8px;background:#f7f5f1;color:#8a1c13;font-size:12px">${message.replace(/[&<>"']/g, (ch) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[ch]))}</code>
        <button id="boot-retry-button" type="button" style="margin-top:14px;border:0;border-radius:8px;background:#151515;color:#fff;padding:9px 16px;font-weight:700;cursor:pointer">Retry</button>
      </div>
    </div>`;

  document.getElementById("boot-retry-button")?.addEventListener("click", () => {
    window.location.reload();
  });
}

async function startApplication() {
  const timeout = window.setTimeout(() => {
    showBootError(new Error("Application loading timed out. Check the development server and retry."));
  }, 30000);
  try {
    await import("./main.jsx");
  } catch (firstError) {
    console.error("[Afghan Power boot error]", firstError);
    showBootError(firstError);
  } finally {
    window.clearTimeout(timeout);
  }
}

startApplication();
