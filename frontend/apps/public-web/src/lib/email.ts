// Light protection against address harvesters (§2, 5b decision 4): the page carries the address reversed and
// base64-encoded, and EmailLink turns it back into a mailto: link in the browser. Not security: it only keeps
// the address out of the HTML that bots scan for "@" and "mailto:".
const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// for...of walks whole characters, not UTF-16 halves
function reverse(text: string) {
  let reversed = "";
  for (const character of text) {
    reversed = character + reversed;
  }
  return reversed;
}

export function encodeEmail(email: string) {
  return btoa(reverse(email));
}

export function decodeEmail(encoded: string): string | null {
  try {
    const email = reverse(atob(encoded));
    return looksLikeEmail.test(email) ? email : null;
  } catch {
    // Not base64
    return null;
  }
}
