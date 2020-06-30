const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.model").userSchema;
const Food = require("../models/user.model").foodSchema;

router.get("/", (req, res, next) => {
    res.json({message: "Done"});
});

router.get("/signup", isNotLoggedIn, (req, res, next) => {
    res.render("signup", { message: req.flash("signupMessage")});
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
    res.redirect("/");
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
    req.user.foods.forEach(food => {
        if(food.date.getDate() == (new Date).getDate() && food.date.getMonth() == (new Date).getMonth() && food.date.getFullYear() == (new Date).getFullYear()){
            currentCalories += food.calories;
            macros.fat += food.macros.fat;
            macros.protien += food.macros.protien;
            macros.carbs += food.macros.carbs;
        }
    });
    const totalMacros = macros.fat + macros.protien + macros.carbs;
    macros = { fat: 100 * (macros.fat / totalMacros), protien: 100*(macros.protien / totalMacros), carbs: 100*(macros.carbs / totalMacros)};
    res.render("dashboard", {user: req.user, calorieNeeds: Math.ceil(calorieNeeds), currentCalories: currentCalories, currentMacros: macros, macroRatio: macroRatio});
});

router.post("/newFood", async (req, res, next) => {
    User.findById(req.body.user._id, async (err, user) => {
        if(err) throw err;

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
            await user.save();
            res.redirect("/dashboard");
        } catch{
            res.status(400);
        }
    });
});

router.get("/user/:userId", (req, res, next) => {

});

router.post("/user/:userId", (req, res, next) => {

});

module.exports = router;

function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
    // if they aren't redirect them to the home page
    res.redirect("/");
}

function isNotLoggedIn(req, res, next) {
    if (!req.isAuthenticated())
        return next();
    res.redirect("/dashboard");
}