/**
 * 
 * @param content - The content of the post
 * @returns Calculated read time in seconds
 */
export function calculateReadTime(content: string): number{
    const words = content.split(' ').length;
    const minutes = Math.ceil(words / 200);
    const seconds = minutes * 60;
    return seconds;
}