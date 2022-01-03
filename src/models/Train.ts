import { TripStatus } from './TripStatus';

export interface Train {
    trainId: string;
    trainType: string;
    trainNumber: number;
    trainLine?: number;
    department: Date;
    changedDepartment?: Date;
    platform: number;
    changedPlatform?: number;
    stations: string[];
    changedStations?: string[];
    tripType: string;
    tripStatus: TripStatus;
}
