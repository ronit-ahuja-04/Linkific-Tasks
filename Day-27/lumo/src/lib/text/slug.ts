/** "Loops & Logic 101!" -> "loops-logic-101". Matches the database rule ^[a-z0-9]+(-[a-z0-9]+)*$. */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
}

export const SLUG_RULE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
