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
        validate: {
            validator: calories => {
                return calories >= 0;
            },
            message: 'Input cannot be negative'
        },
        required: [true, 'Invalid calories input']
    },
    macros: {
        fat: {
            type: Number,
            validate: {
                validator: fat => {
                    return fat >= 0;
                },
                message: 'Input cannot be negative'
            },
            required: [true, 'Invalid fat input']
        },
        protien: {
            type: Number,
            validate: {
                validator: protien => {
                    return protien >= 0;
                },
                message: 'Input cannot be negative'
            },
            required: [true, 'Invalid protien input']
        },
        carbs: {
            type: Number,
            validate: {
                validator: carbs => {
                    return carbs >= 0;
                },
                message: 'Input cannot be negative'
            },
            required: [true, 'Invalid carb input']
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
            validate: {
                validator: weight => {
                    return weight > 0;
                },
                message: 'Input cannot be negative'
            },
            required: [true, 'Invalid weight']
        },
        height: {
            type: Number,
            validate: {
                validator: height => {
                    return height > 0;
                },
                message: 'Input cannot be negative'
            },
            required: [true, 'Invalid height']
        },
        age: {
            type: Number,
            validate: {
                validator: age => {
                    return age > 0;
                },
                message: 'Input cannot be negative'
            },
            required: [true, 'Invalid age']
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