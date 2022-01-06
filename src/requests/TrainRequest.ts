import { ChangesRequest } from '../models/ChangesRequest';
import { Train } from '../models/Train';
import axios, { AxiosResponse } from 'axios';
import * as xml2js from 'xml2js';
import moment from 'moment/moment';
import { TimetableRequest } from '../models/TimetableRequest';
import { TripStatus } from '../models/TripStatus';
import * as fs from 'fs';

export class TrainRequest {

    private stationId: number;
    private date: Date;
    private trains: Train[] = [];

    constructor(stationId: number, date: Date) {
        this.stationId = stationId;
        this.date = date;
    }

    public async loadData(fetchChanges: boolean): Promise<Train[]> {
        this.trains = await this.requestTimetable({
            authenticationToken: process.env.DB_API_KEY ?? 'KEY_MISSING',
            date: this.date,
            evaNumber: this.stationId
        });
        if (fetchChanges) {
            this.trains = await this.requestChanges({
                authenticationToken: process.env.DB_API_KEY ?? 'KEY_MISSING',
                evaNumber: this.stationId,
                trains: this.trains
            });
        }

        return this.trains;
    }

    /**
     * Request changes on a given array of train and update it
     * @param request all needed informations
     * @private
     */
    private async requestChanges(request: ChangesRequest): Promise<Train[]> {
        const trains: Train[] = request.trains;

        try {
            const requestData: AxiosResponse = await axios(
                `https://api.deutschebahn.com/timetables/v1/fchg/${request.evaNumber}`,
                {
                    headers: {
                        'Authorization': `Bearer ${request.authenticationToken}`
                    }
                });

            new xml2js.Parser({ attrkey: "key" }).parseString(requestData.data, (error: any, result: any) => {
                if(error === null) {
                    result['timetable']['s'].forEach((changes: any) => {
                        const currentTrainId: string = changes['key']['id'];
                        const train: Train | undefined = trains.filter((train: Train) => train.trainId === currentTrainId)[0];

                        /**
                         * Check if departure object exists and something changed
                         * And also check if the current train is request (in trains array)
                         */
                        if (train) {
                            if (changes['dp'] && changes['dp'][0]['key']) {
                                train.changedDeparture = moment(changes['dp'][0]['key']['ct'], 'YYMMDDHHmm').toDate();
                                train.changedPlatform = changes['dp'][0]['key']['cp'];
                                train.changedStations = changes['dp'][0]['key']['cpth']?.split('|');
                            }
                        }
                    });
                } else {
                    console.log(error);
                }
            });
        } catch (error: any) {
            console.log(error.message);
        }

        return trains;
    }

    /**
     * Request trains for a station in one hour
     * @param request all information in one object
     * @private
     */
    private async requestTimetable(request: TimetableRequest): Promise<Train[]> {
        const trainList: Train[] = [];
        const cacheFilePath: string = `cache/${moment(request.date).format('YYMMDDHH')}_${request.evaNumber}.json`

        if (fs.existsSync(cacheFilePath)) {
            const cache = fs.readFileSync(cacheFilePath, {
                encoding: 'utf-8'
            });

            return JSON.parse(cache);
        }

        try {
            const requestData: AxiosResponse = await axios(
                `https://api.deutschebahn.com/timetables/v1/plan/${request.evaNumber}/${moment(request.date).format('YYMMDD')}/${moment(request.date).format('HH')}`,
                {
                    headers: {
                        'Authorization': `Bearer ${request.authenticationToken}`
                    }
                });

            new xml2js.Parser({ attrkey: "key" }).parseString(requestData.data, (error: any, result: any) => {
                if(error === null) {
                    /**
                     * No timetable found for this request.
                     * Returning empty array.
                     */
                    if (result['timetable'].length === 0) {
                        return [];
                    }
                    for (let i = 0; i < result['timetable']['s'].length; i++) {
                        const tripObject: any = result['timetable']['s'][i]['tl'][0]['key'];

                        /**
                         * Check if train does not end here
                         */
                        if (result['timetable']['s'][i]['dp']) {
                            const departmentObject: any = result['timetable']['s'][i]['dp'][0]['key'];

                            const train: Train = {
                                departure: moment(departmentObject['pt'], 'YYMMDDHHmm').toDate(),
                                platform: departmentObject['pp'],
                                stations: departmentObject['ppth'].split('|'),
                                trainId: result['timetable']['s'][i]['key']['id'],
                                trainNumber: tripObject['n'],
                                trainType: tripObject['c'],
                                trainLine: departmentObject['l'],
                                tripStatus: TripStatus.PLANNED,
                                tripType: tripObject['f']
                            };

                            trainList.push(train);
                        }
                    }
                } else {
                    console.log(error);
                }
            });
        } catch (error: any) {
            console.log(error.message);
        }

        fs.writeFileSync(cacheFilePath, JSON.stringify(trainList));

        return trainList;
    }

}