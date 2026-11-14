export function rankHierarchy(passageIndex, blockIndex, query, vector, method = 'hybrid', articleLimit = 5) {
  if (!['keyword', 'semantic', 'hybrid'].includes(method)) throw new Error('Unknown ranking method');
  const passageRankings = passageIndex.rankings(query, vector);
  const blockRankings = blockIndex.rankings(query, vector);
  const articleCandidates = passageIndex.group(passageRankings.lists[method], articleLimit);
  const blockGroups = blockIndex.group(blockRankings.lists[method], 46);
  const byArticle = new Map(blockGroups.map(group => [group.article, group]));
  return {
    articles: articleCandidates.map(group => ({ article: group.article, title: group.title, articleScore: group.score, matches: byArticle.get(group.article)?.matches ?? [] })),
    missingLiteralTerms: blockIndex.missingTerms(query),
    timing: { passage: passageRankings.timing, block: blockRankings.timing },
  };
}
