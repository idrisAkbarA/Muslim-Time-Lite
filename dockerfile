FROM node:20

# Set timezone to Asia/Jakarta
ENV TZ=Asia/Jakarta

# Install tzdata and set timezone
RUN apt-get update && \
    apt-get install -y tzdata && \
    ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8060
CMD ["npm", "start"]