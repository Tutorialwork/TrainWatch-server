import express, { Router } from 'express';
import { getTimetable } from '../requests/timetable/GetTimetable';

const timetableRouter: Router = express.Router();

timetableRouter.get('/:stationId/:hour', getTimetable);

export default timetableRouter;