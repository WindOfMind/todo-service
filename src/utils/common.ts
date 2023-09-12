export function isEmpty<T extends object>(obj: T) {
    const nonEmptyValues = Object.entries(obj).filter((_, value) => value !== undefined);

    return nonEmptyValues.length === 0;
}
