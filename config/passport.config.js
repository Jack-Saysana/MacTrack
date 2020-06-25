const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/user.model.js").userSchema;

module.exports = passport => {
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => done(err, user));
    });
    //Signup
    passport.use("local-signup", new LocalStrategy({
        passReqToCallback: true,
        usernameField: "email"
    },
    async (req, username, password, done) => {
        if(await User.exists({email: username})){
            return done(null, false, req.flash("signupMessage", "An account with this email exists already. Please use a different email."));
        }
        let newUser = new User({
            name: req.body.name,
            email: username,
            healthInfo: {
                sex: req.body.sex,
                weight: req.body.weight,
                height: req.body.height,
                age: req.body.age,
                activity: req.body.activity,
                goal: req.body.goal
            }
        });
        newUser.password = newUser.generateHash(password);
        newUser.save(err => {
            if (err) throw err;
            return done(null, newUser);
        });
    }
    ));

    //Login
    passport.use("local-login", new LocalStrategy({
        passReqToCallback: true,
        usernameField: "email"
    }, (req, username, password, done) => {
        User.findOne({ email: username}, (err, user) => {
            if (err) throw err;

            if (!user)
                return done(null, false, req.flash("loginMessage", "No user found."));
            if (!user.validatePassword(password))
                return done(null, false, req.flash("loginMessage", "Wrong password."));

            return done(null, user);
        });
    }
    ));
}