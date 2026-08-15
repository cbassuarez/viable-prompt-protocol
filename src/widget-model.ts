export const CONTROLLER_MODES = ["g", "q", "o", "c", "o_f"] as const;

export type ControllerMode = (typeof CONTROLLER_MODES)[number];
export type ControllerCorrectness = "correct" | "incorrect" | null;
export type ControllerSeverity = "minor" | "major" | null;
export type ControllerLocusMode = "current" | "new";

export interface ControllerPathNode {
  command_tag: string;
  response_tag: ControllerMode;
  tag_index: number;
  modifiers: string[];
}

export interface ControllerSelection {
  mode: ControllerMode;
  correctness: ControllerCorrectness;
  severity: ControllerSeverity;
  locusMode: ControllerLocusMode;
  nextLocus: string;
  skipToOutput: boolean;
  path: ControllerPathNode[];
}

export interface ComposedControllerCommand {
  command: string;
  next_locus?: string;
  kind: "ordinary" | "new-locus" | "skip-output" | "accepted-output-pipeline";
}

const locusPattern = /^[A-Za-z0-9][A-Za-z0-9 ._/-]{0,63}$/;

export function isValidControllerLocus(value: string): boolean {
  return locusPattern.test(value.trim());
}

export function composeControllerCommand(selection: ControllerSelection): ComposedControllerCommand {
  const modifiers = [selection.correctness, selection.severity]
    .filter((value): value is Exclude<typeof value, null> => value !== null)
    .map((value) => `--${value}`);

  if (selection.skipToOutput) {
    return {
      command: ["!<e_o>", ...modifiers].join(" "),
      kind: "skip-output"
    };
  }

  if (selection.locusMode === "new") {
    const nextLocus = selection.nextLocus.trim();
    if (!isValidControllerLocus(nextLocus)) {
      throw new Error("Locus must be 1-64 safe characters.");
    }
    return {
      command: ["!<e>", ...modifiers, `--<${selection.mode}>`].join(" "),
      next_locus: nextLocus,
      kind: "new-locus"
    };
  }

  const latest = selection.path.at(-1);
  if (latest?.response_tag === "o" && selection.correctness === "correct" && selection.mode !== "o") {
    const pipelineModifiers = selection.severity ? [`--${selection.severity}`] : [];
    return {
      command: ["!<o>", "--correct", ...pipelineModifiers, `--<${selection.mode}>`].join(" "),
      kind: "accepted-output-pipeline"
    };
  }

  return {
    command: [`!<${selection.mode}>`, ...modifiers].join(" "),
    kind: "ordinary"
  };
}

export function visibleCyclePath<T>(path: readonly T[], expanded: boolean, limit = 5): readonly T[] {
  if (expanded || path.length <= limit) return path;
  return path.slice(-limit);
}

