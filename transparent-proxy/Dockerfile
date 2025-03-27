FROM nginx:1.27.4

RUN apt-get update && \
    apt-get install -y --no-install-recommends libxslt1.1=1.1.35-1+deb12u1 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN ["rm", "/etc/nginx/conf.d/default.conf"]

COPY proxy.conf.template /etc/nginx/templates/proxy.conf.template
COPY settings.conf.template /etc/nginx/templates/settings.conf.template
