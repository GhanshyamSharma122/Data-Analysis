FROM node:20

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS=--max-old-space-size=512
RUN npm run build

RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]
