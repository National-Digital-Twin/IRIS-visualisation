##### Stage 1, based on Node.js, to build and compile app
FROM node:18 as node
# Set working directory
WORKDIR /app
COPY package.json package-lock.json ./
# Install dependencies
RUN npm ci --no-optional
# Copy source code
COPY . .
# Build app
RUN npm run build

##### Stage 2, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:stable-perl
VOLUME /var/cache/nginx
# Copy build files into nginx html dir.  Note that NG CLI creates
# a sub directory in dist using the app name
COPY --from=node /app/dist/c477-vis /usr/share/nginx/html
# Copy nginx configs.  This is set up to load a environment specific config
# file for the app to load at runtime
COPY ./.docker/config/nginx-custom.conf /etc/nginx/conf.d/default.conf
COPY ./.docker/config/nginx.conf /etc/nginx/nginx.conf
