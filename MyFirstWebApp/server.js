let socket, response, server, watcher;
// Get the JavaScript file name from command-line arguments
const args = Deno.args;
let jsFile = `index.js`;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "-f" && args[i + 1]) {
    jsFile = args[i + 1];
    break;
  }
}

async function handler(req) {
  const { pathname } = new URL(req.url);

  // Handle WebSocket upgrade for '/' route
  if (pathname === "/" && req.headers.get("upgrade") === "websocket") {
    ({ socket, response } = Deno.upgradeWebSocket(req));
    socket.addEventListener("open", () => {
      console.log("Client connected for hot reload");
    });
    socket.addEventListener("message", (event) => {
      if (event.data === "ping") {
        socket.send("pong");
      }
    });
    socket.addEventListener("close", () => {
      console.log("Client disconnected");
    });
    return response;
  }

  // Handle shutdown request
  if (pathname === "/shutdown" && req.method === "POST") {
    console.log("Shutdown request received");
    // Gracefully close server and WebSocket connections
    server.shutdown(); // Stop accepting new connections
    watcher.close(); // Stop accepting new connections
    socket.close(); // Close all WebSocket connections
    Deno.exit(0); // Exit the process with code 0
  }

  // Serve JavaScript code
  if (pathname === "/" + jsFile) {
    const jsContent = await Deno.readTextFile(jsFile);
    return new Response(jsContent, {
      status: 200,
      headers: { "content-type": "application/javascript" },
    });
  }

  // Serve CSS code
  if (pathname === "/style.css") {
    const cssContent = await Deno.readTextFile("style.css");
    return new Response(cssContent, {
      status: 200,
      headers: { "content-type": "text/css" },
    });
  }

  // Serve HTML content for '/' route
  if (pathname === "/") {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Simple Deno Server with WebSocket and Shutdown</title>
          <link rel="stylesheet" href="/style.css" />
        </head>
        <body>
          <div id="app"></div>
          <button id="shutdownButton">Shutdown Server</button>
          <script src="/${jsFile}" type="module" defer></script>
          <script>
            // Add click event listener to the shutdown button
            document.getElementById("shutdownButton").addEventListener("click", () => {
              fetch('/shutdown', { method: 'POST' })
                .then(response => response.text())
                .then(data => console.log(data))
                .catch(err => console.error("Failed to shutdown:", err));
            });
          </script>
        </body>
      </html>`;
    return new Response(htmlContent, {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  }

  // Return 404 for unknown routes
  return new Response("Not Found", { status: 404 });
}

// Start the server
server = Deno.serve(handler);

watcher = Deno.watchFs(".");
for await (const event of watcher) {
  if (event.kind === "modify") {
    console.log("Files changed, reloading...");
    try {
      socket.send("reload");
    } catch (e) {
      console.error("Failed to send reload message", e);
    }
  }
}
