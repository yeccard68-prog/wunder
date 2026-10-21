// Source helpers for content batches (kept apart from the merge scripts, which import the batches).
export const day = (title) => ({ name: "Wikipedia: " + title.replaceAll("_", " "), url: `https://de.wikipedia.org/wiki/${title}` });
