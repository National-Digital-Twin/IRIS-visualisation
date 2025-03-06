# FROM node:20-alpine AS builder

# # Set the working directory in the container
# WORKDIR /app


# COPY package*.json .
# RUN npm install
# RUN npm install -g @angular/cli

# COPY .. .
# RUN ng build

# # Start a new stage from scratch
FROM nginx:1.27.4

# Copy the built files from the builder stage to the runner stage
COPY  /dist/c477-vis/ /usr/share/nginx/html

