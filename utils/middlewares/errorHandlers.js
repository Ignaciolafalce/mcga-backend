const boom = require('@hapi/boom');
const { DEV, LOG_ERRORS } = require('../../config');

function withErrorStack(error, stack) {
  if (DEV) {
    return { ...error, stack };
  }
  return error;
}

function logErrors(err, req, res, next) {
  console.log(LOG_ERRORS);
  if(LOG_ERRORS){
    console.log(err);
  }
  next(err);
}

function wrapErrors(err, req, res, next) {
  if (!err.isBoom) {
    next(boom.badImplementation(err));
  }

  next(err);
}

function errorHandler(err, req, res, next) { // eslint-disable-line
  const {
    output: { statusCode, payload }
  } = err;
  res.status(statusCode);
  res.json(withErrorStack(payload, err.stack));
}

module.exports = {
  logErrors,
  wrapErrors,
  errorHandler
};