import axios, { AxiosResponse } from 'axios';
import * as xml2js from 'xml2js';
import { TimetableRequest } from './models/TimetableRequest';
import moment from 'moment/moment';
import { Train } from './models/Train';
import { TripStatus } from './models/TripStatus';
import { ChangesRequest } from './models/ChangesRequest';

// FR: 8000107
// BK: 8000718
// Berlin: 8011160

test();

async function test() {
    let trains: Train[] = await requestTimetable({
        evaNumber: 8000107,
        authenticationToken: '873d81c7562d65330abb8d92b531e52c',
        date: new Date()
    });

    trains = await requestChanges({
        evaNumber: 8000107,
        authenticationToken: '873d81c7562d65330abb8d92b531e52c',
        trains: trains
    });

    console.log(trains);
}

async function requestChanges(request: ChangesRequest): Promise<Train[]> {
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

async function requestTimetable(request: TimetableRequest): Promise<Train[]> {
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
