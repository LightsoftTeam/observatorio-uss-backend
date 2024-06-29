import { Injectable } from '@nestjs/common';
import { BlobSASPermissions, BlobServiceClient, ContainerClient, StorageSharedKeyCredential, generateBlobSASQueryParameters } from "@azure/storage-blob";

@Injectable()
export class StorageService {
    client: BlobServiceClient;
    sharedKeyCredential: StorageSharedKeyCredential;
    containerName: string = process.env.AZURE_STORAGE_CONTAINER;
    container: ContainerClient;

    constructor() {
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

    private streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: Buffer[] = [];
            readableStream.on("data", (data) => {
                chunks.push(data instanceof Buffer ? data : Buffer.from(data));
            });
            readableStream.on("end", () => {
                resolve(Buffer.concat(chunks));
            });
            readableStream.on("error", reject);
        });
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
            expiresOn
        }, this.sharedKeyCredential).toString();

        return sasQueryParameters;
    }
}
