import {
  BadRequestException,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfessionalsService } from './professionals.service.js';

type AuthenticatedRequest = {
  user?: {
    sub: string;
    tid: string;
    email?: string;
    role?: string;
  };
  params: Record<string, string>;
};

/**
 * Self-service photo management for professionals.
 *
 * Allows authenticated professionals to upload/delete their own profile photo
 * without requiring admin permissions.
 */
@Controller('professionals')
export class SelfPhotoController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post('me/photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException({
              code: 'unsupported_media_type',
              message: 'Solo se permiten imágenes JPEG, PNG o WebP.',
            }),
            false,
          );
        }
      },
    }),
  )
  async uploadSelfPhoto(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file?: { buffer: Buffer; mimetype: string; size: number },
  ) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();
    if (!file) {
      throw new BadRequestException({
        code: 'no_file',
        message: 'No se recibió ningún archivo.',
      });
    }

    return this.professionalsService.updatePhoto(user.sub, user.tid, file);
  }

  @Delete('me/photo')
  @HttpCode(HttpStatus.OK)
  async deleteSelfPhoto(@Req() req: AuthenticatedRequest) {
    const user = req.user;
    if (!user) throw new UnauthorizedException();

    await this.professionalsService.deletePhoto(user.sub, user.tid);

    return { success: true };
  }
}
