/**
 * scripts/check-notes-images.ts
 *
 * Fails if any live (non-draft) Notes article's `coverImage` frontmatter path
 * doesn't resolve to a real file under `public/`.
 *
 * Why this exists: two separate hotfix commits were needed for this exact
 * failure shape (coverImage path/extension didn't match the actual file on
 * disk — "fix(notes): move hero image to correct path, update coverImage to
 * .png" and "content: fix coverImage extension and copy typo"). Nothing
 * caught it before push either time. This script is that check.
 *
 * Usage:
 *   npx tsx scripts/check-notes-images.ts
 *
 * Exit code 0 = all good. Exit code 1 = at least one broken coverImage path,
 * details printed to stderr.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import matter from 'gray-matter';

const NOTES_DIR = path.resolve(__dirname, '..', 'src', 'content', 'notes');
const REQUIRED_PREFIX = '/images/notes/';

// Build a Set of every file tracked by git under public/ (exact paths, case-sensitive).
// Comparing against git ls-files catches wrong-case paths that existsSync() misses on
// macOS (case-insensitive FS) but that would 404 on Vercel (Linux, case-sensitive FS).
// Also catches staged renames: `git ls-files` reflects the index, so a freshly
// staged `git mv` shows the new path here even before committing.
function buildGitFileSet(): Set<string> {
  const out = execSync('git ls-files public/', { encoding: 'utf8' });
  const set = new Set<string>();
  for (const line of out.split('\n')) {
    if (line) set.add(line.trim()); // paths relative to repo root, e.g. "public/images/notes/foo.jpg"
  }
  return set;
}

function main() {
  const gitFiles = buildGitFileSet();

  const files = fs
    .readdirSync(NOTES_DIR)
    .filter((f) => f.endsWith('.mdx'));

  const problems: string[] = [];
  let checked = 0;

  for (const file of files) {
    const fullPath = path.join(NOTES_DIR, file);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(raw);

    if (data.draft === true) continue; // drafts aren't live, don't gate on them

    checked += 1;

    const coverImage: string | undefined = data.coverImage;
    if (!coverImage) {
      problems.push(`${file}: missing coverImage in frontmatter`);
      continue;
    }
    if (!coverImage.startsWith('/')) {
      problems.push(`${file}: coverImage "${coverImage}" doesn't start with "/" — unexpected format`);
      continue;
    }

    // Enforce canonical prefix so all assets live under /images/notes/.
    if (!coverImage.startsWith(REQUIRED_PREFIX)) {
      problems.push(`${file}: coverImage "${coverImage}" must start with "${REQUIRED_PREFIX}" — found wrong prefix`);
      continue;
    }

    const basename = path.basename(coverImage);

    // Filename must have an extension.
    if (!basename.includes('.')) {
      problems.push(`${file}: coverImage "${coverImage}" has no file extension`);
      continue;
    }

    // Filename must not contain spaces (URLs with spaces break in production).
    if (basename.includes(' ')) {
      problems.push(`${file}: coverImage "${coverImage}" contains spaces in the filename — rename to use hyphens`);
      continue;
    }

    // Check the file is tracked by git (exact case, as Vercel would see it).
    const gitRelPath = `public${coverImage}`; // e.g. "public/images/notes/foo.jpg"
    if (!gitFiles.has(gitRelPath)) {
      problems.push(`${file}: coverImage "${coverImage}" is not tracked by git (missing, untracked, or wrong case) — it would 404 in production`);
      continue;
    }

    if (!data.coverImageAlt) {
      problems.push(`${file}: coverImage is set but coverImageAlt is missing (this throws a build error per src/types/notes.ts)`);
    }
  }

  console.log(`Checked ${checked} live Notes article(s).`);

  if (problems.length > 0) {
    console.error(`\n${problems.length} problem(s) found:\n`);
    for (const p of problems) console.error(`  - ${p}`);
    console.error('\nFix these before pushing — a broken coverImage path is exactly what broke the last two Notes deploys.');
    process.exit(1);
  }

  console.log('All coverImage paths resolve to real files. Good to push.');
}

main();
