import { Request, Response } from 'express';
import { Train } from '../../models/Train';
import { requestTimetable } from '../../helper/TimetableHelper';

export async function getTimetable(request: Request, response: Response): Promise<void> {
    if (request.params.stationId && request.params.hour) {
        const date: Date = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate(),
            Number.parseInt(request.params.hour),
            0
        );

        const stationId = Number.parseInt(request.params.stationId);
        const trains: Train[] = await requestTimetable({
            evaNumber: stationId,
            date: date
        });

        response.send(trains);
    } else {
        response.status(400).send();
    }
}