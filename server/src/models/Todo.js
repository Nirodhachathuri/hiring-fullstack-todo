import mongoose from 'mongoose';

export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;

const todoSchema = new mongoose.Schema(
  {
    // The user this TODO belongs to. Every query filters on it.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [TITLE_MAX, `Title must be ${TITLE_MAX} characters or less`],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [DESCRIPTION_MAX, `Description must be ${DESCRIPTION_MAX} characters or less`],
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
    versionKey: false, // drop __v from responses
    toJSON: {
      // owner is implied by the token, so it isn't sent back
      transform: (doc, ret) => {
        delete ret.owner;
        return ret;
      },
    },
  },
);

// Supports "this user's TODOs, newest first"
todoSchema.index({ owner: 1, createdAt: -1 });

export const Todo = mongoose.model('Todo', todoSchema);
