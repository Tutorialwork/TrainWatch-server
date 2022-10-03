import * as xml2js from 'xml2js';
import { Train } from '../models/Train';
import moment from 'moment';
import { TripStatus } from '../models/TripStatus';

export function parseXMLTimetable(xml: string, onParsingFinished: (trains: Train[]) => void): void {
    const trains: Train[] = [];

    new xml2js.Parser({ attrkey: "key" }).parseString(xml, (error: any, result: any) => {
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
                        trainNumber: Number.parseInt(tripObject['n']),
                        trainType: tripObject['c'],
                        trainLine: departmentObject['l'],
                        tripStatus: TripStatus.PLANNED,
                        tripType: tripObject['f']
                    };

                    trains.push(train);
                }
            }

            onParsingFinished(trains);
        } else {
            console.log(error);
        }
    });
}