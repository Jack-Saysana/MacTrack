const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.model").userSchema;
const Food = require("../models/user.model").foodSchema;

router.get("/", (req, res, next) => {
    res.redirect("/dashboard");
});

router.get("/signup", isNotLoggedIn, (req, res, next) => {
    res.render("signup", { emailMessage: req.flash("emailMessage"), weightMessage: req.flash("weightMessage"), heightMessage: req.flash("heightMessage"), ageMessage: req.flash("ageMessage")});
});

router.post("/signup", passport.authenticate("local-signup", {
    successRedirect: "/dashboard",
    failureRedirect: "/signup",
    failureFlash: true 
}));

router.get("/login", isNotLoggedIn, (req, res, next) => {
    res.render("login", { message: req.flash("loginMessage") });
});

router.post("/login", passport.authenticate("local-login", {
    successRedirect: "/dashboard", // redirect to the secure profile section
    failureRedirect: "/login", // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));

router.get("/logout", (req, res, next) => {
    req.logout();
    res.redirect("/login");
});

router.get("/dashboard", isLoggedIn, (req, res, next) => {
    const weight = req.user.healthInfo.weight;
    const height = req.user.healthInfo.height;
    const age = req.user.healthInfo.age;
    const activity = req.user.healthInfo.activity;
    const goal = req.user.healthInfo.goal;
    const calorieNeeds = req.user.healthInfo.sex == "Male" ? (((6.24*weight) + (12.7*height) - (6.755*age) + 66.47)*activity - goal)
                                                           : (((4.35*weight) + (4.7*height) - (4.7*age) + 655.1)*activity - goal);
    const macroRatio = req.user.healthInfo.goal == 0 ? {fat: 25, protien: 25, carbs: 50} : req.user.healthInfo.goal == -500 ? {fat: 30, protien: 50, carbs: 20} : {fat: 25, protien: 35, carbs: 40};
    let currentCalories = 0;
    let macros = {fat: 0, protien: 0, carbs: 0};
    const todaysFoods = req.user.foods.filter(food => 
        food.date.getDate() == (new Date).getDate() && food.date.getMonth() == (new Date).getMonth() && food.date.getFullYear() == (new Date).getFullYear()
    );
    todaysFoods.forEach(food => {
        currentCalories += food.calories;
        macros.fat += food.macros.fat;
        macros.protien += food.macros.protien;
        macros.carbs += food.macros.carbs;
    });
    const totalMacros = macros.fat + macros.protien + macros.carbs;
    macros = totalMacros != 0 ? { fat: 100 * (macros.fat / totalMacros), protien: 100*(macros.protien / totalMacros), carbs: 100*(macros.carbs / totalMacros)} : {fat: 0, protien: 0, carbs: 0};
    res.render("dashboard", {user: req.user, todaysFoods: todaysFoods, calorieNeeds: Math.ceil(calorieNeeds), currentCalories: currentCalories, currentMacros: macros, macroRatio: macroRatio, foodMessage: req.flash("foodMessage")});
});

router.post("/newFood", isLoggedIn, async (req, res, next) => {
    User.findById(req.user._id, async (err, user) => {
        if(err) throw err;
        const caloriesInvalid = req.body.calories < 0 || Number.isNaN(parseInt(req.body.calories));
        const fatInvalid = req.body.fat < 0 || Number.isNaN(parseInt(req.body.fat));
        const protienInvalid = req.body.protien < 0 || Number.isNaN(parseInt(req.body.protien));
        const carbsInvalid = req.body.carbs < 0 || Number.isNaN(parseInt(req.body.carbs));
        if(caloriesInvalid || fatInvalid || protienInvalid || carbsInvalid){
            req.flash("foodMessage", "Invalid food information");
            res.redirect("/dashboard");
        }else{
            user.foods.push(new Food({
                name: req.body.name,
                calories: req.body.calories,
                macros: {
                    fat: req.body.fat,
                    protien: req.body.protien,
                    carbs: req.body.carbs
                }
            }));
            try {
                await user.save(err => {
                    if (err) throw err;
                });
                res.redirect("/dashboard");
            } catch{
                res.status(400);
            }
        }
    });
});

router.get("/user", isLoggedIn, (req, res, next) => {
    res.redirect(`/user/${req.user._id}`);
});

router.get("/user/:userId", isLoggedIn, (req, res, next) => {
    res.render("profile", { user: req.user, emailMessage: req.flash("emailMessage"), weightMessage: req.flash("weightMessage"), heightMessage: req.flash("heightMessage"), ageMessage: req.flash("ageMessage") });
});

router.post("/user/:userId", isLoggedIn, async (req, res, next) => {
    const user = await User.findOne({ email: req.user.email.toLowerCase() });
    const emailInvalid = await User.exists({ email: req.body.email.toLowerCase() });
    const weightInvalid = req.body.weight < 0;
    const heightInvalid = req.body.height < 0;
    const ageInvalid = req.body.age < 0;
    if (emailInvalid && req.body.email != user.email) {
        req.flash("emailMessage", "An account with this email exists already. Please use a different email.");
    }
    if (weightInvalid) {
        req.flash("weightMessage", "Invalid weight");
    }
    if (heightInvalid) {
        req.flash("heightMessage", "Invalid height");
    }
    if (ageInvalid) {
        req.flash("ageMessage", "Invalid age");
    }
    if (!(emailInvalid && req.body.email != user.email) && !weightInvalid && !heightInvalid && !ageInvalid){
        user.name = req.body.name;
        user.email = req.body.email;
        user.healthInfo.sex = req.body.sex;
        user.healthInfo.weight = req.body.weight;
        user.healthInfo.height = req.body.height;
        user.healthInfo.age = req.body.age;
        user.healthInfo.activity = req.body.activity;
        user.healthInfo.goal = req.body.goal;
        try {
            user.save(err => {
                if (err) throw err;
            });
            res.redirect(`/user/${user._id}`);
        }catch{
            res.status(400);
        }
    } else {
        res.redirect(`/user/${user._id}`);
    }
});

module.exports = router;

function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect("/login");
}

function isNotLoggedIn(req, res, next) {
    if (!req.isAuthenticated())
        return next();
    res.redirect("/dashboard");
}