FROM node:18-alpine

WORKDIR /app

# Salin package.json dan package-lock.json terlebih dahulu
COPY package*.json ./

# Install dependensi dengan flag --legacy-peer-deps untuk menghindari konflik
RUN npm install --legacy-peer-deps

# Salin seluruh kode sumber
COPY . .

# Expose port yang digunakan aplikasi
EXPOSE 4000

# Gunakan nodemon untuk development (Hot Reload)
CMD ["npx", "nodemon", "src/index.ts"]