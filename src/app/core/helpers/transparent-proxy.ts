import { environment } from '@environment';

export const transformUrlForProxy = (host: string, url: string, proxyPath: string, stripParam: string): string => {
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

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2025. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.
