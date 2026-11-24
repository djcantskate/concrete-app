// startBackend.js
// Handles the Concrete backend startup sequence.
// Connects to MongoDB before starting the Express server.

async function startBackend({ mongoose, app, port }) {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server: ', error);
        process.exit(1);
    }
}

module.exports = startBackend;