import express, { Router } from 'express';
import { getTrainDelays } from '../requests/trains/GetTrainDelays';

const trainsRouter: Router = express.Router();

trainsRouter.post('', getTrainDelays);

export default trainsRouter;