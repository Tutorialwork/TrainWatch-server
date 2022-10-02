import { Train } from '../models/Train';
import axios, { AxiosResponse } from 'axios';
import { parseDelayedTrains } from './XMLDelayedTrainsParser';

export async function requestDelayedTrainsForStation(stationId: number): Promise<Train[]> {
    let trainList: Train[] = [];

    try {
        const timetableChangesRequest: AxiosResponse = await axios.get(
            `https://apis.deutschebahn.com/db-api-marketplace/apis/timetables/v1/fchg/${stationId}`,
            {
                headers: {
                    'DB-Client-Id': process.env.DB_CLIENT_ID ?? '',
                    'DB-Api-Key': process.env.DB_API_KEY ?? ''
                }
            }
        );

        parseDelayedTrains(timetableChangesRequest.data, (trains: Train[]) => {
            trainList = trains;
        });
    } catch (error: any) {
        console.log(error.message);
        console.log(error.response.data);
    }

    return trainList;
}