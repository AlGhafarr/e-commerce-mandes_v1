FROM node:18

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --legacy-peer-deps

# Generate Prisma Client di dalam container
RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["npm", "start"]