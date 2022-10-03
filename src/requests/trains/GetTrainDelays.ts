import { UserRequest } from '../../models/UserRequest';
import { Train } from '../../models/Train';
import { Request, Response } from 'express';
import { requestDelayedTrainsForStation } from '../../helper/DelayHelper';
import { requestTimetable } from '../../helper/TimetableHelper';

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

            const delayedTrains: Train[] = await requestDelayedTrainsForStation(requestedTrain.stationId);
            const trains: Train[] = await requestTimetable({
                evaNumber: requestedTrain.stationId,
                date: department
            });

            const requestedTrainObject: Train | null = trains.filter((currentTrain: Train) => currentTrain.trainNumber === requestedTrain.trainNumber)[0];
            if (!requestedTrainObject) {
                continue;
            }
            const requestedDelayedTrainObject: Train | null = delayedTrains.filter((currentTrain: Train) => currentTrain.trainId === requestedTrainObject.trainId)[0];
            if (requestedDelayedTrainObject) {
                requestedTrainObject.changedDeparture = requestedDelayedTrainObject.changedDeparture;
                requestedTrainObject.changedStations = requestedDelayedTrainObject.changedStations;
                requestedTrainObject.changedPlatform = requestedDelayedTrainObject.changedPlatform;
                requestedTrainObject.messages = requestedDelayedTrainObject.messages;
            }

            trainList.push(requestedTrainObject);
        }

        response.send(trainList);
    } else {
        response.status(400).send();
    }
}