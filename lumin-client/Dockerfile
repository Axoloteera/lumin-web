FROM node:18 AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

RUN npm run build

FROM node:18
WORKDIR /app
COPY --from=build /app/dist /app

RUN npm install -g serve

CMD ["serve", "-s", "/app", "-l", "8080"]