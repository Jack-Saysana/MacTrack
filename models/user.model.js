const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

const foodSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    calories: {
        type: Number,
        required: true
    },
    macros: {
        fat: {
            type: Number,
            required: true
        },
        protien: {
            type: Number,
            required: true
        },
        carbs: {
            type: Number,
            required: true
        }
    },
    date: {
        type: Date,
        default: new Date()
    }
});

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    healthInfo: {
        sex: {
            type: String,
            required: true  
        },
        weight: {
            type: Number,
            required: true
        },
        height: {
            type: Number,
            required: true
        },
        age: {
            type: Number,
            required: true
        },
        activity: {
            type: Schema.Types.Decimal128,
            required: true
        },
        goal: {
            type: Number,
            required: true
        }
    },
    foods: [foodSchema]
});

userSchema.methods.generateHash = password => bcrypt.hashSync(password, 10);

userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

module.exports = {userSchema: mongoose.model("user", userSchema), foodSchema: mongoose.model("food", foodSchema)}