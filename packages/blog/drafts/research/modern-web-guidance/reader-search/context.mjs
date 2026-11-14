// Optional source context: retain the passages that produced each article candidate.
// This adds inspectable text; it does not replace the three-paragraph measurement.
import { paragraphLink } from './navigation.mjs';

export function sourceContexts(passageIndex, query, vector, method, live) {
  const ranked = passageIndex.rankings(query, vector);
  return new Map(passageIndex.group(ranked.lists[method]).map(article => [article.article, article.matches.map(passage => {
    const navigation = paragraphLink(passage, live.get(passage.article), query);
    if (navigation.verifiedText) navigation.label = 'Open matching text';
    return { id: passage.id, heading: passage.heading, text: passage.text, sourceBlocks: passage.sourceBlocks, navigation };
  })]));
}
