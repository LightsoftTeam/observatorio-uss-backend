export enum FileTypes {
    POST_BANNER = 'post-banner',
    USER = 'user',
}


export const fileSizes: {
    [key in FileTypes]: {
        width: number;
        height: number;
    }
} = {
    [FileTypes.POST_BANNER]: {
        width: 1200,
        height: 630,
    },
    [FileTypes.USER]: {
        width: 200,
        height: 200,
    },
}