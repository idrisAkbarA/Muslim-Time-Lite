import express from 'express';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { createEvents } from 'ics';
import fetch from 'node-fetch';

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
    for (const day of days) {
      const dateStr = day.date.gregorian.date;
      const timings = day.timings;
      const dateFormat = day.date.gregorian.format;
      const apiDate = dayjs(dateStr, dateFormat);
      const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

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
          busyStatus: 'BUSY'
        });

        events.push({
          start: [prayerDate.year(), prayerDate.month() + 1, prayerDate.date(), prayerDate.hour(), prayerDate.minute()],
          duration: { minutes: 30 },
          title: `${name} Prayer`,
          description: 'Lets go to pray!',
          location: 'Mosque',
          categories: ['Mandatory Prayer'],
          status: 'CONFIRMED',
          busyStatus: 'BUSY'
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
          busyStatus: 'BUSY'
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