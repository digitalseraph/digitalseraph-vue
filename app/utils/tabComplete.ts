export interface CompleteContext {
  commands: string[];
  projects: string[];
  posts: string[];
}

export interface CompletionResult {
  completion: string | null;
  candidates: string[];
}

function byPrefix(prefix: string, all: string[]): string[] {
  const lower = prefix.toLowerCase();
  return all.filter((c) => c.toLowerCase().startsWith(lower));
}

function result(matches: string[]): CompletionResult {
  if (matches.length === 1) return { completion: matches[0]!, candidates: [] };
  if (matches.length === 0) return { completion: null, candidates: [] };
  return { completion: null, candidates: matches };
}

export function getCompletions(input: string, ctx: CompleteContext): CompletionResult {
  const trimmed = input.trimStart();
  if (trimmed === "") return { completion: null, candidates: [] };

  const projectsPrefix = "cat projects/";
  const writingPrefix = "cat writing/";

  if (trimmed.toLowerCase().startsWith(projectsPrefix)) {
    const slugFrag = trimmed.slice(projectsPrefix.length).replace(/\.md$/, "");
    const matches = byPrefix(slugFrag, ctx.projects).map((s) => `${projectsPrefix}${s}.md`);
    return result(matches);
  }

  if (trimmed.toLowerCase().startsWith(writingPrefix)) {
    const slugFrag = trimmed.slice(writingPrefix.length).replace(/\.md$/, "");
    const matches = byPrefix(slugFrag, ctx.posts).map((s) => `${writingPrefix}${s}.md`);
    return result(matches);
  }

  const matches = byPrefix(trimmed, ctx.commands);
  return result(matches);
}
