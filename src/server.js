const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
dotenvExpand.expand(dotenv.config());

const { validateEnv } = require('./config/env');
const logger = require('./utils/logger');
const { initializeReminderCronJob } = require('./jobs/reminderJob');

// Validate environment variables before starting
validateEnv();

const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    
    // Initialize appointment reminder cron job
    initializeReminderCronJob();
    logger.info('Appointment reminder system initialized');
});
