FROM ubuntu:latest
RUN apt-get -y install apt-transport-https
ENV TZ=Europe/Paris
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN apt-get update -y
RUN apt-get -y install lilypond
RUN apt-get -y install python3-pip
RUN pip install python-ly

RUN curl -fsSL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs
RUN apt-get install -y npm
WORKDIR /app
COPY . .
RUN npm install && \
  npm run build
CMD ["npm", "run", "start:dev"]
