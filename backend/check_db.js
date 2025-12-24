const mongoose = require('mongoose');
const LogEntry = require('./models/LogEntry');

mongoose.connect('mongodb://localhost:27017/log-monitor', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(async () => {
        console.log('Connected to MongoDB');

        const count = await LogEntry.countDocuments();
        console.log(`Total Log Entries: ${count}`);

        if (count > 0) {
            const latest = await LogEntry.find().sort({ timestamp: -1 }).limit(5);
            console.log('Latest 5 entries:');
            console.log(JSON.stringify(latest, null, 2));
        }

        mongoose.disconnect();
    })
    .catch(err => {
        console.error('Error:', err);
    });
