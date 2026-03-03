FROM nginxinc/nginx-unprivileged:1.29.5-alpine3.23

RUN ["rm", "/etc/nginx/conf.d/default.conf"]

COPY proxy.conf.template /etc/nginx/templates/proxy.conf.template
COPY settings.conf.template /etc/nginx/templates/settings.conf.template
