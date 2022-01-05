# TrainWatch-server

This is the server used for the TrainWatch Apple Watch App.

## Deploy

### On M1 Macs

**One command**

- ````docker buildx build --platform linux/amd64 --tag ghcr.io/tutorialwork/trainwatch/trainwatch-server:<tag> . --push````

**Save to local images**

- ````docker buildx build --platform linux/amd64 --tag ghcr.io/tutorialwork/trainwatch/trainwatch-server:<tag> . --load````
- ````docker push ghcr.io/tutorialwork/trainwatch/trainwatch-server:<tag>````
