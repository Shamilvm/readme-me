// Which character represents each section. Shared by server and client code.

export type DoodleName =
  | "mug"
  | "rocket"
  | "laptop"
  | "duck"
  | "pencil"
  | "cursor"
  | "chat"
  | "keycap"
  | "telescope"
  | "cat"
  | "bit";

export const CHAPTER_DOODLE: Record<string, DoodleName> = {
  about: "mug",
  dreams: "rocket",
  tech: "laptop",
  work: "duck",
  strengths: "pencil",
  online: "cursor",
  together: "chat",
  setup: "keycap",
  explore: "telescope",
  final: "cat",
};
