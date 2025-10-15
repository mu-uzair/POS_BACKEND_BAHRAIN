const Product = require('../../models/Inventory/productModel');
const Transaction = require('../../models/Inventory/transactionModel');
const createHttpError = require("http-errors");

const getMetrics = async (req, res) => {
  try {
    console.log("getMetrics - Calculating inventory metrics");

    // Metric 1: Total Inventory Value
    const products = await Product.find().lean();
    const totalInventoryValue = products.reduce((total, product) => {
      return total + (product.quantity_in_stock * product.cost_per_unit);
    }, 0);

    // Metric 2: Number of Products in Stock
    const productsInStock = products.filter(product => product.quantity_in_stock > 0).length;

    // Metric 3: Low Stock Alerts (Count and List)
    const lowStockProducts = products.filter(product => product.quantity_in_stock <= product.reorder_threshold);
    const lowStockCount = lowStockProducts.length;
    const lowStockList = lowStockProducts.map(product => ({
      name: product.name,
      quantity_in_stock: product.quantity_in_stock,
      reorder_threshold: product.reorder_threshold,
    }));

    // Metric 4: Total Transactions (Overall and By Type)
    const transactions = await Transaction.find().lean();
    const totalTransactions = transactions.length;
    const stockInTransactions = transactions.filter(tx => tx.type === 'in').length;
    const stockOutTransactions = transactions.filter(tx => tx.type === 'out').length;

    // Metric 5: Transaction Value (Stock In vs Stock Out)
    const stockInValue = transactions
      .filter(tx => tx.type === 'in' && typeof tx.unitCost === 'number')
      .reduce((total, tx) => total + (tx.quantity * tx.unitCost), 0);
    const stockOutValue = transactions
      .filter(tx => tx.type === 'out' && typeof tx.unitCost === 'number')
      .reduce((total, tx) => total + (tx.quantity * tx.unitCost), 0);

    // Metric 6: Average Unit Cost Across Products
    const totalCostPerUnit = products.reduce((total, product) => total + product.cost_per_unit, 0);
    const averageUnitCost = products.length > 0 ? totalCostPerUnit / products.length : 0;

    // Metric 7: Top Products by Transaction Activity (by quantity moved)
    const productActivity = {};
    transactions.forEach(tx => {
      const productId = tx.productId.toString();
      if (!productActivity[productId]) {
        productActivity[productId] = { name: tx.productName, quantityMoved: 0 };
      }
      productActivity[productId].quantityMoved += tx.quantity;
    });
    const topProducts = Object.values(productActivity)
      .sort((a, b) => b.quantityMoved - a.quantityMoved)
      .slice(0, 5); // Top 5 products

    // Metric 8: Vendor Contribution to Inventory
    const vendorContribution = await Product.aggregate([
      {
        $lookup: {
          from: 'vendors',
          localField: 'vendor',
          foreignField: '_id',
          as: 'vendorData',
        },
      },
      { $unwind: { path: '$vendorData', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$vendorData.name',
          productCount: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity_in_stock', '$cost_per_unit'] } },
        },
      },
      {
        $project: {
          vendorName: '$_id',
          productCount: 1,
          totalValue: 1,
          _id: 0,
        },
      },
    ]);

    // Metric 9: Recent Transaction Activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentTransactions = await Transaction.countDocuments({
      date: { $gte: sevenDaysAgo },
    });

    // Metric 10: Stock Movement by Product
    const stockMovement = await Transaction.aggregate([
      {
        $group: {
          _id: '$productId',
          stockIn: { $sum: { $cond: [{ $eq: ['$type', 'in'] }, '$quantity', 0] } },
          stockOut: { $sum: { $cond: [{ $eq: ['$type', 'out'] }, '$quantity', 0] } },
          productName: { $first: '$productName' },
        },
      },
      {
        $project: {
          productId: '$_id',
          productName: 1,
          stockIn: 1,
          stockOut: 1,
          _id: 0,
        },
      },
    ]);

    // Metric 11: Average Transaction Value
    const transactionValues = transactions
      .filter(tx => typeof tx.unitCost === 'number')
      .map(tx => tx.quantity * tx.unitCost);
    const averageTransactionValue = transactionValues.length > 0
      ? transactionValues.reduce((sum, val) => sum + val, 0) / transactionValues.length
      : 0;

    const metrics = {
      totalInventoryValue,
      productsInStock,
      lowStockCount,
      lowStockList,
      totalTransactions,
      stockInTransactions,
      stockOutTransactions,
      stockInValue,
      stockOutValue,
      averageUnitCost,
      topProducts,
      vendorContribution,
      recentTransactions,
      stockMovement,
      averageTransactionValue,
    };

    console.log("getMetrics - Calculated Metrics:", metrics);

    res.status(200).json({ data: metrics });
  } catch (error) {
    console.error("getMetrics - Error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getMetrics };