require('dotenv').config();

module.exports = {
    LOG_ERRORS: process.env.LOG_ERRORS === "true",
    DEV: process.env.NODE_ENV !== 'production',
    SERVER_PORT:process.env.PORT || 5000,
    SERVER_RESTART_AT_ms: 50000,
    JWT_SECRET_KEY:process.env.JWT_SECRET_KEY || "YourDefault".toString(),
    JWT_EXPIRES_IN:process.env.JWT_EXPIRES_IN,
    MONGODB_CONNECTION_URI:process.env.MONGODB_CONNECTION_URI
}