import { Request, Response } from 'express';
import { TrainDelayHelper } from '../../helper/TrainDelayHelper';
import { Train } from '../../models/Train';

export async function getTimetable(request: Request, response: Response): Promise<void> {
    if (request.params.stationId && request.params.hour) {
        const date: Date = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate(),
            Number.parseInt(request.params.hour),
            0
        );

        const trainRequest: TrainDelayHelper = new TrainDelayHelper(Number.parseInt(request.params.stationId), date);

        const trains: Train[] = await trainRequest.loadData(false);

        response.send(trains);
    } else {
        response.status(400).send();
    }
}