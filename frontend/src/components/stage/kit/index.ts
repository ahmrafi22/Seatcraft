// The parts of the Stageshow kit this project uses. Each component imports
// its own CSS, so this barrel needs no stylesheet of its own.
export { Stage } from "./stage";
export type { Script } from "./act";
export type { Act } from "./act";
export { Window, Bar, Text } from "./window";
export { Count } from "./motion/Count";
export { Collapse } from "./motion/Collapse";
export { box, inset, between, contains } from "./measure";
export type { Point, Rect, Target } from "./measure";
export type { Layout } from "./looks";
