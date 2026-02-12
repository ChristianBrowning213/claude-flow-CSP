import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { resolveInRoot, runtimePaths } from '../../persistence/paths.js';

export interface ExtractedArtifact {
  source_type: 'repo_file' | 'local_doc' | 'url_doc';
  source_ref: string;
  title: string;
  content: string;
  snippets: string[];
  symbols: string[];
  sha256: string;
}

const MAX_FILE_BYTES = 1024 * 1024;
const SUPPORTED_FILE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.mjs', '.cjs', '.py', '.md', '.txt', '.json', '.yaml', '.yml'
]);
const IGNORE_DIRS = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'coverage']);

function hashText(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

function tokenizeLines(content: string, max = 3): string[] {
  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.slice(0, max);
}

function extractSymbols(content: string, filePath: string): string[] {
  const out = new Set<string>();
  const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
  const tsLike = /\b(class|function|interface|type|const)\s+([a-zA-Z_][\w]*)/g;
  const pyLike = /^\s*(class|def)\s+([a-zA-Z_][\w]*)/gm;
  const matcher = ext === '.py' ? pyLike : tsLike;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(content)) !== null) {
    out.add(match[2]);
  }
  return Array.from(out);
}

function walkFiles(rootPath: string, out: string[]): void {
  for (const entry of readdirSync(rootPath)) {
    const fullPath = join(rootPath, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (!IGNORE_DIRS.has(entry)) {
        walkFiles(fullPath, out);
      }
      continue;
    }
    const ext = entry.slice(entry.lastIndexOf('.')).toLowerCase();
    if (!SUPPORTED_FILE_EXTENSIONS.has(ext)) continue;
    if (stats.size > MAX_FILE_BYTES) continue;
    out.push(fullPath);
  }
}

export function extractArtifactsFromRepo(repoPath: string): ExtractedArtifact[] {
  const files: string[] = [];
  walkFiles(repoPath, files);
  const artifacts: ExtractedArtifact[] = [];

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8');
    const rel = relative(repoPath, filePath).replaceAll('\\', '/');
    artifacts.push({
      source_type: 'repo_file',
      source_ref: rel,
      title: rel,
      content,
      snippets: tokenizeLines(content, 5),
      symbols: extractSymbols(content, filePath),
      sha256: hashText(content)
    });
  }
  return artifacts;
}

export function extractArtifactFromLocalFile(pathInput: string): ExtractedArtifact {
  const resolved = resolveInRoot(process.cwd(), pathInput);
  const content = readFileSync(resolved, 'utf-8');
  const relToWorkspace = relative(process.cwd(), resolved).replaceAll('\\', '/');
  return {
    source_type: 'local_doc',
    source_ref: relToWorkspace,
    title: relToWorkspace,
    content,
    snippets: tokenizeLines(content, 5),
    symbols: extractSymbols(content, resolved),
    sha256: hashText(content)
  };
}

function extractCodeBlocks(text: string): string[] {
  const blocks: string[] = [];
  const regex = /```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const block = match[1].trim();
    if (block.length > 0) {
      blocks.push(block);
    }
  }
  return blocks.slice(0, 20);
}

export async function extractArtifactFromUrl(url: string): Promise<ExtractedArtifact> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${url}`);
  }
  const content = await response.text();
  const codeBlocks = extractCodeBlocks(content);
  const snippets = codeBlocks.length > 0
    ? codeBlocks.slice(0, 5)
    : tokenizeLines(content, 5);

  return {
    source_type: 'url_doc',
    source_ref: url,
    title: url,
    content,
    snippets,
    symbols: [],
    sha256: hashText(content)
  };
}

export function researchArtifactPath(artifactId: string): string {
  return resolveInRoot(runtimePaths.artifactsResearch, `${artifactId}.json`);
}
