//import './style.css';

const features = [
  "Push to deploy",
  "SSL certificates",
  "Simply Fucked Up My Life",
];

function Features() {
  return `
    <h1>App Features</h1>
    <ul>
      ${features.map((feature) => `<li>✅ ${feature}</li>`).join("")}
    </ul>
  `;
}

// WebSocket for hot reloading
const socket = new WebSocket("ws://localhost:8000");
socket.onmessage = (msg) => {
  if (msg.data === "reload") {
    console.log("Reloading page...");
    globalThis.location.reload();
  }
};

console.log("index.js loaded and running");

const appDiv = document.getElementById("app");
if (appDiv) {
  appDiv.innerHTML = Features();
} else {
  console.error("Element with id 'app' not found");
}