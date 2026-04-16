FROM node:20-alpine

WORKDIR /app

# Copie d'abord les fichiers package et le dossier Prisma
COPY package*.json ./
COPY prisma ./prisma

# Configuration npm (pour ta connexion internet)
RUN npm config set registry https://registry.npmmirror.com \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# Installation des dépendances
RUN npm ci

# Copie tout le code restant
COPY . .

# Génération du Prisma Client + Build de Next.js
RUN npx prisma generate && npm run build

EXPOSE 3000

CMD ["npm", "start"]