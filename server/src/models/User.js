import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const NAME_MAX = 50;
export const PASSWORD_MIN = 6;
const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [NAME_MAX, `Name must be ${NAME_MAX} characters or less`],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates a unique index; duplicates raise error code 11000
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`],
      select: false, // never returned by queries unless explicitly asked for
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      // Shape sent to the client: { id, name, email } — no password, no _id
      transform: (doc, ret) => ({ id: ret._id.toString(), name: ret.name, email: ret.email }),
    },
  },
);

// Hash the password whenever it is set or changed
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.methods.checkPassword = function checkPassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);
