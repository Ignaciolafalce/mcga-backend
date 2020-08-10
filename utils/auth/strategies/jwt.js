const passport = require("passport");
const { Strategy, ExtractJwt } = require("passport-jwt");
const {JWT_SECRET_KEY} = require("../../../config");
const User = require("../../../models/User");
const boom = require('@hapi/boom');

//Passport JWT Strategy to validate user access_token
passport.use(
    new Strategy({
        secretOrKey: JWT_SECRET_KEY,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    },
        async function (payload, cb) {
            try {
                const user = await User.findOne({ email: payload.email, _id: payload.sub }).exec();
                if (!user) {
                    return cb(boom.unauthorized("User not found"));
                }

                // delete password property
                const userObject = user.toObject();
                delete userObject.password;

                return cb(null, { sub: userObject._id, username: userObject.username, email: userObject.email });

            } catch (err) {
                return cb(err);
            }
        })
);