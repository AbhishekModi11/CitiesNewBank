FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY middleware/ ./middleware/
COPY guideware/ ./guideware/
COPY frontend/ ./frontend/

WORKDIR /app/frontend
RUN npm ci
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
