import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

@Pipe({
    name: 'markdown',
    standalone: true
})
export class MarkdownPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}

    transform(value: string | undefined): SafeHtml {
        if (!value) return '';

        const rawHtml = marked.parse(value, {
            gfm: true,
            breaks: true
        }) as string;

        const cleanHtml = DOMPurify.sanitize(rawHtml, {
            ALLOWED_TAGS: [
                'h1', 'h2', 'h3', 'p', 'b', 'i', 'em', 'strong',
                'ul', 'ol', 'li', 'input', 'del', 'strike', 'u', 'span', 'br'
            ],
            ALLOWED_ATTR: ['type', 'checked', 'disabled', 'style', 'class'],
        });

        return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
    }
}