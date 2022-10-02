import { Train } from '../models/Train';
import * as xml2js from 'xml2js';
import fs from 'fs';
import { Message } from '../models/Message';
import moment from 'moment';
import { TripStatus } from '../models/TripStatus';

export function parseDelayedTrains(xml: string, onParsingFinished: (trains: Train[]) => void): void {
    const delayedTrains: Train[] = [];

    new xml2js.Parser({ attrkey: "key" }).parseString(xml, (error: any, result: any) => {
        if(error === null) {
            result['timetable']['s'].forEach((changes: any) => {
                const currentTrainId: string = changes['key']['id'];
                const train: Train = {
                    departure: new Date(),
                    platform: 0,
                    stations: [],
                    trainId: currentTrainId,
                    trainNumber: 0,
                    trainType: '',
                    tripStatus: TripStatus.PLANNED,
                    tripType: ''
                };
                delayedTrains.push(train);

                const messageDescriptionsData = fs.readFileSync('data/message_codes.json', {
                    encoding: 'utf-8'
                });
                const messageDescriptions: Message[] = JSON.parse(messageDescriptionsData);

                if (changes['dp'] && changes['dp'][0]['key']) {
                    if (changes['dp'][0]['key']['ct']) {
                        train.changedDeparture = moment(changes['dp'][0]['key']['ct'], 'YYMMDDHHmm').toDate();
                    }
                    train.changedPlatform = changes['dp'][0]['key']['cp'];
                    train.changedStations = changes['dp'][0]['key']['cpth']?.split('|');

                    const messagesObject = changes['dp'][0]['m'];
                    if (messagesObject) {
                        train.messages = [];

                        messagesObject.forEach((currentMessage: any) => {
                            const messageDescription: Message = messageDescriptions.filter((message: Message) => message.code === Number.parseInt(currentMessage['key']['c']))[0];

                            if (messageDescription) {
                                train.messages?.push(messageDescription);
                            }
                        });
                    }
                }
            });
            onParsingFinished(delayedTrains);
        } else {
            console.log(error);
        }
    });
}