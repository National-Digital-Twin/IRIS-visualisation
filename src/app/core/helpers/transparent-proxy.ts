import { environment } from '@environment';

export const transformUrlForProxy = (host: string, url: string, domain: string, proxyPath: string, stripParam: string): string => {
    const proxyUrl = environment.transparent_proxy.url;
    const qualifiedUrl = proxyUrl.startsWith('http') ? proxyUrl : `${host}${proxyUrl}`;

    const parsedUrl = URL.parse(url);
    if (!parsedUrl) {
        return url;
    }

    parsedUrl.searchParams.delete(stripParam);

    let transformedUrl = '';
    if (parsedUrl.searchParams.size > 0) {
        transformedUrl = `${qualifiedUrl}/${proxyPath}${parsedUrl.pathname}?${parsedUrl.searchParams.toString()}`;
    } else {
        transformedUrl = `${qualifiedUrl}/${proxyPath}${parsedUrl.pathname}`;
    }
    return decodeURI(transformedUrl);
};
