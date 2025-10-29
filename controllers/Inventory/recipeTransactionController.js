// controllers/Inventory/recipeTransactionController.js

const RecipeTransaction = require('../../models/Inventory/recipeTransactionModel');
const Product = require('../../models/Inventory/productModel');
const createHttpError = require('http-errors');

// ---------------------------
// 📜 Get All Recipe Transactions
// ---------------------------
exports.getAllRecipeTransactions = async (req, res, next) => {
   
  try {
    const { startDate, endDate, dishId, createdBy, search } = req.query;
    const filter = {};

    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (dishId) filter.dishId = dishId;
    if (createdBy) filter.createdBy = createdBy;
    if (search) {
      filter.$or = [
        { recipeName: { $regex: search, $options: 'i' } },
        { variationName: { $regex: search, $options: 'i' } },
      ];
    }

    const transactions = await RecipeTransaction.find(filter)
      .populate('recipeId', 'variationName')
      .populate('dishId', 'dishName')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------
// 🔍 Get Single Transaction
// ---------------------------
exports.getRecipeTransactionById = async (req, res, next) => {
  try {
    const txn = await RecipeTransaction.findById(req.params.id)
      .populate('recipeId', 'variationName')
      .populate('dishId', 'dishName')
      .populate('createdBy', 'name email');

    if (!txn) throw createHttpError(404, 'Recipe transaction not found');

    res.status(200).json({
      success: true,
      data: txn,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------
// 🗑️ Delete Transaction (Admin only)
// ---------------------------
exports.deleteRecipeTransaction = async (req, res, next) => {
  try {
    const txn = await RecipeTransaction.findById(req.params.id);
    if (!txn) throw createHttpError(404, 'Transaction not found');

    await txn.deleteOne();
    res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// // ---------------------------
// // 🔄 Rollback Recipe Transaction
// // ---------------------------
// exports.rollbackRecipeTransaction = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user?._id; // assuming verifyUser middleware sets req.user

//     const originalTxn = await RecipeTransaction.findById(id);
//     if (!originalTxn) throw createHttpError(404, 'Original transaction not found');

//     // Prevent multiple rollbacks for the same transaction
//     const existingRollback = await RecipeTransaction.findOne({ rollbackOf: id });
//     if (existingRollback) {
//       throw createHttpError(400, 'This transaction has already been rolled back');
//     }

//     // Reverse product quantities
//     const reversedAdjustments = [];
//     for (const item of originalTxn.productsAdjusted) {
//       const product = await Product.findById(item.productId);
//       if (!product) continue;

//       // Add stock back since original was 'out'
//       product.quantity_in_stock += item.qtyChanged;
//       await product.save();

//       reversedAdjustments.push({
//         productId: item.productId,
//         productName: item.productName,
//         qtyChanged: item.qtyChanged,
//         unit: item.unit,
//       });
//     }

//     // Create rollback transaction record
//     const rollbackTxn = await RecipeTransaction.create({
//       recipeId: originalTxn.recipeId,
//       recipeName: originalTxn.recipeName,
//       dishId: originalTxn.dishId,
//       variationName: originalTxn.variationName,
//       quantityOfDishes: originalTxn.quantityOfDishes,
//       productsAdjusted: reversedAdjustments,
//       type: 'in',
//       notes: `Rollback of transaction ${id}`,
//       createdBy: userId,
//       rollbackOf: id,
//     });

//     res.status(200).json({
//       success: true,
//       message: 'Recipe transaction rolled back successfully',
//       data: rollbackTxn,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// ---------------------------
// 📊 Summary (Analytics)
// ---------------------------
exports.getRecipeTransactionSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};

    if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const summary = await RecipeTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$dishId',
          totalDishes: { $sum: '$quantityOfDishes' },
          totalTransactions: { $sum: 1 },
          totalProductsAdjusted: { $sum: { $size: '$productsAdjusted' } },
        },
      },
      {
        $lookup: {
          from: 'dishes',
          localField: '_id',
          foreignField: '_id',
          as: 'dishInfo',
        },
      },
      { $unwind: '$dishInfo' },
      {
        $project: {
          dishName: '$dishInfo.dishName',
          totalDishes: 1,
          totalTransactions: 1,
          totalProductsAdjusted: 1,
        },
      },
      { $sort: { totalDishes: -1 } },
    ]);

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (err) {
    next(err);
  }
};
