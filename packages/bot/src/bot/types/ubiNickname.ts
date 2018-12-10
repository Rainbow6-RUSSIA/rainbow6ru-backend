export default (phrase: string): string | null => {
    if (!phrase) { return null; }
    return /^[a-zA-Z][\w-.]{2,14}$/g.test(phrase) && !phrase.toLowerCase().startsWith('ubi_') && !phrase.toLowerCase().endsWith('_ubi')
        ? phrase : null;
};
