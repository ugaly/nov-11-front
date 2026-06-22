FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --force

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL=https://api.companies.co.tz
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3004
ENV HOSTNAME=0.0.0.0

EXPOSE 3004

CMD ["npm", "start"]
