FROM node:20-alpine

WORKDIR /app

# Copiar manifiestos primero para cachear dependencias
COPY package*.json ./

RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto por defecto de Vite
EXPOSE 5173

# Arrancar con host 0.0.0.0 explícito
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
