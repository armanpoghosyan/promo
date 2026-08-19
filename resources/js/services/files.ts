import api from './api';

function extractFilename(
    contentDisposition: string | undefined,
    fallback: string
): string {
    if (!contentDisposition) {
        return fallback;
    }

    const utf8Match =
        contentDisposition.match(
            /filename\*=UTF-8''([^;]+)/
        );

    if (utf8Match?.[1]) {
        return decodeURIComponent(
            utf8Match[1]
        );
    }

    const filenameMatch =
        contentDisposition.match(
            /filename="?([^";]+)"?/
        );

    return filenameMatch?.[1]
        ?? fallback;
}

export async function fetchProtectedBlob(
    url: string
): Promise<Blob> {
    const response =
        await api.get<Blob>(
            url,
            {
                responseType: 'blob',
            }
        );

    return response.data;
}

export async function createProtectedObjectUrl(
    url: string
): Promise<string> {
    const blob =
        await fetchProtectedBlob(url);

    return URL.createObjectURL(blob);
}

export async function downloadProtectedFile(
    url: string,
    fallbackFilename: string
): Promise<void> {
    const response =
        await api.get<Blob>(
            url,
            {
                responseType: 'blob',
            }
        );

    const filename =
        extractFilename(
            response.headers[
                'content-disposition'
                ],
            fallbackFilename
        );

    const objectUrl =
        URL.createObjectURL(
            response.data
        );

    const anchor =
        document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = filename;

    document.body.appendChild(anchor);

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(objectUrl);
}
