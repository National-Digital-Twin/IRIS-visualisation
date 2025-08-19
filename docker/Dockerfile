# Start a new stage from scratch
FROM nginxinc/nginx-unprivileged:1.29-alpine3.22

# Copy the built files from the builder stage to the runner stage
COPY  dist/iris/browser/ /usr/share/nginx/html