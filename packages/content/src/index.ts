import { rules } from "./rules";
import { traits } from "./traits";
import type { ContentSet } from "./types";
import { units } from "./units";

export type * from "./types";
export { rules, traits, units };

export const baseSet: ContentSet = { units, traits, rules };
