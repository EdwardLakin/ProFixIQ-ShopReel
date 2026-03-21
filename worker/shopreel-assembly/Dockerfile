FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY worker/shopreel-assembly/package.json worker/shopreel-assembly/tsconfig.json ./
RUN npm install

COPY worker/shopreel-assembly/src ./src
RUN npm run build

CMD ["npm", "run", "start"]
