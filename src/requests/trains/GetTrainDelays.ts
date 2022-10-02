import { UserRequest } from '../../models/UserRequest';
import { Train } from '../../models/Train';
import { TrainDelayHelper } from '../../helper/TrainDelayHelper';
import moment from 'moment/moment';
import { Request, Response } from 'express';

let cache: Train[] = [];

setInterval(() => {
    cache = [];
}, 60 * 1000);

export async function getTrainDelays(request: Request, response: Response): Promise<void> {
    const requestedTrains: UserRequest[] = request.body;

    const iterable: Boolean = !!requestedTrains.forEach;
    if (!iterable) {
        response.status(400).json({
            status: 400,
            error: 'A list in the body is expected.'
        });
        return;
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

            const train: TrainDelayHelper = new TrainDelayHelper(requestedTrain.stationId, department);

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
}