import express from 'express';
import cors from 'cors';
import {PrismaClient} from '@prisma/client';

import { convertHoursStringToMinute } from './utils/convert-hours-string-to-minute';
import { convertMinutesToHours } from './utils/convert-minutes-to-hours';

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors())

app.get('/games', async (request, response) => {
    const games = await prisma.game.findMany({
        include: {
            _count: {
                select: {
                    ads: true,
                }
            }
        }
    })
    
    return response.json(games)
});

app.post('/games/:id/ads', async (request, response) => {
    const gameId = request.params.id;
    const body: any = request.body;

    const ad = await prisma.ad.create({
        data: {
            gameId,
            name: body.name,
            yearsPlaying: body.yearsPlaying,
            discord: body.discord,
            hourStart: convertHoursStringToMinute(body.hourStart),
            hourEnd: convertHoursStringToMinute(body.hourEnd),
            useVoiceChannel: body.useVoiceChannel,
            weekDays: body.weekDays.join(','),
        }
    })

    return response.status(201).json(ad)
});

app.get('/games/:id/ads', async (request, response) =>{
    const gameId = request.params.id;
    const ads = await prisma.ad.findMany({
        select: {
            id: true,
            name: true,
            yearsPlaying: true,
            weekDays: true,
            hourStart: true,
            hourEnd: true,
            useVoiceChannel: true,
        },
        where: {
            gameId,
        },
        orderBy: {
            createdAt: 'desc',
        }
    })

    return response.json(ads.map(ad => {
        return {
            ...ad,
            weekDays: ad.weekDays.split(','),
            hourStart: convertMinutesToHours(ad.hourStart),
            hourEnd: convertMinutesToHours(ad.hourEnd),
        }
    }))
});

app.get('/ads/:id/discord', async (request, response) =>{
    const adId = request.params.id;
    const ad = await prisma.ad.findUniqueOrThrow({
        select: {
            discord: true
        },
        where: {
            id: adId
        }
    })


    return response.json({
        discord: ad.discord,
    })
});

app.listen(3333);