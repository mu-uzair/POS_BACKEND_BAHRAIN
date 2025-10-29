
// const createHttpError = require("http-errors");
// const Order = require("../models/orderModel");
// const { default: mongoose } = require("mongoose");

// const addOrder = async (req, res, next) => {
//     try {
//         const order = new Order(req.body);
//         await order.save();

//         // 🟢 SOCKET.IO: Emit new order to all connected clients
//         const io = req.app.get("socketio");
//         if (io) {
//              // We emit the full saved order object
//              io.emit("orderUpdate", { action: "new_order", data: order }); 
//         }

//         res.status(201).json({ success: true, message: "Order Created!", data: order });
//     } catch (error) {
//         next(error);
//     }
// };

// const getOrderById = async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             const error = createHttpError(404, "Invalid id!");
//             return next(error);
//         }

//         const order = await Order.findById(id);
//         if (!order) {
//             const error = createHttpError(404, "Order not found!");
//             return next(error);
//         }

//         res.status(200).json({ success: true, data: order });
//     } catch (error) {
//         next(error);
//     }
// };

// const getOrders = async (req, res, next) => {
//     try {
//         const orders = await Order.find().populate("table");
//         res.status(200).json({ data: orders });
//     } catch (error) {
//         next(error);
//     }
// };

// const getOrdersByStatus = async (req, res, next) => {
//     try {
//         const { status } = req.params;

//         // Fetch orders with the given status (case-insensitive)
//         const orders = await Order.find({
//             orderStatus: { $regex: new RegExp(`^${status}$`, "i") },
//         }).populate("table");

//         res.status(200).json({ data: orders });
//     } catch (error) {
//         next(error);
//     }
// };

// const updateSectionItemsReady = async (req, res, next) => {
//     try {
//         const { section } = req.body; // e.g. "kitchen" or "grill"
//         const orderId = req.params.id;

//         const order = await Order.findById(orderId);
//         if (!order) return res.status(404).json({ message: "Order not found" });

//         // 1️⃣ Mark items from this specific section as ready
//         order.items = order.items.map(item =>
//             item.section?.toLowerCase() === section.toLowerCase()
//                 ? { ...item, status: "Ready" }
//                 : item
//         );

//         const allReady = order.items.every(item => {
//             // Check if the item has no section (like drinks, pre-packaged goods). If so, it's 'Ready'.
//             if (!item.section) {
//                 return true;
//             }
//             // Otherwise, check if the item that needs preparation has been marked "Ready".
//             return item.status === "Ready";
//         });

//         // 3️⃣ Set the main order status
//         order.orderStatus = allReady ? "Ready" : "In Progress";

//         await order.save();

//         // 🟢 SOCKET.IO: Emit updated order status
//         const io = req.app.get("socketio");
//         if (io) {
//             io.emit("orderUpdate", { 
//                 action: "items_ready", 
//                 orderId: orderId,
//                 section: section,
//                 newStatus: order.orderStatus,
//                 data: order // Optional: send full order data
//             });
//         }

//         res.status(200).json({
//             message: `All ${section} items marked ready. Order status: ${order.orderStatus}`,
//             data: order,
//         });
//     } catch (error) {
//         next(error);
//     }
// };


// const updateOrderStatus = async (req, res, next) => {
//     try {
//         const { orderStatus } = req.body;
//         const { id } = req.params;

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             const error = createHttpError(404, "Invalid id!");
//             return next(error);
//         }

//         const order = await Order.findByIdAndUpdate(
//             id,
//             { orderStatus },
//             { new: true }
//         );

//         if (!order) {
//             const error = createHttpError(404, "Order not found!");
//             return next(error);
//         }
        
//         // 🟢 SOCKET.IO: Emit general status update
//         const io = req.app.get("socketio");
//         if (io) {
//             io.emit("orderUpdate", { 
//                 action: "status_changed", 
//                 orderId: id,
//                 newStatus: orderStatus,
//                 data: order
//             });
//         }

//         res.status(200).json({ success: true, message: "Order updated!", data: order });
//     } catch (error) {
//         next(error);
//     }
// };

// const updateOrder = async (req, res, next) => {
//     try {
//         const { orderId } = req.params;
//         const updateData = req.body;

//         // Add validation
//         if (!updateData.items || !Array.isArray(updateData.items)) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Items array is required"
//             });
//         }

//         const updatedOrder = await Order.findOneAndUpdate(
//             { 'orderId.orderId': orderId }, // Query by your orderId field
//             { $set: updateData },
//             { new: true, runValidators: true }
//         );

//         if (!updatedOrder) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Order not found"
//             });
//         }
        
//         // 🟢 SOCKET.IO: Emit order modification
//         const io = req.app.get("socketio");
//         if (io) {
//             io.emit("orderUpdate", { 
//                 action: "order_modified", 
//                 orderId: updatedOrder._id,
//                 data: updatedOrder
//             });
//         }

//         res.status(200).json({ success: true, data: updatedOrder });
//     } catch (error) {
//         console.error('Update error:', error);
//         res.status(400).json({
//             success: false,
//             message: error.message,
//             validationErrors: error.errors
//         });
//     }
// };


// const deleteOrder = async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         // Validate the ID
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             const error = createHttpError(404, "Invalid id!");
//             return next(error);
//         }

//         // Find and delete the order
//         const order = await Order.findByIdAndDelete(id);

//         // If order not found
//         if (!order) {
//             const error = createHttpError(404, "Order not found!");
//             return next(error);
//         }
        
//         // 🟢 SOCKET.IO: Emit order deletion
//         const io = req.app.get("socketio");
//         if (io) {
//             io.emit("orderUpdate", { 
//                 action: "order_deleted", 
//                 orderId: id 
//             });
//         }


//         // Success response
//         res.status(200).json({ success: true, message: "Order deleted successfully!" });
//     } catch (error) {
//         next(error);
//     }
// };

// module.exports = { addOrder, getOrderById, getOrders, updateOrderStatus, deleteOrder, updateOrder, getOrdersByStatus, updateSectionItemsReady };


// // Updated Order Controller with Delivery Logic & Fixes

const createHttpError = require("http-errors");
const Order = require("../models/orderModel"); // Assumed updated model
const DeliveryCustomer = require("../models/deliveryCustomerModel"); // New import
const DeliveryBoy = require("../models/DeliveryBoyModel"); // MUST be imported for validation
const { default: mongoose } = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/userModel"); // assuming your users are stored here
const { 
    deductStockForCompletedOrder, 
    performInventoryRollback 
} = require('./Inventory/recipeStockController'); 


const addOrder = async (req, res, next) => {
    try {
        // console.log('Incoming Order Data:', req.body); // Debug log
        const order = new Order(req.body);
        await order.save();

        // 🟢 SOCKET.IO: Emit new order to all connected clients
        const io = req.app.get("socketio");
        if (io) {
             // We emit the full saved order object
             io.emit("orderUpdate", { action: "new_order", data: order }); 
        }

        res.status(201).json({ success: true, message: "Order Created!", data: order });
    } catch (error) {
        next(error);
    }
};


// ---------------------------------------------------------------------
// Fetch Orders (Populate Delivery Boy - FIXED FIELD NAME)
// ---------------------------------------------------------------------
const getOrderById = async (req, res, next) => {
    try {
        const { id } = req.params;
        isValidId(id, 'Order');

        // FIXED: Use "deliveryBoyId" for population
        const order = await Order.findById(id).populate("table").populate("deliveryBoyId", "name phone");
        
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
        // FIXED: Use "deliveryBoyId" for population
        const orders = await Order.find().populate("table").populate("deliveryBoyId", "name phone");
        res.status(200).json({ data: orders });
    } catch (error) {
        next(error);
    }
};

const getOrdersByStatus = async (req, res, next) => {
    try {
        const { status } = req.params;

        const orders = await Order.find({
            orderStatus: { $regex: new RegExp(`^${status}$`, "i") },
        }).populate("table").populate("deliveryBoyId", "name phone"); // FIXED: Use "deliveryBoyId"

        res.status(200).json({ data: orders });
    } catch (error) {
        next(error);
    }
};

const updateOrder = async (req, res, next) => {
    try {
  console.log("✅ updateOrder route hit with orderId:", req.params.orderId);
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
            { orderId: orderId }, // Query by your orderId field
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }
        
        // 🟢 SOCKET.IO: Emit order modification
        const io = req.app.get("socketio");
        if (io) {
            io.emit("orderUpdate", { 
                action: "order_modified", 
                orderId: updatedOrder._id,
                data: updatedOrder
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



// const updateOrderStatus = async (req, res, next) => {
//     try {
//         const { orderStatus } = req.body;
//         const { id } = req.params;
//         console.log("🟢 Incoming updateOrderStatus:", { id, orderStatus });

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             const error = createHttpError(404, "Invalid id!");
//             return next(error);
//         }

//         const order = await Order.findByIdAndUpdate(
//             id,
//             { orderStatus },
//             { new: true }
//         );

//         if (!order) {
//             const error = createHttpError(404, "Order not found!");
//             return next(error);
//         }
        
//         // 🟢 SOCKET.IO: Emit general status update
//         const io = req.app.get("socketio");
//         if (io) {
//             io.emit("orderUpdate", { 
//                 action: "status_changed", 
//                 orderId: id,
//                 newStatus: orderStatus,
//                 data: order
//             });
//         }

//         res.status(200).json({ success: true, message: "Order updated!", data: order });
//     } catch (error) {
//         next(error);
//     }
// };


// const updateOrderStatus = async (req, res, next) => {
//     try {
//         const { orderStatus: newStatus } = req.body; 
//         const { id } = req.params; 
//         const userId = req.user?.id || null; 
//         ;
        
//         // Assuming Order is the model for order data
        
//          console.log("🟢 Incoming updateOrderStatus:", { id, newStatus, userId });

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             const error = createHttpError(404, "Invalid Order ID!");
//             return next(error);
//         }

//         // 1. Fetch the order to determine the CURRENT status (MANDATORY for automation)
//         const order = await Order.findById(id);
//         if (!order) {
//             const error = createHttpError(404, "Order not found!");
//             return next(error);
//         }
        
//         const previousStatus = order.orderStatus;
//         let inventoryActionMessage = "";

//         // 2. Automated Inventory Logic Trigger
        
//         // A. Deduction Trigger: Status changes TO 'Completed' from anything else
//         const isDeductionNeeded = (
//             newStatus === 'Completed' &&
//             previousStatus !== 'Completed'
//         );

//         if (isDeductionNeeded) {
//             try {
//                 // CALLING SERVICE FUNCTION
//                 const txnRecord = await deductStockForCompletedOrder(order, userId);
//                 inventoryActionMessage = ` Inventory deducted (Txn: ${txnRecord._id}).`;
//             } catch (err) {
//                 console.error("Inventory Deduction failed:", err.message);
//                 // Return 409 Conflict if stock deduction failed due to shortage
//                 if (err.statusCode === 409) {
//                      return next(err); 
//                 }
//                 inventoryActionMessage = ` Inventory deduction failed. Please check the transaction logs.`;
//             }
//         }

//         // B. Rollback Trigger: Status changes TO 'Cancelled' FROM 'Completed'
//         const isRollbackNeeded = (
//             newStatus === 'Cancelled' &&
//             previousStatus === 'Completed'
//         );
        
//         if (isRollbackNeeded) {
//             try {
//                 // CALLING SERVICE FUNCTION
//                 const rollbackTxn = await performInventoryRollback(id, userId);
//                 inventoryActionMessage = ` Inventory rolled back (Txn: ${rollbackTxn._id}).`;
//             } catch (err) {
//                 console.error("Rollback failed:", err.message);
//                 // Note: The order status is still updated, but the inventory correction failed.
//                 inventoryActionMessage = ` Inventory rollback failed. Reason: ${err.message}.`;
//             }
//         }
        
//         // 3. Update the Order Status and save
//         order.orderStatus = newStatus;
//         await order.save(); 

//         // 4. SOCKET.IO: Emit general status update
//         // Assuming req.app.get("socketio") is correctly set up
//         const io = req.app.get("socketio");
//         if (io) {
//             io.emit("orderUpdate", { 
//                 action: "status_changed", 
//                 orderId: id,
//                 newStatus: newStatus,
//                 data: order,
//                 inventoryMessage: inventoryActionMessage.trim()
//             });
//         }

//         res.status(200).json({ 
//             success: true, 
//             message: `Order updated to ${newStatus}.${inventoryActionMessage}`, 
//             data: order 
//         });
//     } catch (error) {
//         next(error);
//     }
// };

// const updateOrderStatus = async (req, res, next) => {
//     try {
//         const { orderStatus: newStatus } = req.body; 
//         const { id } = req.params; 
//         const userId = req.user?.id || null; 
        
//         console.log("🟢 Incoming updateOrderStatus:", { id, newStatus, userId });

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             const error = createHttpError(404, "Invalid Order ID!");
//             return next(error);
//         }

//         // 1. Fetch the order
//         const order = await Order.findById(id).populate('items.menuItem');
//         if (!order) {
//             console.log("❌ Order not found!");
//             const error = createHttpError(404, "Order not found!");
//             return next(error);
//         }
        
//         console.log("✅ Order found:", order._id);
//         console.log("📦 Order has", order.items?.length, "items");
        
//         const previousStatus = order.orderStatus;
//         console.log("📊 Previous Status:", previousStatus, "→ New Status:", newStatus);
        
//         let inventoryActionMessage = "";

//         // 2. Check deduction condition
//         const isDeductionNeeded = (
//             newStatus === 'Completed' &&
//             previousStatus !== 'Completed'
//         );

//         console.log("🔍 Is Deduction Needed?", isDeductionNeeded);
//         console.log("   newStatus === 'Completed'?", newStatus === 'Completed');
//         console.log("   previousStatus !== 'Completed'?", previousStatus !== 'Completed');

//         if (isDeductionNeeded) {
//             console.log("🚀 Starting inventory deduction...");
            
//             try {
//                 const txnRecord = await deductStockForCompletedOrder(order, userId);
//                 inventoryActionMessage = ` Inventory deducted (Txn: ${txnRecord._id}).`;
//                 console.log("✅ Inventory deduction successful:", txnRecord._id);
//             } catch (err) {
//                 console.error("❌ Inventory Deduction failed:", err.message);
//                 if (err.statusCode === 409) {
//                      return next(err); 
//                 }
//                 inventoryActionMessage = ` Inventory deduction failed: ${err.message}`;
//             }
//         } else {
//             console.log("⏭️ Skipping inventory deduction");
//         }

//         // 3. Update order status
//         order.orderStatus = newStatus;
//         await order.save(); 
//         console.log("💾 Order status updated to:", newStatus);

//         // 4. Socket emit
//         const io = req.app.get("socketio");
//         if (io) {
//             io.emit("orderUpdate", { 
//                 action: "status_changed", 
//                 orderId: id,
//                 newStatus: newStatus,
//                 data: order,
//                 inventoryMessage: inventoryActionMessage.trim()
//             });
//         }

//         res.status(200).json({ 
//             success: true, 
//             message: `Order updated to ${newStatus}.${inventoryActionMessage}`, 
//             data: order 
//         });
//     } catch (error) {
//         console.error("💥 updateOrderStatus error:", error);
//         next(error);
//     }
// };



// const updateOrderStatus = async (req, res, next) => {
//     try {
//         const { orderStatus: newStatus } = req.body; 
//         const { id } = req.params; 
//         const userId = req.user?.id || null; 
        
//         console.log("🟢 Incoming updateOrderStatus:", { id, newStatus, userId });

//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             const error = createHttpError(404, "Invalid Order ID!");
//             return next(error);
//         }

//         // 1. Fetch the order
//         const order = await Order.findById(id).populate('items.menuItem');
//         if (!order) {
//             console.log("❌ Order not found!");
//             const error = createHttpError(404, "Order not found!");
//             return next(error);
//         }
        
//         console.log("✅ Order found:", order._id);
//         console.log("📦 Order has", order.items?.length, "items");
        
//         const previousStatus = order.orderStatus;
//         console.log("📊 Previous Status:", previousStatus, "→ New Status:", newStatus);
        
//         let inventoryActionMessage = "";

//         // 2. Check if inventory deduction is needed (order completed)
//         const isDeductionNeeded = (
//             newStatus === 'Completed' &&
//             previousStatus !== 'Completed'
//         );

//         // 3. Check if inventory rollback is needed (completed order cancelled)
//         const isRollbackNeeded = (
//             previousStatus === 'Completed' &&
//             (newStatus === 'Cancelled' || newStatus === 'Rejected')
//         );

//         console.log("🔍 Is Deduction Needed?", isDeductionNeeded);
//         console.log("   newStatus === 'Completed'?", newStatus === 'Completed');
//         console.log("   previousStatus !== 'Completed'?", previousStatus !== 'Completed');
        
//         console.log("🔄 Is Rollback Needed?", isRollbackNeeded);
//         console.log("   previousStatus === 'Completed'?", previousStatus === 'Completed');
//         console.log("   newStatus is Cancelled/Rejected?", 
//             newStatus === 'Cancelled' || newStatus === 'Rejected');

//         // 4. Handle inventory deduction
//         if (isDeductionNeeded) {
//             console.log("🚀 Starting inventory deduction...");
            
//             try {
//                 const txnRecord = await deductStockForCompletedOrder(order, userId);
//                 inventoryActionMessage = ` Inventory deducted (Txn: ${txnRecord._id}).`;
//                 console.log("✅ Inventory deduction successful:", txnRecord._id);
//             } catch (err) {
//                 console.error("❌ Inventory Deduction failed:", err.message);
//                 if (err.statusCode === 409) {
//                     return next(err); 
//                 }
//                 inventoryActionMessage = ` Inventory deduction failed: ${err.message}`;
//             }
//         } 
//         // 5. Handle inventory rollback
//         else if (isRollbackNeeded) {
//             console.log("🔄 Starting inventory rollback...");
            
//             try {
//                 const rollbackTxns = await performInventoryRollback(order._id.toString(), userId);
//                 const txnIds = Array.isArray(rollbackTxns) 
//                     ? rollbackTxns.map(t => t._id).join(', ')
//                     : rollbackTxns._id;
//                 inventoryActionMessage = ` Inventory rolled back (Txns: ${txnIds}).`;
//                 console.log("✅ Inventory rollback successful:", txnIds);
//             } catch (err) {
//                 console.error("❌ Inventory Rollback failed:", err.message);
//                 // Don't block cancellation if rollback fails, just log it
//                 inventoryActionMessage = ` Warning: Inventory rollback failed: ${err.message}`;
//             }
//         } 
//         else {
//             console.log("⏭️ No inventory action needed");
//         }

//         // 6. Update order status
//         order.orderStatus = newStatus;
//         await order.save(); 
//         console.log("💾 Order status updated to:", newStatus);

//         // 7. Socket emit
//         const io = req.app.get("socketio");
//         if (io) {
//             io.emit("orderUpdate", { 
//                 action: "status_changed", 
//                 orderId: id,
//                 newStatus: newStatus,
//                 previousStatus: previousStatus,
//                 data: order,
//                 inventoryMessage: inventoryActionMessage.trim()
//             });
//         }

//         res.status(200).json({ 
//             success: true, 
//             message: `Order updated to ${newStatus}.${inventoryActionMessage}`, 
//             data: order 
//         });
//     } catch (error) {
//         console.error("💥 updateOrderStatus error:", error);
//         next(error);
//     }
// };


const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderStatus: newStatus } = req.body; 
        const { id } = req.params; 
        const userId = req.user?.id || null; 
        
        console.log("🟢 Incoming updateOrderStatus:", { id, newStatus, userId });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid Order ID!");
            return next(error);
        }

        // 1. Fetch the order
        const order = await Order.findById(id).populate('items.menuItem');
        if (!order) {
            console.log("❌ Order not found!");
            const error = createHttpError(404, "Order not found!");
            return next(error);
        }
        
        console.log("✅ Order found:", order._id);
        console.log("📦 Order has", order.items?.length, "items");
        
        const previousStatus = order.orderStatus;
        console.log("📊 Previous Status:", previousStatus, "→ New Status:", newStatus);
        
        let inventoryActionMessage = "";

        // 2. Check if inventory deduction is needed (order completed)
        const isDeductionNeeded = (
            newStatus === 'Completed' &&
            previousStatus !== 'Completed'
        );

        // 3. Check if inventory rollback is needed (completed order cancelled)
        const isRollbackNeeded = (
            previousStatus === 'Completed' &&
            (newStatus === 'Cancelled' || newStatus === 'Rejected')
        );

        console.log("🔍 Is Deduction Needed?", isDeductionNeeded);
        console.log("   newStatus === 'Completed'?", newStatus === 'Completed');
        console.log("   previousStatus !== 'Completed'?", previousStatus !== 'Completed');
        
        console.log("🔄 Is Rollback Needed?", isRollbackNeeded);
        console.log("   previousStatus === 'Completed'?", previousStatus === 'Completed');
        console.log("   newStatus is Cancelled/Rejected?", 
            newStatus === 'Cancelled' || newStatus === 'Rejected');

        // 4. Handle inventory deduction
        if (isDeductionNeeded) {
            console.log("🚀 Starting inventory deduction...");
            console.log("   Order object _id:", order._id);
            console.log("   Order object _id type:", typeof order._id);
            
            try {
                const txnRecord = await deductStockForCompletedOrder(order, userId);
                inventoryActionMessage = ` Inventory deducted (Txn: ${txnRecord._id}).`;
                console.log("✅ Inventory deduction successful:", txnRecord._id);
            } catch (err) {
                console.error("❌ Inventory Deduction failed:", err.message);
                if (err.statusCode === 409) {
                    return next(err); 
                }
                inventoryActionMessage = ` Inventory deduction failed: ${err.message}`;
            }
        } 
        // 5. Handle inventory rollback
        else if (isRollbackNeeded) {
            console.log("🔄 Starting inventory rollback...");
            console.log("   Passing order._id:", order._id);
            console.log("   As string:", order._id.toString());
            
            try {
                const rollbackTxns = await performInventoryRollback(order._id.toString(), userId);
                const txnIds = Array.isArray(rollbackTxns) 
                    ? rollbackTxns.map(t => t._id).join(', ')
                    : rollbackTxns._id;
                inventoryActionMessage = ` Inventory rolled back (Txns: ${txnIds}).`;
                console.log("✅ Inventory rollback successful:", txnIds);
            } catch (err) {
                console.error("❌ Inventory Rollback failed:", err.message);
                console.error("   Full error:", err);
                // Don't block cancellation if rollback fails, just log it
                inventoryActionMessage = ` Warning: Inventory rollback failed: ${err.message}`;
            }
        } 
        else {
            console.log("⏭️ No inventory action needed");
        }

        // 6. Update order status
        order.orderStatus = newStatus;
        await order.save(); 
        console.log("💾 Order status updated to:", newStatus);

        // 7. Socket emit
        const io = req.app.get("socketio");
        if (io) {
            io.emit("orderUpdate", { 
                action: "status_changed", 
                orderId: id,
                newStatus: newStatus,
                previousStatus: previousStatus,
                data: order,
                inventoryMessage: inventoryActionMessage.trim()
            });
        }

        res.status(200).json({ 
            success: true, 
            message: `Order updated to ${newStatus}.${inventoryActionMessage}`, 
            data: order 
        });
    } catch (error) {
        console.error("💥 updateOrderStatus error:", error);
        next(error);
    }
};



// const updateSectionItemsReady = async (req, res, next) => {
//   try {
//     const { section } = req.body;
//     const orderId = req.params.id;

//     const order = await Order.findById(orderId);
//     if (!order) return res.status(404).json({ message: "Order not found" });

//     // 1️⃣ Update items for this section
//     let sectionUpdated = false;
//     order.items.forEach(item => {
//       if (item.section?.toLowerCase() === section.toLowerCase()) {
//         item.status = "Ready";
//         sectionUpdated = true;
//       }
//     });

//     if (!sectionUpdated) {
//       return res.status(400).json({ message: `No items found for section: ${section}` });
//     }

//     // 2️⃣ Check if all items are ready
//     const allReady = order.items.every(item => {
//       if (!item.section) return true;
//       return item.status === "Ready";
//     });

//     // 3️⃣ Update order status
//     order.orderStatus = allReady ? "Ready" : "In Progress";

//     await order.save();

//     // 🟢 SOCKET.IO: Notify clients
//     const io = req.app.get("socketio");
//     if (io) {
//       io.emit("orderUpdate", {
//         action: "items_ready",
//         orderId: orderId,
//         section: section,
//         newStatus: order.orderStatus,
//         data: order,
//       });
//     }

//     res.status(200).json({
//       message: `✅ All ${section} items marked ready. Order status: ${order.orderStatus}`,
//       data: order,
//     });
//   } catch (error) {
//     console.error("❌ Error in updateSectionItemsReady:", error);
//     next(error);
//   }
// };


const updateSectionItemsReady = async (req, res, next) => {
  try {
    const { section } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 1️⃣ Update items for this section
    let sectionUpdated = false;
    order.items.forEach((item) => {
      if (item.section?.toLowerCase() === section.toLowerCase()) {
        item.status = "Ready";
        sectionUpdated = true;
      }
    });

    if (!sectionUpdated) {
      return res
        .status(400)
        .json({ message: `No items found for section: ${section}` });
    }

    // 2️⃣ Check if all items are ready
    const allReady = order.items.every((item) => {
      if (!item.section) return true;
      return item.status === "Ready";
    });

    // 3️⃣ Update order status
    order.orderStatus = allReady ? "Ready" : "In Progress";

    // ⚠️ Tell Mongoose we changed a nested array (important!)
    order.markModified("items");

    // 4️⃣ Save order
    await order.save();

    // 5️⃣ Wait a tiny bit before notifying (lets DB commit properly)
    setTimeout(() => {
      const io = req.app.get("socketio");
      if (io) {
        io.emit("orderUpdate", {
          action: "items_ready",
          orderId: orderId,
          section: section,
          newStatus: order.orderStatus,
          data: order,
        });
      }
    }, 300); // 300ms delay is enough

    // 6️⃣ Respond to client
    res.status(200).json({
      message: `✅ All ${section} items marked ready. Order status: ${order.orderStatus}`,
      data: order,
    });
  } catch (error) {
    console.error("❌ Error in updateSectionItemsReady:", error);
    next(error);
  }
};



// const deleteOrder = async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         isValidId(id, 'Order');

//         // Find and delete the order
//         const order = await Order.findByIdAndDelete(id);

//         if (!order) {
//             const error = createHttpError(404, "Order not found!");
//             return next(error);
//         }
        
//         // 🟢 SOCKET.IO: Emit order deletion
//         const io = req.app.get("socketio");
//         if (io) {
//             io.emit("orderUpdate", { 
//                 action: "order_deleted", 
//                 orderId: id 
//             });
//         }

//         res.status(200).json({ success: true, message: "Order deleted successfully!" });
//     } catch (error) {
//         next(error);
//     }
// };

// const deleteOrder = async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         // Validate the ID
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             const error = createHttpError(404, "Invalid id!");
//             return next(error);
//         }

//         // Find and delete the order
//         const order = await Order.findByIdAndDelete(id);

//         // If order not found
//         if (!order) {
//             const error = createHttpError(404, "Order not found!");
//             return next(error);
//         }
        
//         // 🟢 SOCKET.IO: Emit order deletion
//         const io = req.app.get("socketio");
//         if (io) {
//             io.emit("orderUpdate", { 
//                 action: "order_deleted", 
//                 orderId: id 
//             });
//         }


//         // Success response
//         res.status(200).json({ success: true, message: "Order deleted successfully!" });
//     } catch (error) {
//         next(error);
//     }
// };

//  settign up password for the nonadmin users



// DELETE ORDER CONTROLLER
const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const user = req.user;

    console.log("🧩 DELETE ORDER DEBUG START 🧩");
    console.log("Order ID:", id);
    console.log("User:", user);
    console.log("Password received:", password ? "✅ yes" : "❌ no");

    // 🔹 Validate order ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      // console.log("❌ Invalid order ID");
      return next(createHttpError(400, "Invalid order ID."));
    }

    // 🔹 Check if order exists
    const order = await Order.findById(id);
    if (!order) {
      // console.log("❌ Order not found");
      return next(createHttpError(404, "Order not found."));
    }

    // 🔹 Normalize user role
    const userRole = user.role?.toLowerCase?.();
    // console.log("User Role Normalized:", userRole);

    // 🔹 ADMIN — direct delete
    if (userRole === "admin") {
      // console.log("🟢 Admin detected — deleting directly");

      await Order.findByIdAndDelete(id);
      const io = req.app.get("socketio");
      if (io) io.emit("orderUpdate", { action: "order_deleted", orderId: id });

      return res.json({ success: true, message: "Order deleted by admin." });
    }

    // 🔹 NON-ADMIN — must verify password
    // console.log("🟡 Non-admin detected — verifying password...");

    if (!password) {
      // console.log("❌ No password provided");
      return next(createHttpError(400, "Admin password required."));
    }

    // 🔹 Find admin user
    const adminUser = await User.findOne({ role: { $regex: /^admin$/i } });
    console.log("Admin found:", adminUser?.email || "❌ none");

    if (!adminUser) {
      // console.log("❌ No admin user found in DB");
      return next(createHttpError(404, "Admin account not found."));
    }

    // 🔹 Compare password
    const isValidPassword = await bcrypt.compare(password, adminUser.password);
    // console.log("Password valid:", isValidPassword);

    // 🚫 Wrong password → stop immediately
    if (!isValidPassword) {
      // console.log("❌ WRONG PASSWORD — stopping here!");
      return next(createHttpError(401, "Invalid admin password."));
    }

    // ✅ Safe delete path (only if admin OR password verified)
    // console.log("✅ Password verified — deleting order now...");
    await Order.findByIdAndDelete(id);

    const io = req.app.get("socketio");
    if (io) io.emit("orderUpdate", { action: "order_deleted", orderId: id });

    // console.log("🟢 Order deleted successfully");

    return res.status(200).json({
      success: true,
      message: "Order deleted after admin password verification.",
    });
  } catch (error) {
    console.log("❌ ERROR in deleteOrder:", error);
    next(error);
  }
};



// PATCH: Assign or change the delivery boy for an order
const assignDeliveryBoyToOrder = async (req, res, next) => {
  try {
    const { id } = req.params; // Order ID
    const { deliveryBoyId } = req.body;

    if (!deliveryBoyId) {
      throw createHttpError(400, "Delivery Boy ID is required.");
    }

    // Check if delivery boy exists and is active (optional)
    const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);
    if (!deliveryBoy) {
      throw createHttpError(404, "Delivery boy not found.");
    }

    // Update the order’s deliveryBoyId field
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { deliveryBoyId },
      { new: true }
    ).populate("deliveryBoyId", "name phone");

    if (!updatedOrder) {
      throw createHttpError(404, "Order not found.");
    }

    res.status(200).json({
      success: true,
      message: "Delivery boy assigned successfully!",
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { addOrder, getOrderById, getOrders, updateOrderStatus, deleteOrder, updateOrder, getOrdersByStatus, updateSectionItemsReady, assignDeliveryBoyToOrder };



// const createHttpError = require("http-errors");
// const Order = require("../models/orderModel");
// const DeliveryCustomer = require("../models/deliveryCustomerModel");
// const DeliveryBoy = require("../models/DeliveryBoyModel");
// const mongoose = require("mongoose");

// const isValidId = (id, entity) => {
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw createHttpError(400, `Invalid ${entity} ID format!`);
//   }
// };

// const addOrder = async (req, res, next) => {
//   try {
//     const incomingOrderData = req.body;

//     // ✅ Extract clean values
//     const orderType = incomingOrderData.customerDetails?.orderType || "Dine-In";
//     const customerPhone = incomingOrderData.customerDetails?.phone?.trim();
//     const customerName = incomingOrderData.customerDetails?.name?.trim() || "N/A";
//     const deliveryAddress = incomingOrderData.deliveryAddress?.trim() || "";
//     const deliveryBoyId = incomingOrderData.deliveryBoyId || null;
//     const items = incomingOrderData.items || [];

//     // ✅ Validate core fields
//     if (!items.length) {
//       throw createHttpError(400, "Order must contain items.");
//     }

//     if (orderType === "Delivery") {
//       if (!customerPhone || !deliveryAddress || !deliveryBoyId) {
//         throw createHttpError(
//           400,
//           "Delivery orders must include customer phone, address, and deliveryBoyId."
//         );
//       }

//       // ✅ Validate DeliveryBoy
//       isValidId(deliveryBoyId, "DeliveryBoy");
//       const boy = await DeliveryBoy.findById(deliveryBoyId);
//       if (!boy || !boy.is_active) {
//         throw createHttpError(
//           400,
//           "Assigned delivery boy does not exist or is inactive."
//         );
//       }

//       // ✅ UPSERT Delivery Customer
//       await DeliveryCustomer.findOneAndUpdate(
//         { phone_number: customerPhone },
//         {
//           $set: {
//             name: customerName,
//             address: deliveryAddress,
//           },
//         },
//         { upsert: true, new: true, runValidators: true }
//       );
//     }

//     // ✅ Flatten orderId (since frontend sends { orderId: { orderId: "..." } })
//     const flatOrderId =
//       typeof incomingOrderData.orderId === "object"
//         ? incomingOrderData.orderId.orderId
//         : incomingOrderData.orderId || Date.now().toString();

//     // ✅ Build final order payload for Mongo
//     const finalOrderData = {
//       ...incomingOrderData,
//       orderId: flatOrderId,
//       orderStatus: incomingOrderData.orderStatus || "In Progress",
//       customerDetails: {
//         name: customerName,
//         phone: customerPhone,
//         guests: incomingOrderData.customerDetails?.guests || 0,
//         orderType,
//       },
//     };

//     const newOrder = new Order(finalOrderData);
//     await newOrder.save();

//     // ✅ Emit via Socket.IO
//     const io = req.app.get("socketio");
//     if (io) io.emit("orderUpdate", { action: "new_order", data: newOrder });

//     res.status(201).json({
//       success: true,
//       message: "Order created successfully!",
//       data: newOrder,
//     });
//   } catch (error) {
//     if (error.code === 11000) {
//       return next(createHttpError(400, "Order ID must be unique."));
//     }
//     next(error);
//   }
// };

// module.exports = { addOrder };

