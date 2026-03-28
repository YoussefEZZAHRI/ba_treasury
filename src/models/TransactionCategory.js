import mongoose from 'mongoose';

const transactionCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
}, { timestamps: true });

const TransactionCategory = mongoose.models.TransactionCategory ||
  mongoose.model('TransactionCategory', transactionCategorySchema);

export default TransactionCategory;
