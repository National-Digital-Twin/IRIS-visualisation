# Start a new stage from scratch
FROM nginxinc/nginx-unprivileged:1.29.5-alpine3.23

# Copy the built files from the builder stage to the runner stage
COPY  dist/iris/browser/ /usr/share/nginx/html

# Serve the Angular app as a SPA: route unknown paths back to index.html
COPY docker/default.conf /etc/nginx/conf.d/default.conf
