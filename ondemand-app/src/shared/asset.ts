/** Resolve a public asset against the deploy base so images work under a sub-path. */
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '');
