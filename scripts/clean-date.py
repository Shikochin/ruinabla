import os
import re

POSTS_DIR = os.path.join(os.path.dirname(__file__), '../src/posts')

def clean_date(date_str):
    m = re.match(r"(\d{4}-\d{2}-\d{2})", date_str)
    if m:
        return m.group(1)
    return date_str  # fallback, won't break

def process_file(filepath):
    with open(filepath, 'r', encoding='utf8') as f:
        lines = f.readlines()

    in_frontmatter = False
    date_pattern = re.compile(r'^(date:)\s*(.+)$')
    changed = False

    for idx, line in enumerate(lines):
        if line.strip() == "---":
            in_frontmatter = not in_frontmatter
            continue
        if in_frontmatter:
            match = date_pattern.match(line)
            if match:
                prefix, dateval = match.groups()
                new_date = clean_date(dateval.strip())
                if dateval.strip() != new_date:
                    lines[idx] = f"{prefix} {new_date}\n"
                    changed = True

    if changed:
        with open(filepath, 'w', encoding='utf8') as f:
            f.writelines(lines)
        print(f"日期已清理: {filepath}")

def walk_posts_dir():
    for root, _, files in os.walk(POSTS_DIR):
        for file in files:
            if file.endswith('.md') or file.endswith('.mdx'):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    walk_posts_dir()