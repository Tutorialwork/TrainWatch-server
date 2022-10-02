import express, { NextFunction, Request, Response } from 'express';
import trainsRouter from './router/TrainsRouter';
import timetableRouter from './router/TimetableRouter';

const app = express();

app.disable('x-powered-by');
app.use(express.json());
/**
 * Caught invalid json
 */
app.use((error: any, request: Request, response: Response, next: NextFunction) => {
    if (error.status === 400 && 'body' in error) {
        return response.status(400).send({ status: 400, message: error.message });
    }
    next();
});

app.use('/trains', trainsRouter);
app.use('/timetable', timetableRouter);

app.listen(3500);