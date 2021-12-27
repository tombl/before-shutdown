import * as os from "os";
import { setTimeout } from "timers/promises";

const originalProcessExit = process.exit;

export type Hook = () => Promise<void> | void;
const hooks = new Set<Hook>();
export function beforeShutdown(hook: Hook) {
  hooks.add(hook);
  return () => {
    hooks.delete(hook);
  };
}

const TIMEOUT = Symbol("timeout");

let exiting = false;
async function onShutdown() {
  if (exiting) originalProcessExit();
  exiting = true;

  const result = await Promise.race([
    setTimeout(5000, TIMEOUT),
    Promise.all(
      [...hooks].map(async (hook) => {
        await hook();
      })
    ),
  ]);

  if (result === TIMEOUT) {
    if (process.exitCode === 0 || process.exitCode === undefined) {
      process.exitCode = 1;
    }
    console.error(new Error("Timed out while shutting down"));
  }

  originalProcessExit();
}

process.exit = (code) => {
  if (code !== undefined) {
    process.exitCode = code;
  }

  onShutdown();

  return undefined as never;
};
process.on("beforeExit", () => {
  onShutdown();
});

// every signal which node exits on, but doesn't exit when there's a listener
const SIGNALS = [
  "SIGHUP",
  "SIGINT",
  "SIGQUIT",
  "SIGILL",
  "SIGTRAP",
  "SIGIOT",
  "SIGBUS",
  "SIGFPE",
  "SIGSEGV",
  "SIGUSR2",
  "SIGALRM",
  "SIGTERM",
  "SIGSTKFLT",
  "SIGXCPU",
  "SIGVTALRM",
  "SIGPROF",
  "SIGPOLL",
  "SIGPWR",
  "SIGSYS",
] as const;

for (const signal of SIGNALS) {
  process.on(signal, () => {
    process.exitCode = 128 + os.constants.signals[signal];
  });
}
process.on("uncaughtException", (error) => {
  console.error(error);
  process.exitCode = 1;
  onShutdown();
});
