const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    sparse: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  rollNumber: {
    type: String,
    sparse: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ['admin', 'instructor', 'student'],
    required: true
  },

  department: {
    type: String,
    trim: true
  },

  year: {
    type: String,
    enum: ["1st", "2nd", "3rd", "4th"],
    required: function () {
      return this.role === "student";
    }
  },

  parentContact: {
    type: String,
    trim: true
  },

  phone: {
    type: String,
    trim: true
  },

  profilePicture: {
    type: String, // Base64 encoded image
    default: null
  },

  bio: {
    type: String,
    trim: true,
    maxlength: 200
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });


// 🔐 Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});


// 🔍 Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};


// 🚫 Remove password from JSON response
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};


module.exports = mongoose.model('User', userSchema);