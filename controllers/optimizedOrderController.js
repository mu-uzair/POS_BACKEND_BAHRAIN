// ============================================
// FILE: controllers/orderController.js
// ============================================

const orderModel = require("../models/orderModel");

// ============================================
// 3. PAGINATED ORDERS (WITH FILTERS)
// ============================================
exports.getPaginatedOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      dateFilter,
      startDate,
      endDate,
      orderType,
      paymentMethod,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // ✅ BUILD DYNAMIC FILTER
    const filter = {};

    // Status filter
    if (status && status !== 'All') {
      filter.orderStatus = status;
    }

    // Date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'Today') {
      filter.createdAt = { $gte: today };
    } else if (dateFilter === 'Yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: yesterday, $lte: endOfYesterday };
    } else if (dateFilter === 'Custom' && startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Order type filter
    if (orderType && orderType !== 'All') {
      filter['customerDetails.orderType'] = orderType;
    }

    // Payment method filter (NEW)
    if (paymentMethod && paymentMethod !== 'All') {
      filter.paymentMethod = paymentMethod;
    }

    // ✅ PAGINATION
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOption = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // ✅ EXECUTE QUERY
    const [orders, totalCount] = await Promise.all([
      orderModel.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('table', 'tableNo status')
        .lean(),
      orderModel.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalOrders: totalCount,
        hasMore: skip + orders.length < totalCount,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching paginated orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// ============================================
// 4. ORDER STATISTICS (FILTER COUNTS)
// ============================================
exports.getOrderStats = async (req, res) => {
  try {
    const {
      dateFilter,
      startDate,
      endDate,
      orderType
    } = req.query;

    // ✅ BUILD BASE FILTER
    const baseFilter = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'Today') {
      baseFilter.createdAt = { $gte: today };
    } else if (dateFilter === 'Yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      baseFilter.createdAt = { $gte: yesterday, $lte: endOfYesterday };
    } else if (dateFilter === 'Custom' && startDate && endDate) {
      baseFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (orderType && orderType !== 'All') {
      baseFilter['customerDetails.orderType'] = orderType;
    }

    // ✅ GET COUNTS BY STATUS
    const statusCounts = await orderModel.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format status counts
    const byStatus = {
      'All': 0,
      'In Progress': 0,
      'Ready': 0,
      'Completed': 0
    };

    statusCounts.forEach(stat => {
      byStatus[stat._id] = stat.count;
      byStatus['All'] += stat.count;
    });

    // ✅ GET COMPLETABLE ORDERS COUNT
    const completableFilter = {
      ...baseFilter,
      orderStatus: { $nin: ['Completed', 'Cancelled'] }
    };
    const completableCount = await orderModel.countDocuments(completableFilter);

    res.json({
      success: true,
      data: {
        byStatus,
        completableOrders: completableCount
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
};

// ============================================
// 5. PAYMENT TOTALS (ORDERS PAGE)
// ============================================
exports.getPaymentTotals = async (req, res) => {
  try {
    const {
      status,
      dateFilter,
      startDate,
      endDate,
      orderType
    } = req.query;

    // ✅ BUILD FILTER (same as stats)
    const filter = {};

    if (status && status !== 'All') {
      filter.orderStatus = status;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateFilter === 'Today') {
      filter.createdAt = { $gte: today };
    } else if (dateFilter === 'Yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: yesterday, $lte: endOfYesterday };
    } else if (dateFilter === 'Custom' && startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (orderType && orderType !== 'All') {
      filter['customerDetails.orderType'] = orderType;
    }

    // ✅ AGGREGATE PAYMENT TOTALS
    const paymentTotals = await orderModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$bills.totalWithTax' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format response
    const totals = {
      Cash: '0.000',
      Online: '0.000',
      Benefit: '0.000',
      Total: '0.000'
    };

    const counts = {
      Cash: 0,
      Online: 0,
      Benefit: 0,
      Total: 0
    };

    let grandTotal = 0;

    paymentTotals.forEach(payment => {
      const method = payment._id || 'Cash';
      const amount = payment.total || 0;
      totals[method] = amount.toFixed(3);
      counts[method] = payment.count;
      grandTotal += amount;
      counts.Total += payment.count;
    });

    totals.Total = grandTotal.toFixed(3);

    res.json({
      success: true,
      data: {
        totals,
        counts
      }
    });
  } catch (error) {
    console.error('Error fetching payment totals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment totals',
      error: error.message
    });
  }
};

// ============================================
// 6. POPULAR DISHES
// ============================================
// exports.getPopularDishes = async (req, res) => {
//   try {
//     const { limit = 10, dateRange = 30 } = req.query;

//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - parseInt(dateRange));

//     const popularDishes = await orderModel.aggregate([
//       {
//         $match: {
//           createdAt: { $gte: startDate },
//           orderStatus: 'Completed'
//         }
//       },
//       { $unwind: '$items' },
//       {
//         $group: {
//           _id: '$items.name',
//           totalOrders: { $sum: 1 },
//           totalQuantity: { $sum: '$items.quantity' },
//           totalRevenue: {
//             $sum: { $multiply: ['$items.quantity', '$items.price'] }
//           }
//         }
//       },
//       { $sort: { totalQuantity: -1 } },
//       { $limit: parseInt(limit) },
//       {
//         $project: {
//           _id: 0,
//           name: '$_id',
//           totalOrders: 1,
//           totalQuantity: 1,
//           totalRevenue: { $round: ['$totalRevenue', 3] }
//         }
//       }
//     ]);

//     res.json({
//       success: true,
//       data: popularDishes
//     });
//   } catch (error) {
//     console.error('Error fetching popular dishes:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch popular dishes',
//       error: error.message
//     });
//   }
// };
exports.getPopularDishes = async (req, res) => {
  
  try {
    const { limit = 10, dateRange, startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (dateRange) {
      const start = new Date();
      start.setDate(start.getDate() - parseInt(dateRange));
      dateFilter = { $gte: start };
    } else {
      const start = new Date();
      start.setDate(start.getDate() - 30);
      dateFilter = { $gte: start };
    }

    const popularDishes = await orderModel.aggregate([
      {
        $match: {
          createdAt: dateFilter,
          orderStatus: 'Completed'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            name: '$items.name',
            variation: '$items.variationName'
          },
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: {
            $sum: { $multiply: ['$items.quantity', '$items.price'] }
          }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 0,
          name: '$_id.name',
          variation: '$_id.variation',
          totalOrders: 1,
          totalQuantity: 1,
          totalRevenue: { $round: ['$totalRevenue', 3] }
        }
      }
    ]);

    res.json({
      success: true,
      data: popularDishes
    });
  } catch (error) {
    console.error('Error fetching popular dishes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular dishes',
      error: error.message
    });
  }
};

exports.completeAllOrders = async (req, res) => {
  console.log("✅ completeAllOrders route hit");
  try {
    // ✅ Filter orders that can be completed
    const filter = {
      orderStatus: { $nin: ['Completed', 'Cancelled'] }
    };

    // Optional: you can filter by date, table, etc.
    // const { dateFilter } = req.body;
    // Apply date filters here if needed

    // ✅ Update all matching orders to 'Completed'
    const result = await orderModel.updateMany(filter, {
      $set: { orderStatus: 'Completed', completedAt: new Date() }
    });

    // result.nModified gives how many orders were updated
    res.json({
      success: true,
      message: `${result.modifiedCount} orders marked as Completed`,
      modifiedCount: result.modifiedCount
    });

    // ✅ Trigger socket update (if using Socket.io)
    if (req.io) {
      req.io.emit('ordersUpdated', { action: 'completeAll' });
    }
  } catch (error) {
    console.error('Error completing all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete all orders',
      error: error.message
    });
  }
};
