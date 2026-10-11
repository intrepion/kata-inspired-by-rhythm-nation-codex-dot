import { spawn } from "node:child_process";
import { openSync, writeFileSync } from "node:fs";
import net from "node:net";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const port = Number(process.env.PORT || 5194);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid PORT");
const probe = net.createServer();
await new Promise((resolve, reject) => {
  probe.once("error", reject);
  probe.listen(port, "127.0.0.1", () => probe.close(resolve));
});
const log = openSync(root + "play-server.log", "a");
const child = spawn(
  process.execPath,
  [
    root + "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { cwd: root, detached: true, stdio: ["ignore", log, log] },
);
child.unref();
writeFileSync(root + ".play-server.pid", String(child.pid));
console.log(
  `Lumen Relay: http://127.0.0.1:${port} (PID ${child.pid}). Log: ${root}play-server.log`,
);
