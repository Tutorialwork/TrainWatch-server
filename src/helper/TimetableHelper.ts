import { TimetableRequest } from '../models/TimetableRequest';
import { Train } from '../models/Train';
import moment from 'moment';
import fs from 'fs';
import axios, { AxiosResponse } from 'axios';
import { parseXMLTimetable } from './XMLTImetableParser';

export async function requestTimetable(parameters: TimetableRequest): Promise<Train[]> {
    const cache: Train[] | null = checkCache(parameters);
    const cacheFilePath: string = `cache/${moment(parameters.date).format('YYMMDDHH')}_${parameters.evaNumber}.json`
    let trainList: Train[] = [];

    if (cache) {
        return cache ?? [];
    }

    const date: string = moment(parameters.date).format('YYMMDD');
    const hour: string = moment(parameters.date).format('HH');

    try {
        const timetableRequest: AxiosResponse = await axios.get(
            `https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1/plan/${parameters.evaNumber}/${date}/${hour}`,
            {
                headers: {
                    'DB-Client-Id': process.env.DB_CLIENT_ID ?? '',
                    'DB-Api-Key': process.env.DB_API_KEY ?? ''
                }
            }
        );

        parseXMLTimetable(timetableRequest.data, (trains: Train[]) => {
            trainList = trains;
            fs.writeFileSync(cacheFilePath, JSON.stringify(trainList));
        });
    } catch (error: any) {
        if (error?.response.status === 410) {
            parameters.date = moment(parameters.date).add('1', 'days').toDate();

            return requestTimetable(parameters);
        }
    }

    return trainList;
}

function checkCache(parameters: TimetableRequest): Train[] | null {
    const cacheFilePath: string = `cache/${moment(parameters.date).format('YYMMDDHH')}_${parameters.evaNumber}.json`

    if (fs.existsSync(cacheFilePath)) {
        const cache = fs.readFileSync(cacheFilePath, {
            encoding: 'utf-8'
        });

        const trains: Train[] = JSON.parse(cache);
        trains.forEach((currentTrain: Train) => {
           currentTrain.departure = new Date(currentTrain.departure);
        });
        return trains;
    }

    return null;
}