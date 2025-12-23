// // ============================================
// // FILE: controllers/analyticsController.js
// // ============================================

// const Order = require('../models/orderModel');
// const mongoose = require('mongoose');

// // ============================================
// // 1. DASHBOARD ANALYTICS (HOME + DASHBOARD PAGE)
// // ============================================
// exports.getDashboardAnalytics = async (req, res) => {
//   try {
//     const { dateRange = '30' } = req.query; // days

//     const startDate = new Date();
//     startDate.setDate(startDate.getDate() - parseInt(dateRange));
//     startDate.setHours(0, 0, 0, 0);

//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // ✅ RUN MULTIPLE AGGREGATIONS IN PARALLEL
//     const [
//       revenueData,
//       orderCounts,
//       activeOrders,
//       readyOrders,
//       itemsSold,
//       dailyRevenue,
//       revenueByOrderType,
//       topDishes
//     ] = await Promise.all([
//       // 1. Total Revenue (date range)
//       Order.aggregate([
//         {
//           $match: {
//             createdAt: { $gte: startDate },
//             orderStatus: 'Completed'
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             totalRevenue: { $sum: '$bills.totalWithTax' },
//             totalOrders: { $sum: 1 }
//           }
//         }
//       ]),

//       // 2. Order Status Counts
//       Order.aggregate([
//         {
//           $match: { createdAt: { $gte: startDate } }
//         },
//         {
//           $group: {
//             _id: '$orderStatus',
//             count: { $sum: 1 }
//           }
//         }
//       ]),

//       // 3. Active Orders (In Progress)
//       Order.countDocuments({
//         orderStatus: 'In Progress'
//       }),

//       // 4. Ready Orders
//       Order.countDocuments({
//         orderStatus: 'Ready'
//       }),

//       // 5. Items Sold (date range)
//       Order.aggregate([
//         {
//           $match: {
//             createdAt: { $gte: startDate },
//             orderStatus: 'Completed'
//           }
//         },
//         { $unwind: '$items' },
//         {
//           $group: {
//             _id: null,
//             totalItems: { $sum: '$items.quantity' }
//           }
//         }
//       ]),

//       // 6. Daily Revenue Trend (last 30 days)
//       Order.aggregate([
//         {
//           $match: {
//             createdAt: { $gte: startDate },
//             orderStatus: 'Completed'
//           }
//         },
//         {
//           $group: {
//             _id: {
//               $dateToString: {
//                 format: '%Y-%m-%d',
//                 date: '$createdAt'
//               }
//             },
//             revenue: { $sum: '$bills.totalWithTax' },
//             orders: { $sum: 1 }
//           }
//         },
//         { $sort: { _id: 1 } }
//       ]),

//       // 7. Revenue by Order Type
//       Order.aggregate([
//         {
//           $match: {
//             createdAt: { $gte: startDate },
//             orderStatus: 'Completed'
//           }
//         },
//         {
//           $group: {
//             _id: '$customerDetails.orderType',
//             revenue: { $sum: '$bills.totalWithTax' },
//             count: { $sum: 1 }
//           }
//         }
//       ]),

//       // 8. Top Selling Dishes
//       Order.aggregate([
//         {
//           $match: {
//             createdAt: { $gte: startDate },
//             orderStatus: 'Completed'
//           }
//         },
//         { $unwind: '$items' },
//         {
//           $group: {
//             _id: '$items.name',
//             quantity: { $sum: '$items.quantity' },
//             revenue: {
//               $sum: { $multiply: ['$items.quantity', '$items.price'] }
//             },
//             orders: { $sum: 1 }
//           }
//         },
//         { $sort: { quantity: -1 } },
//         { $limit: 10 }
//       ])
//     ]);

//     // ✅ FORMAT RESPONSE
//     const totalRevenue = revenueData[0]?.totalRevenue || 0;
//     const totalOrders = revenueData[0]?.totalOrders || 0;
//     const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

//     res.json({
//       success: true,
//       data: {
//         // Summary Metrics
//         summary: {
//           totalRevenue: totalRevenue.toFixed(3),
//           totalOrders: totalOrders,
//           avgOrderValue: avgOrderValue.toFixed(3),
//           activeOrders: activeOrders,
//           readyOrders: readyOrders,
//           itemsSold: itemsSold[0]?.totalItems || 0
//         },

//         // Order Status Breakdown
//         ordersByStatus: orderCounts.reduce((acc, item) => {
//           acc[item._id] = item.count;
//           return acc;
//         }, {}),

//         // Daily Revenue Trend (for graph)
//         dailyRevenueTrend: dailyRevenue.map(day => ({
//           date: day._id,
//           revenue: parseFloat(day.revenue.toFixed(3)),
//           orders: day.orders
//         })),

//         // Revenue by Order Type (for pie chart)
//         revenueByOrderType: revenueByOrderType.map(type => ({
//           orderType: type._id || 'Unknown',
//           revenue: parseFloat(type.revenue.toFixed(3)),
//           count: type.count,
//           percentage: totalRevenue > 0
//             ? ((type.revenue / totalRevenue) * 100).toFixed(1)
//             : 0
//         })),

//         // Top Selling Dishes (for bar chart)
//         topSellingDishes: topDishes.map((dish, index) => ({
//           rank: index + 1,
//           name: dish._id,
//           quantity: dish.quantity,
//           revenue: parseFloat(dish.revenue.toFixed(3)),
//           orders: dish.orders
//         }))
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching dashboard analytics:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch dashboard analytics',
//       error: error.message
//     });
//   }
// };

// // ============================================
// // 2. TODAY'S ANALYTICS (HOME PAGE SPECIFIC)
// // ============================================
// exports.getTodayAnalytics = async (req, res) => {
//   try {
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     const [
//       todayRevenue,
//       inProgressOrders,
//       recentOrders
//     ] = await Promise.all([
//       // Today's Revenue
//       Order.aggregate([
//         {
//           $match: {
//             createdAt: { $gte: today },
//             orderStatus: 'Completed'
//           }
//         },
//         {
//           $group: {
//             _id: null,
//             revenue: { $sum: '$bills.totalWithTax' },
//             count: { $sum: 1 }
//           }
//         }
//       ]),

//       // In Progress Orders Count
//       Order.countDocuments({
//         orderStatus: 'In Progress'
//       }),

//       // Recent Orders (last 10)
//       Order.find({})
//         .sort({ createdAt: -1 })
//         .limit(10)
//         .populate('table', 'tableNumber')
//         .lean()
//     ]);

//     res.json({
//       success: true,
//       data: {
//         todayRevenue: todayRevenue[0]?.revenue.toFixed(3) || '0.000',
//         todayOrders: todayRevenue[0]?.count || 0,
//         inProgressOrders: inProgressOrders,
//         recentOrders: recentOrders
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching today analytics:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch today analytics',
//       error: error.message
//     });
//   }
// };

// ============================================
// FILE: controllers/analyticsController.js
// ============================================

const Order = require('../models/orderModel');
const mongoose = require('mongoose');

// ============================================
// 1. DASHBOARD ANALYTICS (HOME + DASHBOARD PAGE)
// ============================================
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { 
      dateRange = '30', 
      orderType, 
      startDate, 
      endDate 
    } = req.query;

    console.log('📊 Analytics Request:', { dateRange, orderType, startDate, endDate });

    // ✅ DETERMINE DATE RANGE
    let filterStartDate;
    let filterEndDate;

    if (startDate && endDate) {
      // Custom date range - parse dates correctly
      filterStartDate = new Date(startDate + 'T00:00:00.000Z');
      filterEndDate = new Date(endDate + 'T23:59:59.999Z');
      
      console.log('📅 Using Custom Date Range');
      console.log('  Start Date String:', startDate);
      console.log('  End Date String:', endDate);
      console.log('  Parsed Start:', filterStartDate);
      console.log('  Parsed End:', filterEndDate);
    } else {
      // Use dateRange parameter
      filterEndDate = new Date();
      filterEndDate.setHours(23, 59, 59, 999);
      
      filterStartDate = new Date();
      filterStartDate.setDate(filterStartDate.getDate() - parseInt(dateRange));
      filterStartDate.setHours(0, 0, 0, 0);
      
      console.log('📅 Using Date Range:', dateRange, 'days');
    }

    console.log('📅 Final Date Filter:', { 
      filterStartDate: filterStartDate.toISOString(), 
      filterEndDate: filterEndDate.toISOString() 
    });

    // ✅ BUILD BASE MATCH QUERY
    const baseMatchQuery = {
      createdAt: { 
        $gte: filterStartDate,
        $lte: filterEndDate 
      }
    };

    // Add orderType filter if provided
    if (orderType && orderType !== 'All') {
      baseMatchQuery['customerDetails.orderType'] = orderType;
      console.log('🎯 Order Type Filter:', orderType);
    }

    const completedMatchQuery = {
      ...baseMatchQuery,
      orderStatus: 'Completed'
    };

    console.log('🔍 Base Match Query:', JSON.stringify(baseMatchQuery, null, 2));

    // ✅ RUN MULTIPLE AGGREGATIONS IN PARALLEL
    const [
      revenueData,
      orderCounts,
      activeOrders,
      readyOrders,
      itemsSold,
      dailyRevenue,
      revenueByOrderType,
      topDishes
    ] = await Promise.all([
      // 1. Total Revenue (date range + filters)
      Order.aggregate([
        { $match: completedMatchQuery },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$bills.totalWithTax' },
            totalOrders: { $sum: 1 }
          }
        }
      ]),

      // 2. Order Status Counts (with filters)
      Order.aggregate([
        { $match: baseMatchQuery },
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 }
          }
        }
      ]),

      // 3. Active Orders (with filters)
      Order.countDocuments({
        ...baseMatchQuery,
        orderStatus: 'In Progress'
      }),

      // 4. Ready Orders (with filters)
      Order.countDocuments({
        ...baseMatchQuery,
        orderStatus: 'Ready'
      }),

      // 5. Items Sold (with filters)
      Order.aggregate([
        { $match: completedMatchQuery },
        { $unwind: '$items' },
        {
          $group: {
            _id: null,
            totalItems: { $sum: '$items.quantity' }
          }
        }
      ]),

      // 6. Daily Revenue Trend (with filters)
      Order.aggregate([
        { $match: completedMatchQuery },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            revenue: { $sum: '$bills.totalWithTax' },
            orders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // 7. Revenue by Order Type (with filters)
      Order.aggregate([
        { $match: completedMatchQuery },
        {
          $group: {
            _id: '$customerDetails.orderType',
            revenue: { $sum: '$bills.totalWithTax' },
            count: { $sum: 1 }
          }
        }
      ]),

      // 8. Top Selling Dishes (with filters)
      Order.aggregate([
        { $match: completedMatchQuery },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            quantity: { $sum: '$items.quantity' },
            revenue: {
              $sum: { $multiply: ['$items.quantity', '$items.price'] }
            },
            orders: { $sum: 1 }
          }
        },
        { $sort: { quantity: -1 } },
        { $limit: 10 }
      ])
    ]);

    // ✅ FORMAT RESPONSE
    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const totalOrders = revenueData[0]?.totalOrders || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const responseData = {
      success: true,
      data: {
        // Summary Metrics
        summary: {
          totalRevenue: totalRevenue.toFixed(3),
          totalOrders: totalOrders,
          avgOrderValue: avgOrderValue.toFixed(3),
          activeOrders: activeOrders,
          readyOrders: readyOrders,
          itemsSold: itemsSold[0]?.totalItems || 0
        },

        // Order Status Breakdown
        ordersByStatus: orderCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),

        // Daily Revenue Trend (for graph)
        dailyRevenueTrend: dailyRevenue.map(day => ({
          date: day._id,
          revenue: parseFloat(day.revenue.toFixed(3)),
          orders: day.orders
        })),

        // Revenue by Order Type (for pie chart)
        revenueByOrderType: revenueByOrderType.map(type => ({
          orderType: type._id || 'Unknown',
          revenue: parseFloat(type.revenue.toFixed(3)),
          count: type.count,
          percentage: totalRevenue > 0
            ? ((type.revenue / totalRevenue) * 100).toFixed(1)
            : 0
        })),

        // Top Selling Dishes (for bar chart)
        topSellingDishes: topDishes.map((dish, index) => ({
          rank: index + 1,
          name: dish._id,
          quantity: dish.quantity,
          revenue: parseFloat(dish.revenue.toFixed(3)),
          orders: dish.orders
        })),

        // Applied filters (for reference)
        appliedFilters: {
          dateRange: startDate && endDate ? 'custom' : dateRange,
          orderType: orderType || 'All',
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    };

    console.log('✅ Analytics Response Summary:', responseData.data.summary);

    res.json(responseData);
  } catch (error) {
    console.error('❌ Error fetching dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
};

// ============================================
// 2. TODAY'S ANALYTICS (HOME PAGE SPECIFIC)
// ============================================
exports.getTodayAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      todayRevenue,
      inProgressOrders,
      recentOrders
    ] = await Promise.all([
      // Today's Revenue
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
            orderStatus: 'Completed'
          }
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: '$bills.totalWithTax' },
            count: { $sum: 1 }
          }
        }
      ]),

      // In Progress Orders Count
      Order.countDocuments({
        orderStatus: 'In Progress'
      }),

      // Recent Orders (last 10)
      Order.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('table', 'tableNumber')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        todayRevenue: todayRevenue[0]?.revenue.toFixed(3) || '0.000',
        todayOrders: todayRevenue[0]?.count || 0,
        inProgressOrders: inProgressOrders,
        recentOrders: recentOrders
      }
    });
  } catch (error) {
    console.error('Error fetching today analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today analytics',
      error: error.message
    });
  }
};