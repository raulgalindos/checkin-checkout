export type Action = "checkin" | "checkout";

const MESSAGES: Record<Action, readonly string[]> = {
  checkin: ["check in", "Check in"],
  checkout: ["check out", "Check out"],
};

export function parseAction(arg: string | undefined): Action {
  return arg === "checkout" ? "checkout" : "checkin";
}

/** Picks a random phrasing so the message does not look scripted. */
export function pickMessage(action: Action): string {
  const options = MESSAGES[action];
  return options[Math.floor(Math.random() * options.length)];
}
