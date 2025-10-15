const Transaction = require('../../models/Inventory/transactionModel');
const Product = require('../../models/Inventory/productModel');
const createHttpError = require('http-errors');


const getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find().select("productName type quantity notes unitCost date vendorName");
    res.status(200).json({
      success: true,
      data: {data:transactions}, // Simplified response structure
    });
  } catch (error) {
    return next(createHttpError(500, "Failed to fetch Transaction", { error: error.message }));
  }
};


// Delete a transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("deleteTransaction - Transaction ID:", id);

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      throw createHttpError(404, 'Transaction not found');
    }

    if (transaction.quantity <= 0) {
      throw createHttpError(400, 'Transaction quantity must be greater than 0');
    }

    const product = await Product.findById(transaction.productId);
    if (!product) {
      console.log("deleteTransaction - Product not found, proceeding with transaction deletion");
    } else {
      if (transaction.type === 'in') {
        if (product.quantity_in_stock < transaction.quantity) {
          throw createHttpError(400, 'Cannot delete Stock In transaction: insufficient stock to subtract');
        }
        product.quantity_in_stock -= transaction.quantity;
      } else if (transaction.type === 'out') {
        product.quantity_in_stock += transaction.quantity;
      }
      await product.save();
      console.log("deleteTransaction - Product stock updated:", product);
    }

    await Transaction.findByIdAndDelete(id);
    console.log("deleteTransaction - Transaction Deleted:", transaction);

    res.status(200).json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error("deleteTransaction - Error:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete transaction',
    });
  }
};


module.exports = { getTransactions, deleteTransaction };