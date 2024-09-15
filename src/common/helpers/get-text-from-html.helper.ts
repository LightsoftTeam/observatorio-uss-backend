export function getTextFromHtml(html: string): string {
    const formattedText = html.replace(/<[^>]*>/g, '');
    return formattedText;
}