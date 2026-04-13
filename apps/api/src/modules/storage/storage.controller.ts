import { Controller, Get, Req, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from './storage.service.js';
import { Public } from '../../common/decorators/index.js';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Public()
  @Get('{*path}')
  async serveFile(@Req() req: any, @Res() res: Response) {
    const prefix = '/api/storage/';
    const url: string = req.originalUrl || req.url;
    const pathWithoutQuery = url.split('?')[0] ?? '';
    const key = pathWithoutQuery.startsWith(prefix)
      ? pathWithoutQuery.slice(prefix.length)
      : pathWithoutQuery.replace(/^\/?api\/storage\/?/, '');

    try {
      const stream = await this.storageService.getStream(key);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Type', 'image/webp');
      stream.pipe(res);
    } catch {
      res.status(HttpStatus.NOT_FOUND).send({ message: 'File not found' });
    }
  }
}
