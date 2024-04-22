import { AzureStorageFileInterceptor, AzureStorageService, UploadedFileMetadata } from '@nestjs/azure-storage';
import { Body, Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';

@ApiTags('Storage')
@Controller('storage')
export class StorageController {

    constructor(
        private readonly azureStorage: AzureStorageService,
        private readonly logger: ApplicationLoggerService
    ) { }

    @ApiOperation({ summary: 'Upload a file' })
    @ApiResponse({ status: HttpStatus.OK, description: 'The file has been successfully uploaded.'})
    @ApiBody({
        description: 'Request Body',
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                fileName: {
                    type: 'string',
                    nullable: true,
                }
            },
        }
    })
    @HttpCode(HttpStatus.OK)
    @Post('upload')
    @UseInterceptors(
        AzureStorageFileInterceptor('file'),
    )
    async upload(
        @UploadedFile()
        file: UploadedFileMetadata,
        @Body('fileName') fileName: string,
    ) {
        this.logger.log('Uploading file...');
        try {
            const prefix = process.env.AZURE_STORAGE_FOLDER ? `${process.env.AZURE_STORAGE_FOLDER}/` : '';
            const ext = file.originalname.split('.').at(-1);
            const originalname = `${prefix}${new Date().getTime()}_${fileName ? fileName + ext : file.originalname}`;
            file = {
                ...file,
                originalname
            };
            const url = await this.azureStorage.upload(file);
            return {
                url
            };
        } catch (error) {
            this.logger.error(error.message);
        }
    }
}
