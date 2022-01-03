import { Train } from './Train';

export interface ChangesRequest {
    evaNumber: number;
    trains: Train[];
    authenticationToken: string;
}