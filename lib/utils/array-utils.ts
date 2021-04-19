export function groupArrayBy<T, U>(arr: T[], propertyGetter: (t:T) => U): Map<U, T[]> {
    return arr.reduce((acc, e) => {
        const property = propertyGetter(e);
        return new Map([
            ...acc,
            [propertyGetter(e), [...(acc.get(property) ?? []), e]]
        ]);
    }, new Map() as Map<U, T[]>);
}