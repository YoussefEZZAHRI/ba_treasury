import mongoose from 'mongoose';

// Transaction subdocument schema
const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['credit', 'debit'],
      message: 'Transaction type must be either "credit" or "debit"'
    }
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    maxlength: [200, 'Reason cannot exceed 200 characters'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  }
}, {
  timestamps: true
});

// Single global balance schema
const balanceSchema = new mongoose.Schema({
  currentBalance: {
    type: Number,
    default: 0,
    set: function(value) {
      return parseFloat(value) || 0;
    }
  },
  transactions: [transactionSchema]
}, {
  timestamps: true
});

// Method to add a transaction
balanceSchema.methods.addTransaction = function(amount, type, reason, userId) {
  if (type !== 'credit' && type !== 'debit') {
    throw new Error('Transaction type must be either "credit" or "debit"');
  }

  // Convert amount to number to ensure proper arithmetic
  const numericAmount = parseFloat(amount);
  
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Transaction amount must be a valid number greater than 0');
  }

  // Add transaction to the array
  this.transactions.push({
    amount: numericAmount,
    type,
    reason,
    userId
  });

  // Update current balance
  if (type === 'credit') {
    this.currentBalance += numericAmount;
  } else {
    this.currentBalance -= numericAmount;
  }

  return this.save();
};

// Method to get transactions by type
balanceSchema.methods.getTransactionsByType = function(type) {
  return this.transactions.filter(transaction => transaction.type === type);
};

// Method to get transactions by date range
balanceSchema.methods.getTransactionsByDateRange = function(startDate, endDate) {
  return this.transactions.filter(transaction => {
    const transactionDate = new Date(transaction.createdAt);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
};

// Method to get balance summary
balanceSchema.methods.getBalanceSummary = function() {
  const credits = this.transactions.filter(t => t.type === 'credit');
  const debits = this.transactions.filter(t => t.type === 'debit');
  
  const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);

  return {
    currentBalance: this.currentBalance,
    totalCredits,
    totalDebits,
    transactionCount: this.transactions.length,
    creditCount: credits.length,
    debitCount: debits.length
  };
};

// Static method to get the single global balance
balanceSchema.statics.getGlobalBalance = function() {
  return this.findOne().populate('transactions.userId', 'name email');
};

// Method to recalculate balance from transactions
balanceSchema.methods.recalculateBalance = function() {
  let total = 0;
  this.transactions.forEach(transaction => {
    const amount = parseFloat(transaction.amount);
    if (transaction.type === 'credit') {
      total += amount;
    } else {
      total -= amount;
    }
  });
  this.currentBalance = total;
  return this.save();
};

// Static method to create or get the single global balance
balanceSchema.statics.getOrCreateGlobalBalance = function() {
  return this.findOne().then(balance => {
    if (!balance) {
      return this.create({
        currentBalance: 0,
        transactions: []
      });
    }
    // Recalculate balance to fix any string concatenation issues
    return balance.recalculateBalance();
  });
};

const Balance = mongoose.models.Balance || mongoose.model('Balance', balanceSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

export default Balance;
export { Transaction };
