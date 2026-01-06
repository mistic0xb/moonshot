import TurndownService from 'turndown';
import { marked } from 'marked';

const turndownService = new TurndownService();

export function htmlToMarkdown(html: string): string {
    return turndownService.turndown(html);
}

export function markdownToHtml(markdown: string): string {
    return marked.parse(markdown) as string;
}