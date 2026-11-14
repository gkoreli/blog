import { focusQuery } from '../reader-search/query-v2.mjs';

// Function words only; keep category terms, identifiers, numbers and negation.
const stop = new Set('a an and are as at be been being by can could did do does for from had has have how i if in is it its me my of on or our that the their them there these they this those to us was we were what when where which who will with would you your'.split(' '));
export function lexicalQuery(query) {
  const topic = focusQuery(query).focused;
  return (topic.toLocaleLowerCase('en').match(/[\p{L}\p{N}][\p{L}\p{N}_+#.-]*/gu) ?? []).map(word=>word.replace(/[.-]+$/gu,'')).filter(word=>!stop.has(word)).join(' ');
}
export const miniOptions = {
  fields: ['title', 'heading', 'text'], idField: 'id', storeFields: [],
  searchOptions: { boost: { title: 3, heading: 2, text: 1 }, combineWith: 'OR' },
};
export const tolerantOptions = {
  fuzzy: term=>term.length>=5 ? 0.2 : false, maxFuzzy: 1,
  prefix: (term, index, terms)=>index===terms.length-1 && term.length>=3,
};
