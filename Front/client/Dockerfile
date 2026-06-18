# ========================================================
# Estágio 1: Build da aplicação React + Vite
# ========================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências de forma limpa (produção)
RUN npm ci

# Copia o restante do código fonte
COPY . .

# Argumento para definir a URL da API em tempo de build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Executa o build da aplicação (TypeScript + Vite)
RUN npm run build

# ========================================================
# Estágio 2: Servidor Nginx para os arquivos estáticos
# ========================================================
FROM nginx:alpine

# Copia a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia os arquivos compilados do estágio anterior para a pasta padrão do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expõe a porta 80
EXPOSE 80

# Inicia o Nginx
CMD ["nginx", "-g", "daemon off;"]
