FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS deps
WORKDIR /workspace
COPY package.json pnpm-workspace.yaml turbo.json biome.json tsconfig.base.json .env.example .lintstagedrc.json .dockerignore ./
COPY apps/api/package.json apps/api/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /workspace
COPY . .
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm --filter @sistema-odontologico/api build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
COPY --from=build --chown=nestjs:nodejs /workspace/apps/api/dist ./dist
COPY --from=build --chown=nestjs:nodejs /workspace/apps/api/package.json ./package.json
COPY --from=build --chown=nestjs:nodejs /workspace/node_modules ./node_modules
USER nestjs
EXPOSE 3001
CMD ["node", "dist/main.js"]
