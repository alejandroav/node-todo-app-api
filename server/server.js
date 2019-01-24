require('./config/config');
require('./db/mongoose');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

var {Todo} = require('./models/todo');
var {User} = require('./models/user');

var app = express();
app.use(bodyParser.json());

app.post('/todos', (req, res) => {
	new Todo({
		text: req.body.text,
		completed: req.body.completed,
		completedAt: null
	}).save()
		.then((todo) => {
			res.send(todo);
		}, (err) => {
			res.status(400).send();
		});
});

app.get('/todos', (req, res) => {
	Todo.find().then((todos) => {
		res.send({todos});
	}, (err) => {
		res.status(400).send();
	});
});

app.get('/todos/:id', (req, res) => {
	var id = req.params.id;
	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}
	
	Todo.findById(id)
		.then((todo) => {
			if (!todo) {
				res.status(404).send();
			} else {
				res.send({todo});
			}
		}, (err) => {
			res.status(400).send();
		});
});

app.delete('/todos/:id', (req, res) => {	
	var id = req.params.id;
	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}
		
	Todo.findByIdAndRemove(id)
		.then((todo) => {
			if (!todo) {
				res.status(404).send();
			} else {
				res.send({todo});
			}
		}, (err) => {
			res.status(400).send();
		});
});

app.patch('/todos/:id', (req, res) => {
	var id = req.params.id;	
	if (!ObjectID.isValid(id)) {
		return res.status(404).send();
	}

	var body = _.pick(req.body, ['text', 'completed']);
	if (_.isBoolean(body.completed) && body.completed) {
		body.completedAt = new Date().getTime();
	} else {
		body.completed = false;
		body.completedAt = null;
	}

	Todo.findByIdAndUpdate(id, {$set: body}, {new: true})
		.then((todo) => {
			if (!todo) {
				return res.status(404).send();
			} res.send({todo});
		})
		.catch((err) => {
			res.status(400).send();
		});
});

app.post('/users', (req, res) => {
	var body = _.pick(req.body, ['email', 'password']);
	var user = User(body);
	user.save()
		.then(() => {
			return user.generateAuthToken();
		})
		.then((token) => {			
			res.header('x-auth', token).send(user);
		})
		.catch((err) => {
			res.status(400).send(err);
		});
});

app.listen(process.env.PORT, () => {
	console.log('Listening on port', process.env.PORT);
});

module.exports = {app};