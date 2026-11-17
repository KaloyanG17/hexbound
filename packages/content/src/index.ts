import { items } from "./items";
import { monsters } from "./monsters";
import { rules } from "./rules";
import { traits } from "./traits";
import type { ContentSet } from "./types";
import { units } from "./units";

export type * from "./types";
export { items, monsters, rules, traits, units };

export const baseSet: ContentSet = { units, monsters, items, traits, rules };
