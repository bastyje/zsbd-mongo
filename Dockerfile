FROM mongo:7
RUN apt update
RUN apt install -y unzip
RUN apt install -y curl