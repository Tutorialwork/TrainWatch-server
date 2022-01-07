import { TripStatus } from './TripStatus';
import { Message } from './Message';

export interface Train {
    trainId: string;
    trainType: string;
    trainNumber: number;
    trainLine?: number;
    departure: Date;
    changedDeparture?: Date;
    platform: number;
    changedPlatform?: number;
    stations: string[];
    changedStations?: string[];
    tripType: string;
    tripStatus: TripStatus;
    messages?: Message[];
}
