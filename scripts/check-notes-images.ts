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
import matter from 'gray-matter';

const NOTES_DIR = path.resolve(__dirname, '..', 'src', 'content', 'notes');
const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');

function main() {
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

    const diskPath = path.join(PUBLIC_DIR, coverImage);
    if (!fs.existsSync(diskPath)) {
      problems.push(`${file}: coverImage "${coverImage}" has no matching file at public${coverImage}`);
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
