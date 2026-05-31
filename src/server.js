const express = require('express');
const { getUsers, getUserById, getUsersWithOrders, createUser, deleteUser } = require('./users');
const { authMiddleware } = require('./middleware');

const app = express();
app.use(express.json());

app.post('/users', createUser);

app.get('/users', authMiddleware, getUsers);
app.get('/users/with-orders', authMiddleware, getUsersWithOrders);
app.get('/users/:id', authMiddleware, getUserById);
app.delete('/users/:id', authMiddleware, deleteUser);

app.listen(3000, () => console.log('Server running on port 3000'));

module.exports = app;
