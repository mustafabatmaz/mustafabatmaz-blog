// Where the language switch in the header leads. Paths are the same in both languages, except posts: their
// slug differs per language, so from a post it opens the other language's list; the post's own
// "Read in English" link goes to the translation (5c decision 5).
const postPath = /^\/writing\/(?!page\/|tags\/)[^/]+$/;

export function switchTarget(pathname: string) {
  return postPath.test(pathname) ? "/writing" : pathname;
}
