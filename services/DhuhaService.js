export default function createDhuhaEvent(
        title = null,
        event = null,
        targetDateTime= null,
        duration = {minutes:30},
        alarms = [],
        mode= null  
    ){
        let start = [];

        if (mode == null) {
            start = [targetDateTime.year(), targetDateTime.month() + 1, targetDateTime.date(), targetDateTime.hour(), targetDateTime.minute()]   
        }
        const newEvent = {
            start,
            duration,
            title: title ?? `Mid Period of Dhuha Prayer`,
            description: 'Lets do Dhuha Prayer!',
            location: 'Mosque or Home',
            categories: ['Sunna Prayer'],
            status: 'CONFIRMED',
            busyStatus: 'BUSY',
            alarms,
            // dayJs: targetDateTime.clone()
        }

        return newEvent;
}