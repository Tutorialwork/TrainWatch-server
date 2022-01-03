import { ChangesRequest } from '../models/ChangesRequest';
import { Train } from '../models/Train';
import axios, { AxiosResponse } from 'axios';
import * as xml2js from 'xml2js';
import moment from 'moment/moment';
import { TimetableRequest } from '../models/TimetableRequest';
import { TripStatus } from '../models/TripStatus';

export class TrainRequest {

    private stationId: number;
    private date: Date;
    private trains: Train[] = [];

    constructor(stationId: number, date: Date) {
        this.stationId = stationId;
        this.date = date;
    }

    public async loadData(): Promise<Train[]> {
        this.trains = await this.requestTimetable({
            authenticationToken: process.env.DB_API_KEY ?? 'KEY_MISSING',
            date: this.date,
            evaNumber: this.stationId
        });
        this.trains = await this.requestChanges({
            authenticationToken: process.env.DB_API_KEY ?? 'KEY_MISSING',
            evaNumber: this.stationId,
            trains: this.trains
        });

        return this.trains;
    }

    /**
     * Request changes on a given array of train and update it
     * @param request all needed informations
     * @private
     */
    private async requestChanges(request: ChangesRequest): Promise<Train[]> {
        const trains: Train[] = request.trains;

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
                            train.changedDepartment = moment(changes['dp'][0]['key']['ct'], 'YYMMDDHHmm').toDate();
                            train.changedPlatform = changes['dp'][0]['key']['cp'];
                            train.changedStations = changes['dp'][0]['key']['cpth']?.split('|');
                        }
                    }
                });
            } else {
                console.log(error);
            }
        });

        return trains;
    }

    /**
     * Request trains for a station in one hour
     * @param request all information in one object
     * @private
     */
    private async requestTimetable(request: TimetableRequest): Promise<Train[]> {
        const trainList: Train[] = [];

        const requestData: AxiosResponse = await axios(
            `https://api.deutschebahn.com/timetables/v1/plan/${request.evaNumber}/${moment(request.date).format('YYMMDD')}/${moment(request.date).format('HH')}`,
            {
                headers: {
                    'Authorization': `Bearer ${request.authenticationToken}`
                }
            });

        new xml2js.Parser({ attrkey: "key" }).parseString(requestData.data, (error: any, result: any) => {
            if(error === null) {
                for (let i = 0; i < result['timetable']['s'].length; i++) {
                    const tripObject: any = result['timetable']['s'][i]['tl'][0]['key'];

                    /**
                     * Check if train does not end here
                     */
                    if (result['timetable']['s'][i]['dp']) {
                        const departmentObject: any = result['timetable']['s'][i]['dp'][0]['key'];

                        const train: Train = {
                            department: moment(departmentObject['pt'], 'YYMMDDHHmm').toDate(),
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

        return trainList;
    }

}