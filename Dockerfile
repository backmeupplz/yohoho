FROM oven/bun:1.4.4-slim
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache bun install --frozen-lockfile --backend=copyfile
COPY . .
ENV NODE_ENV=production
CMD ["bun", "start"]
