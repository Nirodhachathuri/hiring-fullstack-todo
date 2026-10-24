import { Router } from 'express';
import {
  createTodo,
  deleteTodo,
  getTodos,
  toggleDone,
  updateTodo,
} from '../controllers/todoController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { validateCreate, validateUpdate } from '../middleware/validateTodo.js';

const router = Router();

// All TODO routes need a logged-in user
router.use(requireAuth);

router.route('/')
  .get(getTodos)
  .post(validateCreate, createTodo);

router.route('/:id')
  .put(validateObjectId, validateUpdate, updateTodo)
  .delete(validateObjectId, deleteTodo);

router.patch('/:id/done', validateObjectId, toggleDone);

export default router;
