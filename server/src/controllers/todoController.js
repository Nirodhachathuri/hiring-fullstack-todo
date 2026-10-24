import { Todo } from '../models/Todo.js';
import { HttpError } from '../utils/HttpError.js';

// Every query includes owner: req.user._id, so a user can only ever see or
// change their own TODOs. Someone else's TODO id simply returns 404.
//
// Express 5 forwards rejected promises to the error handler,
// so these handlers don't need try/catch.

const own = (req, extra = {}) => ({ owner: req.user._id, ...extra });

async function findOwnOr404(req) {
  const todo = await Todo.findOne(own(req, { _id: req.params.id }));
  if (!todo) throw new HttpError(404, 'TODO not found');
  return todo;
}

// GET /api/todos
export async function getTodos(req, res) {
  const todos = await Todo.find(own(req)).sort({ createdAt: -1 });
  res.json(todos);
}

// POST /api/todos
export async function createTodo(req, res) {
  const todo = await Todo.create({ ...req.body, owner: req.user._id });
  res.status(201).json(todo);
}

// PUT /api/todos/:id  (title and/or description)
export async function updateTodo(req, res) {
  const todo = await Todo.findOneAndUpdate(own(req, { _id: req.params.id }), req.body, {
    returnDocument: 'after', // return the updated document
    runValidators: true,
  });
  if (!todo) throw new HttpError(404, 'TODO not found');
  res.json(todo);
}

// PATCH /api/todos/:id/done  (flip done <-> not done)
export async function toggleDone(req, res) {
  const todo = await findOwnOr404(req);
  todo.done = !todo.done;
  await todo.save();
  res.json(todo);
}

// DELETE /api/todos/:id
export async function deleteTodo(req, res) {
  const todo = await Todo.findOneAndDelete(own(req, { _id: req.params.id }));
  if (!todo) throw new HttpError(404, 'TODO not found');
  res.status(204).end();
}
