# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=22.20.0
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

ARG NODE_ENV=production
ARG DOCKER_LOCAL
ENV NODE_ENV=$NODE_ENV
ENV DOCKER_LOCAL=$DOCKER_LOCAL

# Install pnpm
ARG PNPM_VERSION=10.19.0
RUN npm install -g pnpm@$PNPM_VERSION


# Throw-away build stage to reduce size of final image
FROM base AS build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3


# Install node modules
COPY package.json pnpm-lock.yaml ./
RUN NODE_ENV=production pnpm install --frozen-lockfile
RUN npm i -g rollup

# Copy application code
COPY . .


# Final stage for app image
FROM base

# Chrome, for puppeteer
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y chromium chromium-sandbox && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Fonts, for rendering PDFs in puppeteer
RUN apt-get update && apt-get install --no-install-recommends -y fonts-noto fonts-noto-color-emoji

# Copy built application
COPY --from=build /app /app

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"
CMD [ "pnpm", "run", "start" ]
