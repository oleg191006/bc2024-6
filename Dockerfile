# Вибираємо базовий образ Node.js
FROM node:18

# Створюємо робочу директорію
WORKDIR /app

# Копіюємо package.json і встановлюємо залежності
COPY package.json .
RUN npm install

# Копіюємо решту файлів
COPY . .

# Виставляємо порт
EXPOSE 3000

# Запускаємо додаток
CMD ["node", "index.js"]
