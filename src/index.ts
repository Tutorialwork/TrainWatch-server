import express, { NextFunction, Request, Response } from 'express';
import { TrainRequest } from './requests/TrainRequest';
import { UserRequest } from './models/UserRequest';
import { Train } from './models/Train';

const app = express();

app.use(express.json());
/**
 * Caught invalid json
 */
app.use((error: any, request: Request, response: Response, next: NextFunction) => {
    if (error.status === 400 && 'body' in error) {
        return response.status(400).send({ status: 400, message: error.message });
    }
    next();
});

app.post('/trains', async (request: Request, response: Response) => {
    const requestedTrains: UserRequest[] = request.body;

    const iterable: Boolean = !!requestedTrains.forEach;
    if (!iterable) {
        return response.status(400).json({
            status: 400,
            error: 'A list in the body is expected.'
        });
    }

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

            const foundTrain: Train = foundTrains.filter((train: Train) => train.departure.getTime() === department.getTime())[0];

            if (foundTrain) {
                trainList.push(foundTrain);
            }
        }

        response.send(trainList);
    } else {
        response.status(400).send();
    }
});

app.get('/timetable/:stationId/:hour', async (request: Request, response: Response) => {
    if (request.params.stationId && request.params.hour) {
        const date: Date = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate(),
            Number.parseInt(request.params.hour),
            0
        );

        const trainRequest: TrainRequest = new TrainRequest(Number.parseInt(request.params.stationId), date);

        const trains: Train[] = await trainRequest.loadData();

        response.send(trains);
    } else {
        response.status(400).send();
    }
});

app.listen(3500);