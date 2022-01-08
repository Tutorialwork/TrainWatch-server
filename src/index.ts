import express, { NextFunction, Request, Response } from 'express';
import { TrainRequest } from './requests/TrainRequest';
import { UserRequest } from './models/UserRequest';
import { Train } from './models/Train';
import moment from 'moment';

const app = express();

let cache: Train[] = [];

setInterval(() => {
    cache = [];
}, 60 * 1000);

app.disable('x-powered-by');
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

            let foundTrains: Train[] = [];

            const foundTrainFromCache: Train = cache.filter(
                (train: Train) => moment(train.departure).format('HHmm') === moment(department).format('HHmm') && train.trainNumber.toString() === requestedTrain.trainNumber
            )[0];

            if (!foundTrainFromCache) {
                foundTrains = await train.loadData(true);
            } else {
                trainList.push(foundTrainFromCache);
                continue;
            }

            cache.push(...foundTrains);

            const foundTrain: Train = foundTrains.filter(
                (train: Train) => moment(train.departure).format('HHmm') === moment(department).format('HHmm') && train.trainNumber.toString() === requestedTrain.trainNumber
            )[0];

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

        const trains: Train[] = await trainRequest.loadData(false);

        response.send(trains);
    } else {
        response.status(400).send();
    }
});

app.listen(3500);