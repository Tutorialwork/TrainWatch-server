import express, { Request, Response } from 'express';
import { TrainRequest } from './requests/TrainRequest';
import { UserRequest } from './models/UserRequest';
import { Train } from './models/Train';

const app = express();

app.use(express.json());

app.post('/trains', async (request: Request, response: Response) => {
    const requestedTrains: UserRequest[] = request.body;

    if (requestedTrains) {
        const trainList: Train[] = [];

        for (const requestedTrain of requestedTrains) {
            const department: Date = new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate(),
                requestedTrain.hour,
                requestedTrain.minute
            );

            const train: TrainRequest = new TrainRequest(requestedTrain.stationId, department);

            const foundTrains: Train[] = await train.loadData();

            const foundTrain: Train = foundTrains.filter((train: Train) => train.department.getTime() === department.getTime())[0];

            if (foundTrain) {
                trainList.push(foundTrain);
            }
        }

        response.send(trainList);
    } else {
        response.status(400).send();
    }
});

app.listen(3500);