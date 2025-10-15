const createHttpError = require("http-errors");
const Order = require("../models/orderModel");
const { default: mongoose } = require("mongoose");

const addOrder = async (req, res, next) => {
    try {
        const order = new Order(req.body);
        await order.save();
        res.status(201).json({ success: true, message: "Order Created!", data: order });
    } catch (error) {
        next(error);
    }
};

const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const order = await Order.findById(id);
        if (!order) {
            const error = createHttpError(404, "Order not found!");
            return next(error);
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        next(error);
    }
};

const getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find().populate("table");
        res.status(200).json({ data: orders });
    } catch (error) {
        next(error);
    }
};

const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderStatus } = req.body;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { orderStatus },
            { new: true }
        );

        if (!order) {
            const error = createHttpError(404, "Order not found!");
            return next(error);
        }

        res.status(200).json({ success: true, message: "Order updated!", data: order });
    } catch (error) {
        next(error);
    }
};

// const updateOrder = async (req, res, next) => {
//     try {
//         const { orderID } = req.params;
//         const {
//             customerDetails,
//             items,
//             orderStatus,
//             bills,
//             paymentMethod,
//             table
//         } = req.body;

//         // Validate order ID
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             const error = createHttpError(404, "Invalid order ID!");
//             return next(error);
//         }

//         // Prepare update object with only provided fields
//         const updateData = {};
        
//         if (customerDetails) {
//             updateData.customerDetails = {
//                 name: customerDetails.name,
//                 phone: customerDetails.phone,
//                 guests: customerDetails.guests,
//                 orderType: customerDetails.orderType
//             };
//         }

//         if (items) {
//             updateData.items = items.map(item => ({
//                 menuItem: item.menuItem,
//                 name: item.name,
//                 price: item.price,
//                 quantity: item.quantity
//             }));
//         }

//         if (orderStatus) updateData.orderStatus = orderStatus;
//         if (paymentMethod) updateData.paymentMethod = paymentMethod;
//         if (table) updateData.table = table;

//         if (bills) {
//             updateData.bills = {
//                 total: bills.total,
//                 tax: bills.tax,
//                 totalWithTax: bills.totalWithTax,
//                 discountPercentage: bills.discountPercentage,
//                 discountAmount: bills.discountAmount
//             };
//         }

//         // Add updatedAt timestamp
//         updateData.updatedAt = new Date();

//         const updatedOrder = await Order.findByIdAndUpdate(
//             id,
//             { $set: updateData },
//             { new: true, runValidators: true }
//         ).populate('table items.menuItem');

//         if (!updatedOrder) {
//             const error = createHttpError(404, "Order not found!");
//             return next(error);
//         }

//         res.status(200).json({ 
//             success: true, 
//             message: "Order updated successfully!", 
//             data: updatedOrder 
//         });

//     } catch (error) {
//         next(error);
//     }
// };


// In your orderController.js
// const updateOrder = async (req, res, next) => {
//     try {
//         const { orderId } = req.params;
//         const updateData = req.body;

//         console.log('Received update for order:', orderId);
//         console.log('Update data:', updateData);

//         if (!mongoose.Types.ObjectId.isValid(orderId)) {
//             return next(createHttpError(400, "Invalid order ID"));
//         }

//         const updatedOrder = await Order.findByIdAndUpdate(
//             orderId,
//             { $set: updateData },
//             { new: true, runValidators: true }
//         );

//         if (!updatedOrder) {
//             return next(createHttpError(404, "Order not found"));
//         }

//         res.status(200).json({
//             success: true,
//             data: updatedOrder
//         });
//     } catch (error) {
//         console.error('Update error:', error);
//         next(error);
//     }
// };

// In your orderController.js
const updateOrder = async (req, res, next) => {
    try {
      const { orderId } = req.params;
      const updateData = req.body;
  
      // Add validation
      if (!updateData.items || !Array.isArray(updateData.items)) {
        return res.status(400).json({ 
          success: false, 
          message: "Items array is required" 
        });
      }
  
      const updatedOrder = await Order.findOneAndUpdate(
        { 'orderId.orderId': orderId }, // Query by your orderId field
        { $set: updateData },
        { new: true, runValidators: true }
      );
  
      if (!updatedOrder) {
        return res.status(404).json({ 
          success: false, 
          message: "Order not found" 
        });
      }
  
      res.status(200).json({ success: true, data: updatedOrder });
    } catch (error) {
      console.error('Update error:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message,
        validationErrors: error.errors 
      });
    }
  };


const deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate the ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        // Find and delete the order
        const order = await Order.findByIdAndDelete(id);

        // If order not found
        if (!order) {
            const error = createHttpError(404, "Order not found!");
            return next(error);
        }

        // Success response
        res.status(200).json({ success: true, message: "Order deleted successfully!" });
    } catch (error) {
        next(error);
    }
};

module.exports = { addOrder, getOrderById, getOrders, updateOrderStatus, deleteOrder, updateOrder };