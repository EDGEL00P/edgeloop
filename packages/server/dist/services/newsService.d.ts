export interface NewsItem {
    title?: string;
    source?: string;
    pubDate?: string;
    link?: string;
}
export declare function getNflNews(limit?: number): Promise<NewsItem[]>;
//# sourceMappingURL=newsService.d.ts.map