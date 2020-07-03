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
        const emailInvalid = await User.exists({email: username});
        const weightInvalid = req.body.weight < 0;
        const heightInvalid = req.body.height < 0;
        const ageInvalid = req.body.age < 0;
        if(emailInvalid){
            req.flash("emailMessage", "An account with this email exists already. Please use a different email.");
        }
        if(weightInvalid){
            req.flash("weightMessage", "Invalid weight");
        }
        if(heightInvalid){
            req.flash("heightMessage", "Invalid height");
        }
        if(ageInvalid){
            req.flash("ageMessage", "Invalid age");
        }
        if(emailInvalid || weightInvalid || heightInvalid || ageInvalid){
            return done(null, false);
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
            if (err) console.log(err);
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
                return done(null, false, req.flash("loginMessage", "Invalid login"));
            if (!user.validatePassword(password))
                return done(null, false, req.flash("loginMessage", "Invalid login"));

            return done(null, user);
        });
    }
    ));
}