// middleware/errorHandler.js
// Global error handler for Express.
// Prevents unexpected server errors from exposing internal details.

function errorHandler(err, req, res, next) {
    console.error(err);

    const status = err.status || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    const isMalformedJson = err.type === 'entity.parse.failed';

    const message =
        status >= 500 && isProduction
            ? 'Internal Server Error'
            : isMalformedJson
                ? 'Invalid JSON request body'
                : err.message || 'Internal Server Error';

    res.status(status).json({
        error: message,
    });
}

module.exports = errorHandler;