const express = require('express');
const { getUsers, getUserById, getUsersWithOrders, createUser, deleteUser } = require('./users');
const { authMiddleware } = require('./middleware');

const app = express();
app.use(express.json());

app.get('/users', getUsers);
app.get('/users/with-orders', getUsersWithOrders);
app.get('/users/:id', getUserById);
app.post('/users', createUser);
app.delete('/users/:id', deleteUser);

app.listen(3000, () => console.log('Server running on port 3000'));

module.exports = app;
