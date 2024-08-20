import { AzureStorageFileInterceptor, AzureStorageService, UploadedFileMetadata } from '@nestjs/azure-storage';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UploadFileDto } from './dto/upload-file.dto';
import { StorageService } from './storage.service';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {

    constructor(
        private readonly storageService: StorageService,
        private readonly azureStorageService: AzureStorageService,
    ) { }

    @ApiOperation({ summary: 'Upload a file' })
    @ApiResponse({ status: HttpStatus.OK, description: 'The file has been successfully uploaded.' })
    @HttpCode(HttpStatus.OK)
    @Post('upload')
    @UseInterceptors(
        AzureStorageFileInterceptor('file'),
    )
    async upload(
        @UploadedFile()
        file: UploadedFileMetadata,
        @Body() uploadFileDto: UploadFileDto,
    ) {
        return this.storageService.uploadFile(file, uploadFileDto, this.azureStorageService);
    }

    @Get()
    @ApiOperation({ summary: 'Get all files' })
    @ApiResponse({ status: HttpStatus.OK, description: 'The files have been successfully retrieved.' })
    async getAll() {
        return this.storageService.getAll();
    }

    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete('/:id')
    @ApiOperation({ summary: 'Delete all files' })
    @ApiResponse({ status: HttpStatus.OK, description: 'The files have been successfully deleted.' })
    async deleteAll(@Param('id') id: string) {
        return this.storageService.remove(id);
    }
}
