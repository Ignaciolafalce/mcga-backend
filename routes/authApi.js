const express = require('express');
const boom = require('@hapi/boom');
const helper = require('../helpers');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const bcrypt = require('bcrypt');
const passport = require('passport');

require('../utils/auth/strategies/jwt');

//config constants
const { JWT_SECRET_KEY, JWT_EXPIRES_IN } = require('../config');

const { isEmailValid } = require('../helpers');

///auth api routes
function authApi(app) {
    const router = express.Router();
    app.use('/api/auth', router);

    //sign-up route
    router.post('/sign-up', async function (req, res, next) {
        try {
            //validate request body
            if (!req.body.username || !req.body.email || !req.body.password) {
                next(boom.badRequest('missing username, email or password'));
            }

            //validate properties are complete
            const { username, email, password } = req.body;
            if (helper.arrayHasNullOrEmpty([username, email, password])) {
                next(boom.badRequest('username, email and password must be completed'));
            }

            //validate if username alredy exists in the db
            const usernameExist = await User.findOne({ username: username }).exec();
            if (usernameExist) {
                return next(boom.conflict("Username alredy exist in the datbase"));
            }

            //validate if the email alredy exists in the db
            const emailExist = await User.findOne({ email: email }).exec();
            if (emailExist) {
                return next(boom.conflict("Email alredy exist in the datbase"));
            }

            const emailIsValid = isEmailValid();
            if (emailIsValid) {
                return next(boom.conflict("Email not valid"));
            }

            //hash the password
            hashedPassword = await bcrypt.hash(password, 10);

            //create new user
            const newUser = await new User({
                username,
                email,
                password: hashedPassword,
                created_at: moment().unix(),
                updated_at: moment().unix()
            }).save();


            //delete password for response
            const userObject = newUser.toObject();
            delete userObject.password;

            //return the response
            res.status(201).json({
                message: 'User succesfully created',
                data: { user: userObject },
                error: null,
            });

        } catch (error) {
            //return status 500 internal error
            return next(boom.internal(error));
        }

    });

    //sign-up route
    router.post('/sign-in', async function (req, res, next) {
        try {
            //validate request body, user log in by email(can be username) and password
            if (!req.body.username || !req.body.password) {
                return next(boom.badRequest('missing username/email or password'));
            }

            //validate properties are not null or empty
            const { username, password } = req.body;
            if (helper.arrayHasNullOrEmpty([username, password])) {
                return next(boom.badRequest('username/email and password must be completed'));
            }

            //try to get the user by email or username
            const user = await User.findOne({ $or: [{ email: username }, { username: username }] }).exec();
            if (!user) {
                return next(boom.unauthorized('username/email and password not valid'), false);
            }

            //compare and validate password
            if (!(await bcrypt.compare(password, user.password))) {
                return next(boom.unauthorized('username/email and password not valid'), false);
            }

            //save user claims in payload
            const payload = {
                sub: user._id,
                username: user.username,
                email: user.email,
            }

            //generate token
            // const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });
            const token = jwt.sign(payload, JWT_SECRET_KEY); // changed to not expire

            //delete password for response
            const userObject = user.toObject();
            delete userObject.password;

            //return status 200, the user and the token
            return res.status(200).json({
                message: "User logged in",
                data: {
                    access_token: token,
                    user: { id: user._id, username: user.username, email: user.email }
                },
                error: null
            });

        } catch (error) {
            //return status 500 internal error
            next(boom.internal(error));
        }

    });

    router.post('/verify', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
        return res.status(200).json({ data: { user: req.user }, error: null, message: 'Valid user token' });
    });

    router.get('/sanityCheck', (req, res, next) => {
        return next(boom.notFound('No encontrado'));
        res.status(200).json('ok');
    });

}

module.exports = authApi;