# Use Node base image
FROM node:20-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
  ffmpeg \
  python3 \
  python3-pip \
  git \
  build-essential \
  libfftw3-dev \
  libeigen3-dev \
  && rm -rf /var/lib/apt/lists/*

# Install youtube-dl
RUN pip install youtube-dl

# Install Freyr
RUN npm install -g git+https://github.com/miraclx/freyr-js.git

# --- Essentia ---
# Building Essentia from source is complex.
# You may need to clone and build if you need advanced analysis.
# Example placeholder if you want to install:
# RUN git clone https://github.com/MTG/essentia.git \
#   && cd essentia \
#   && git submodule update --init --recursive \
#   && mkdir build \
#   && cd build \
#   && cmake .. \
#   && make -j$(nproc) \
#   && make install

# Copy app code
WORKDIR /app
COPY . .
RUN rm -rf public tmp dumps

# Install Node deps
RUN npm install

# Build Next.js
RUN npm run build

# Expose Next.js default port
EXPOSE 3000

# Start app
CMD ["npm", "start"]