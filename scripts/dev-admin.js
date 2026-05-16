#!/usr/bin/env node
import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

const children = [
  spawn(process.execPath, ["apps/admin-api/src/server.js"], {
    env: { ...process.env, ADMIN_API_PORT: process.env.ADMIN_API_PORT ?? "4180" },
    stdio: "inherit",
  }),
  spawn(
    isWindows ? `${npmCmd} --prefix apps/admin-console run dev` : npmCmd,
    isWindows ? [] : ["--prefix", "apps/admin-console", "run", "dev"],
    {
    env: { ...process.env },
    stdio: "inherit",
    shell: isWindows,
    },
  ),
];

let exiting = false;

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (exiting) return;
    exiting = true;
    for (const other of children) {
      if (other !== child && !other.killed) other.kill();
    }
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    exiting = true;
    for (const child of children) {
      if (!child.killed) child.kill(signal);
    }
    process.exit(0);
  });
}
