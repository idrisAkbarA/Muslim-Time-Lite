import express from 'express';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { createEvents } from 'ics';
import fetch from 'node-fetch';
import createDhuhaEvent from './services/DhuhaService.js'

dayjs.extend(customParseFormat);

const app = express();
const PORT = 8060;

app.get('/', async (req, res) => {
    const LATITUDE = -0.5071;
    const LONGITUDE = 101.4478;
    const METHOD = 20;

    const today = dayjs();
    const year = today.year();
    const month = today.month() + 1;

  const url = `https://api.aladhan.com/v1/calendar?latitude=${LATITUDE}&longitude=${LONGITUDE}&method=${METHOD}&month=${month}&year=${year}`;
  console.log(`fetching prayer data with url:\n${url}`);
  
  try {
    const apiRes = await fetch(url);
    const data = await apiRes.json();
    const days = data.data;

        const events = [];
        const alarms = [];
        alarms.push({
            action: 'display',
            description: 'Reminder',
            trigger: { hours: 0, minutes: 1, before: true },
            // repeat: 0,
            // attachType: 'VALUE=URI',
            // attach: 'Glass'
        })

        for (const day of days) {
            const dateStr = day.date.gregorian.date;
            const timings = day.timings;
            const dateFormat = day.date.gregorian.format;
            const apiDate = dayjs(dateStr, dateFormat);
            const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

            // console.log("day", day);

            // generate first dhuha schedule
            const dhuhaDate = dayjs(`${dateStr} 10:00`, `${dateFormat} H:mm`);
            const dhuhaEvent = createDhuhaEvent(
                null,
                null,
                dhuhaDate,
                { minutes: 5 },
                alarms
            );

            // generate third dhuha schedule
            const dhuhrTime = timings.Dhuhr
            const [dhuhrHour, dhuhrMinute] = dhuhrTime.split(':');
            const dhuhrDate = dayjs(`${dateStr} ${dhuhrHour}:${dhuhrMinute}`, `${dateFormat} H:mm`);
            const lastDhuhaDate = dhuhrDate.subtract(1,"hour")
            
            const lastDhuhaEvent = createDhuhaEvent(
                "Last Dhuha Period Prayer",
                null,
                lastDhuhaDate,
                { minutes: 10 },
                alarms
            );


            events.push(dhuhaEvent);
            events.push(lastDhuhaEvent);


            // generate syuruq itikaf time 
            const fajrTime = timings.Fajr
            const [fajrHour, fajrMinute] = fajrTime.split(':');
            const fajrDate = dayjs(`${dateStr} ${fajrHour}:${fajrMinute}`, `${dateFormat} H:mm`);

            const sunriseTime = timings.Sunrise
            const [sunriseHour, sunriseMinute] = sunriseTime.split(':');
            const sunriseDate = dayjs(`${dateStr} ${sunriseHour}:${sunriseMinute}`, `${dateFormat} H:mm`);
            const afterFajrPrayerDate = fajrDate.add(30, 'minutes')
            const firstDhuhaTimeOrSyuruqPrayerDate = sunriseDate.add(15, 'minute')
            // console.log("firstDhuhaTimeOrSyuruqPrayerDate", firstDhuhaTimeOrSyuruqPrayerDate.format("YYYY-MM-DD H:mm"));
            
            events.push({
                start: [afterFajrPrayerDate.year(), afterFajrPrayerDate.month() + 1, afterFajrPrayerDate.date(), afterFajrPrayerDate.hour(), afterFajrPrayerDate.minute()],
                end: [firstDhuhaTimeOrSyuruqPrayerDate.year(), firstDhuhaTimeOrSyuruqPrayerDate.month() + 1, firstDhuhaTimeOrSyuruqPrayerDate.date(), firstDhuhaTimeOrSyuruqPrayerDate.hour(), firstDhuhaTimeOrSyuruqPrayerDate.minute()],
                title: `Syuruq Itiqaf Time`,
                description: 'Lets stay in the mosque for awhile to pray, zikr and other positive stuff! Dont forget to do Syuruq/Dhuha Prayer at the end.',
                location: 'Mosque',
                categories: ['Sunnah'],
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                alarms,
                // dayJs: prepPrayerDate.clone()
            })
            // generate syuruq prayer schedule
            events.push({
                start: [firstDhuhaTimeOrSyuruqPrayerDate.year(), firstDhuhaTimeOrSyuruqPrayerDate.month() + 1, firstDhuhaTimeOrSyuruqPrayerDate.date(), firstDhuhaTimeOrSyuruqPrayerDate.hour(), firstDhuhaTimeOrSyuruqPrayerDate.minute()],
                duration: { minutes: 5},
                title: `First Period Dhuha Prayer or Syuruq Prayer`,
                description: 'Lets do 2 rakaat of Syuruq Prayer.',
                location: 'Mosque',
                categories: ['Sunnah'],
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                alarms,
                // dayJs: prepPrayerDate.clone()
            })

            // generate tahajjud prayer schedule
            const tahajjudTime = timings.Lastthird;
            const [tahajjudHour, tahajjudMinute] = tahajjudTime.split(':');
            const tahajjudDate = dayjs(`${dateStr} ${tahajjudHour}:${tahajjudMinute}`, `${dateFormat} H:mm`);
            const tahajjudEndDate = fajrDate.subtract(10,"minutes");

            events.push({
                start: [tahajjudDate.year(), tahajjudDate.month() + 1, tahajjudDate.date(), tahajjudDate.hour(), tahajjudDate.minute()],
                end: [tahajjudEndDate.year(), tahajjudEndDate.month() + 1, tahajjudEndDate.date(), tahajjudEndDate.hour(), tahajjudEndDate.minute()],
                title: `Tahajjud Prayer`,
                description: 'Lets get connected with Allah through Tahajjud prayer.',
                location: 'Home',
                categories: ['Sunnah'],
                status: 'CONFIRMED',
                busyStatus: 'BUSY',
                alarms,
                // dayJs: prepPrayerDate.clone()
            })

            // generate mandatory prayer schedule
            prayers.forEach(name => {
                const time = timings[name].split(' ')[0];
                const [hour, minute] = time.split(':');
                const prayerDate = dayjs(`${dateStr} ${hour}:${minute}`, `${dateFormat} H:mm`);
                const prepPrayerDate = prayerDate.clone().subtract(10, 'minutes');

                events.push({
                    start: [prepPrayerDate.year(), prepPrayerDate.month() + 1, prepPrayerDate.date(), prepPrayerDate.hour(), prepPrayerDate.minute()],
                    duration: { minutes: 10 },
                    title: `Prepare for ${name} Prayer`,
                    description: 'Lets take wudhu, put on prayer clothes and start to go to the mosque!',
                    location: 'Mosque',
                    categories: ['Mandatory Prayer'],
                    status: 'CONFIRMED',
                    busyStatus: 'BUSY',
                    alarms,
                    // dayJs: prepPrayerDate.clone()
                });

                events.push({
                    start: [prayerDate.year(), prayerDate.month() + 1, prayerDate.date(), prayerDate.hour(), prayerDate.minute()],
                    duration: { minutes: 30 },
                    title: `${name} Prayer`,
                    description: 'Lets go to pray!',
                    location: 'Mosque',
                    categories: ['Mandatory Prayer'],
                    status: 'CONFIRMED',
                    busyStatus: 'BUSY',
                    alarms,
                    // dayjs: prayerDate.clone()
                });
            });

            const weekday = apiDate.day(); // 0 = Sunday
            if (weekday === 1 || weekday === 4) {
                events.push({
                    start: [apiDate.year(), apiDate.month() + 1, apiDate.date(), 0, 0],
                    duration: { days: 1 },
                    title: 'Fasting Day!',
                    description: 'Monday/Thursday Fasting',
                    categories: ['Fasting'],
                    status: 'CONFIRMED',
                    busyStatus: 'BUSY',
                    alarms,
                    // dayjs: apiDate.clone()
                });
            }
        }

        const { error, value } = createEvents(events);
        if (error) throw error;

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="prayer-schedule.ics"');
        res.send(value);

    } catch (err) {
        console.error('Failed to generate calendar:', err);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Prayer calendar ICS server running at http://localhost:${PORT}`);
});