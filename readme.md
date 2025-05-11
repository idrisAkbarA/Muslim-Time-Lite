# Muslim Time Lite
It is a side project that I've made to generate muslim prayer schedule in .ics file format that can be subscribed by calendar apps.

The "Lite" here indicate that this app only does simple things mentioned above, hopefully this can be improved and have more features eg: calendar viewer, customizing the schedule etc.

The prayer time is being fetched from [Aladhan](https://api.aladhan.com/) and currently set to Pekanbaru - Indonesia local time.

## Running the App
Please follow these steps:
- Open terminal and run `npm install` to install the libs
- Run `npm run start` to start the app.
- The app will be available at port 6080

Can also run through docker compose:
- Run `docker-compose up --build -d`