import { db } from '@/lib/db';

export async function matchCategory(note: string | null) {
  if (!note) return null;
  const rules = await db.categorizationRule.findMany({
    where: { isActive: true },
    include: { category: true },
    orderBy: { priority: 'desc' },
  });
  for (const rule of rules) {
    if (note.includes(rule.keyword)) {
      return { ruleId: rule.id, categoryId: rule.categoryId, categoryName: rule.category.name, categoryIcon: rule.category.icon };
    }
  }
  return null;
}
