export class FormatCosmosItem {
    static cleanDocument<T>(document: T, properties?: string[]): Partial<T> {
        const newDocument = Object.fromEntries(
            Object.entries(document).filter(([key]) => !key.startsWith("_"))
        );
        if (properties) {
            properties.forEach((property) => {
                delete newDocument[property];
            });
        }
        return newDocument as Partial<T>;
    }
}