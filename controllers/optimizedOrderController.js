// ============================================
// FILE: controllers/orderController.js
// ============================================

const orderModel = require("../models/orderModel");
const tableModel = require("../models/tableModel"); // Add this line

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

    // ✅ Get all orders that will be completed (to extract table info)
    const ordersToComplete = await orderModel.find(filter);

    console.log("📋 Orders to complete:", ordersToComplete.length);

    // ✅ Update all matching orders to 'Completed'
    const result = await orderModel.updateMany(filter, {
      $set: { orderStatus: 'Completed', completedAt: new Date() }
    });

    // ✅ Mark tables as available for dine-in orders
    const dineInOrders = ordersToComplete.filter(order => {
      const orderType = order.customerDetails?.orderType || order.orderType;
      const tableId = order.table || order.tableId;
      
      return orderType === 'Dine-in' && tableId;
    });

    console.log(`✅ Found ${dineInOrders.length} dine-in orders with tables`);

    if (dineInOrders.length > 0) {
      // Extract table IDs
      const tableIds = dineInOrders
        .map(order => order.table || order.tableId)
        .filter(id => id);
      
      console.log("📋 Table IDs to update:", tableIds);

      if (tableIds.length > 0) {
        // Update tables to available status
        const tableUpdateResult = await tableModel.updateMany(
          { _id: { $in: tableIds } },
          { $set: { status: 'Available', orderId: null } }
        );
        
        console.log(`✅ ${tableUpdateResult.modifiedCount} tables updated to Available`);
      }
    }

    res.json({
      success: true,
      message: `${result.modifiedCount} orders marked as Completed`,
      modifiedCount: result.modifiedCount,
      tablesFreed: dineInOrders.length
    });

    // ✅ Trigger socket update (if using Socket.io)
    if (req.io) {
      req.io.emit('ordersUpdated', { action: 'completeAll' });
      if (dineInOrders.length > 0) {
        req.io.emit('tablesUpdated', { action: 'tablesFreed' });
      }
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



// // ============================================
// // 6. SALES REPORT (FOR EXCEL EXPORT)
// // ============================================
// exports.getSalesReport = async (req, res) => {
//   console.log("✅ getSalesReport route hit");
//   try {
//     const { startDate, endDate } = req.query;

//     if (!startDate || !endDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Start date and end date are required'
//       });
//     }

//     // ✅ BUILD FILTER FOR COMPLETED ORDERS ONLY
//     const filter = {
//       orderStatus: 'Completed',
//       createdAt: {
//         $gte: new Date(startDate),
//         $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
//       }
//     };

//     // ✅ FETCH COMPLETED ORDERS
//     const orders = await orderModel.find(filter)
//       .sort({ createdAt: -1 })
//       .select('orderId createdAt bills paymentMethod customerDetails')
//       .lean();

//     // ✅ CALCULATE TOTALS
//     let totalGross = 0;
//     let totalVAT = 0;
//     let totalNet = 0;

//     const formattedOrders = orders.map(order => {
//       const grossAmount = order.bills?.totalWithoutTax || 0;
//       const vatAmount = order.bills?.taxAmount || 0;
//       const netAmount = order.bills?.totalWithTax || 0;

//       totalGross += grossAmount;
//       totalVAT += vatAmount;
//       totalNet += netAmount;

//       return {
//         orderId: order.orderId,
//         createdAt: order.createdAt,
//         grossAmount: parseFloat(grossAmount.toFixed(3)),
//         vatAmount: parseFloat(vatAmount.toFixed(3)),
//         netAmount: parseFloat(netAmount.toFixed(3)),
//         paymentMethod: order.paymentMethod || 'Cash',
//         orderType: order.customerDetails?.orderType || 'N/A'
//       };
//     });

//     res.json({
//       success: true,
//       data: {
//         orders: formattedOrders,
//         summary: {
//           totalOrders: orders.length,
//           totalGross: parseFloat(totalGross.toFixed(3)),
//           totalVAT: parseFloat(totalVAT.toFixed(3)),
//           totalNet: parseFloat(totalNet.toFixed(3))
//         }
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching sales report:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch sales report',
//       error: error.message
//     });
//   }
// };

// ============================================
// 6. SALES REPORT (FOR EXCEL EXPORT)
// ============================================
exports.getSalesReport = async (req, res) => {
  console.log("✅ getSalesReport route hit");
  
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // ✅ BUILD FILTER FOR COMPLETED ORDERS ONLY
    const filter = {
      orderStatus: 'Completed',
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    };

    // ✅ FETCH COMPLETED ORDERS
    const orders = await orderModel.find(filter)
      .sort({ createdAt: -1 })
      .select('orderId createdAt bills paymentMethod customerDetails')
      .lean();

    console.log(`📊 Found ${orders.length} orders`);

    // ✅ CALCULATE TOTALS
    let totalGross = 0;
    let totalVAT = 0;
    let totalNet = 0;

    const formattedOrders = orders.map(order => {
      // ✅ FIXED: Use correct field names from your database
      const grossAmount = order.bills?.total || 0;           // Changed from totalWithoutTax
      const vatAmount = order.bills?.tax || 0;               // Changed from taxAmount
      const netAmount = order.bills?.totalWithTax || 0;      // This was already correct

      totalGross += grossAmount;
      totalVAT += vatAmount;
      totalNet += netAmount;

      return {
        orderId: order.orderId,
        createdAt: order.createdAt,
        grossAmount: parseFloat(grossAmount.toFixed(3)),
        vatAmount: parseFloat(vatAmount.toFixed(3)),
        netAmount: parseFloat(netAmount.toFixed(3)),
        paymentMethod: order.paymentMethod || 'Cash',
        orderType: order.customerDetails?.orderType || 'N/A'
      };
    });

    console.log("✅ Summary:", {
      totalOrders: orders.length,
      totalGross,
      totalVAT,
      totalNet
    });

    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        summary: {
          totalOrders: orders.length,
          totalGross: parseFloat(totalGross.toFixed(3)),
          totalVAT: parseFloat(totalVAT.toFixed(3)),
          totalNet: parseFloat(totalNet.toFixed(3))
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching sales report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales report',
      error: error.message
    });
  }
};