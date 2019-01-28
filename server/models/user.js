const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		minLength: 1,
		trim: true,
		unique: true,
		validate: {
			validator: validator.isEmail,
			message: '{VALUE} is not a valid email.'
		}
	},
	password: {
		type: String,
		required: true,
		minLength: 6
	},
	tokens: [{
		access: {
			type: String,
			required: true
		},
		token: {
			type: String,
			required: true
		}
	}]
});

UserSchema.pre('save', function(next) {
	var user = this;
	if (user.isModified('password')) {
		bcrypt.hash(user.password, 10, (err, hash) => {
			user.password = hash;
			next();
		});
	} else {
		next();
	}
});

UserSchema.methods.toJSON = function() {
	var userObject = this.toObject();
	return _.pick(userObject, ['_id','email']);
};

UserSchema.methods.generateAuthToken = function() {
	var access = 'auth';
	var token = jwt.sign({
		_id: this._id.toHexString(),
		access
	}, 'abc123').toString();
	
	this.tokens = this.tokens.concat([{access, token}]);

	return this.save()
		.then(() => {
			return token;
		});
};

UserSchema.statics.findByToken = function(token) {
	var decoded;
	try {
		decoded = jwt.verify(token, 'abc123');
	} catch (e) {
		return Promise.reject();
	}

	return User.findOne({
		'_id': decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	});
};

var User = mongoose.model('User', UserSchema);

module.exports = {User};