const app = require('./app'); // Import the configured app
// TODO: We will import our database connection here later

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // TODO: Add database connection logic here
});
