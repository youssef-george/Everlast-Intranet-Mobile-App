import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
    constructor(private searchService: SearchService) { }

    @Get()
    async globalSearch(@Query('q') query: string) {
        return this.searchService.globalSearch(query);
    }
}

