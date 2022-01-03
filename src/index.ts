import axios, { AxiosResponse } from 'axios';
import * as xml2js from 'xml2js';
import { TimetableRequest } from './models/TimetableRequest';
import moment from 'moment/moment';
import { Train } from './models/Train';
import { TripStatus } from './models/TripStatus';

// FR: 8000107
// BK: 8000718
// Berlin: 8011160

requestTimetable({
    evaNumber: 8011160,
    date: new Date(),
    authenticationToken: '873d81c7562d65330abb8d92b531e52c'
});

async function requestTimetable(request: TimetableRequest): Promise<void> {
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
                console.log('============');
                console.log('Today train id');
                console.log(result['timetable']['s'][i]['key']['id']);

                console.log('Train Info');

                const tripObject: any = result['timetable']['s'][i]['tl'][0]['key'];

                console.log(`Trip ${tripObject['c']}${tripObject['n']} of type ${tripObject['f']} is currently ${tripObject['t']}`);

                console.log('Department');
                if (result['timetable']['s'][i]['dp']) {
                    const departmentObject: any = result['timetable']['s'][i]['dp'][0]['key'];

                    const departmentDate: Date = moment(departmentObject['pt'], 'YYMMDDHHmm').toDate();

                    console.log(`The train ${departmentObject['l']} is depart at ${departmentDate.toLocaleString()} on platform ${departmentObject['pp']}`);

                    const stations: string[] = departmentObject['ppth'].split('|');

                    console.log(`Stations are: ${stations}`);

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

                    console.log(train);

                } else {
                    console.log('Train ends here');
                }

                console.log('============');
            }
        } else {
            console.log(error);
        }
    });
}
