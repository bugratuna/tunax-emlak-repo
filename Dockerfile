FROM node:20-alpine

WORKDIR /app

# Önce bağımlılık dosyalarını kopyala (Cache avantajı için)
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/api/package*.json ./apps/api/
COPY apps/worker/package*.json ./apps/worker/

# Bağımlılıkları yükle
RUN npm install

# Tüm projeyi kopyala
COPY . .

# Eğer build gerekiyorsa (NextJS ve NestJS için build önemli)
RUN npm run build --if-present

# Senin belirttiğin komutla her şeyi başlat
CMD ["npm", "run", "start:all"]