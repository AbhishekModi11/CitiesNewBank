FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy root metadata and packages for workspace imports
COPY package*.json ./
COPY middleware/ ./middleware/
COPY guideware/ ./guideware/
COPY database/ ./database/
COPY chaincode/ ./chaincode/
COPY backend/ ./backend/

WORKDIR /app/backend
RUN npm ci --omit=dev

EXPOSE 4000

CMD ["node", "src/boot.js"]
