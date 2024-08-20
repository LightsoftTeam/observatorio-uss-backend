import { Injectable, UploadedFile } from '@nestjs/common';
import { BlobSASPermissions, BlobServiceClient, ContainerClient, SASProtocol, StorageSharedKeyCredential, generateBlobSASQueryParameters } from "@azure/storage-blob";
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { UploadFileDto } from './dto/upload-file.dto';
import { AzureStorageService, UploadedFileMetadata } from '@nestjs/azure-storage';
import { InjectModel } from '@nestjs/azure-database';
import { BlobFile } from './entities/blob-file.entity';
import { Container } from '@azure/cosmos';
import { FormatCosmosItem } from 'src/common/helpers/format-cosmos-item.helper';
import { query } from 'express';

@Injectable()
export class StorageService {
    client: BlobServiceClient;
    sharedKeyCredential: StorageSharedKeyCredential;
    containerName: string = process.env.AZURE_STORAGE_CONTAINER;
    container: ContainerClient;

    constructor(
        private readonly logger: ApplicationLoggerService,
        @InjectModel(BlobFile)
        private readonly blobsContainer: Container,
    ) {
        const account = process.env.AZURE_STORAGE_ACCOUNT;
        const accountKey = process.env.AZURE_STORAGE_KEY;
        this.sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
        this.client = new BlobServiceClient(
            `https://${account}.blob.core.windows.net`,
            this.sharedKeyCredential
        );
        this.container = this.client.getContainerClient(this.containerName);
    }

    async uploadMessageMedia({
        buffer,
        blobName,
        contentType,
    }: {
        buffer: Buffer;
        blobName: string;
        contentType: string
    }) {
        try {
            const blockBlobClient = this.container.getBlockBlobClient(blobName);
            const options = { blobHTTPHeaders: { blobContentType: contentType } };
            // await blockBlobClient.uploadStream(stream, contentLength, 5, options);
            await blockBlobClient.uploadData(buffer, options);
            const sasQueryParameters = this.getSasQueryParameters(blobName);
            const blobUrlWithSas = `${blockBlobClient.url}?${sasQueryParameters}`;
            return { blobUrl: blobUrlWithSas, contentType };
        } catch (error) {
            console.log("=====error=======")
            throw error;
        }
    }

    async blobExists({
        blobName
    }: {
        blobName: string
    }) : Promise<boolean> {
        const blobClient = this.container.getBlobClient(blobName);
        return blobClient.exists();
    }

    async getBuffer({
        blobName
    }: {
        blobName: string
    }): Promise<Buffer | null> {
        const blobExists = await this.blobExists({blobName});
        console.log({blobExists});
        if(!blobExists) {
            return null;
        }
        const blockBlobClient = this.container.getBlockBlobClient(blobName);
        try {
            const buffer = await blockBlobClient.downloadToBuffer();
            console.log({
                bufferFound: buffer
            });
            return buffer;
        } catch (error) {
            console.log('getBuffer: Error getting buffer');
            throw error;
        }
    };

    async uploadFile(file: UploadedFileMetadata, uploadFileDto: UploadFileDto, azureStorage: AzureStorageService){
        this.logger.log('Uploading file...');
        const { name, saveReference } = uploadFileDto;
        try {
            const masterFolder = process.env.AZURE_STORAGE_FOLDER ? `${process.env.AZURE_STORAGE_FOLDER}/` : '';
            const folder = masterFolder + (saveReference ? 'multimedia/' : '');
            const ext = file.originalname.split('.').at(-1);
            const originalname = this.getFileFullName({name: name || file.originalname, ext, folder});
            file = {
                ...file,
                originalname
            };
            const url = await azureStorage.upload(file);
            if(saveReference){
                this.logger.log('Saving reference to database...');
                const blobFile: BlobFile = {
                    name,
                    path: originalname,
                    createdAt: new Date(),
                    url
                }
                const { resource } = await this.blobsContainer.items.create(blobFile);
                this.logger.log('Reference saved to database');
                return FormatCosmosItem.cleanDocument(resource, ['path']);
            }
            return {
                url
            };
        } catch (error) {
            this.logger.error(error.message);
        }
    }

    private getFileFullName({name, ext, folder = ''}: {name: string, ext: string, folder?: string}): string {
        const formattedName = name.replace(/\s/g, '_').toLowerCase();
        return `${folder}${new Date().getTime()}_${formattedName + '.' + ext}`;
    }

    private getSasQueryParameters(blobName: string): string {
        const permissions = BlobSASPermissions.parse("r");
        const startsOn = new Date();
        const expiresOn = new Date(startsOn.getTime() + 100 * 365 * 24 * 60 * 60 * 1000);
        const sasQueryParameters = generateBlobSASQueryParameters({
            containerName: this.containerName,
            blobName,
            permissions,
            startsOn,
            expiresOn,
            protocol: SASProtocol.HttpsAndHttp
        }, this.sharedKeyCredential).toString();

        return sasQueryParameters;
    }

    async getAll(){
        const querySpec = {
            query: 'SELECT * FROM c WHERE NOT IS_DEFINED(c.deletedAt)'
        }
        const { resources } = await this.blobsContainer.items.query(querySpec).fetchAll();
        return resources.map(resource => FormatCosmosItem.cleanDocument(resource, ['path']));
    }

    async remove(id: string){
        const {resource} = await this.blobsContainer.item(id, id).read();
        const updatedItem = {
            ...resource,
            deletedAt: new Date()
        };
        this.blobsContainer.item(id, id).replace(updatedItem);
        return null;
    }
}
