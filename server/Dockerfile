# Use a newest stable version of Node as a parent image
FROM node:erbium
# Set the working directory to /api
WORKDIR /server
# copy package.json into the container at /api
COPY package*.json /server/
# install dependencies
RUN npm install
# Copy the current directory contents into the container at /api
COPY . /server/
# Make port 8393 available to the world outside this container
EXPOSE 8393
# Run the app when the container launches
CMD ["npm", "start"]