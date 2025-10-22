
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

// // Helper to check for valid ID
// const isValidId = (id, entity) => {
//     // IMPROVEMENT: Use 400 for bad format, not 404 for not found
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//         throw createHttpError(400, `Invalid ${entity} ID format!`);
//     }
// };

// ---------------------------------------------------------------------
// Core: Add New Order (Updated for Delivery Logic & Schema Alignment)
// ---------------------------------------------------------------------
// const addOrder = async (req, res, next) => {
//     try {
//         const orderData = req.body;
        
//         // --- 1. Align payload variables to schema paths ---
//         // Assuming customer details are nested in the incoming payload for now.
//         // NOTE: The request structure should align with what is expected here.
//         const { orderType } = orderData;
//         const { phone, name } = orderData.customerDetails || {}; // Destructure nested details
//         const { deliveryBoyId, deliveryAddress } = orderData; // These are top-level fields

//         // 2. Handle Delivery Customer Record Persistence (Upsert Logic)
//         if (orderType === 'Delivery') {
            
//             // --- CRITICAL BUSINESS VALIDATION ---
//             if (!phone || !deliveryAddress || !deliveryBoyId) {
//                 throw createHttpError(400, 'Delivery orders must specify phone, address, and an assigned Delivery Boy ID.');
//             }
//             isValidId(deliveryBoyId, 'DeliveryBoy');

//             // Check if the assigned boy is active (Soft Delete Check)
//             const boy = await DeliveryBoy.findById(deliveryBoyId);
//             if (!boy || !boy.is_active) {
//                 throw createHttpError(400, 'Assigned delivery boy is not active or does not exist.');
//             }

//             // --- Customer Upsert Logic (Uses snapshot data for update) ---
//             // CORRECTION: Removed 'isArchived: false' as it is not in the DeliveryCustomerModel schema.
//             await DeliveryCustomer.findOneAndUpdate(
//                 { phone_number: phone.trim() },
//                 {
//                     $set: {
//                         name: name || 'N/A', // Use the snapshot name
//                         address: deliveryAddress, // Use the snapshot address as the customer's new default
//                     }
//                 },
//                 { upsert: true, new: true, runValidators: true }
//             );

//             // Set a default status for new deliveries
//             if (!orderData.orderStatus) {
//                 orderData.orderStatus = 'In Progress';
//             }
//         }

//         const order = new Order(orderData);
//         await order.save();

//         // 🟢 SOCKET.IO: Emit new order to all connected clients
//         const io = req.app.get("socketio");
//         if (io) {
//              io.emit("orderUpdate", { action: "new_order", data: order }); 
//         }

//         res.status(201).json({ success: true, message: "Order Created!", data: order });
//     } catch (error) {
//         // Handle unique constraint violation for orderId (error.code 11000)
//         if (error.code && error.code === 11000) {
//             return next(createHttpError(400, "Order ID must be unique."));
//         }
//         next(error);
//     }
// };

const addOrder = async (req, res, next) => {
    try {
        console.log('Incoming Order Data:', req.body); // Debug log
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

// ---------------------------------------------------------------------
// Update Order Status
// ---------------------------------------------------------------------
// const updateOrderStatus = async (req, res, next) => {
//     try {
//         const { orderStatus } = req.body;
//         const { id } = req.params;

//         isValidId(id, 'Order');

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


const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderStatus } = req.body;
        const { id } = req.params;
        console.log("🟢 Incoming updateOrderStatus:", { id, orderStatus });

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
        
        // 🟢 SOCKET.IO: Emit general status update
        const io = req.app.get("socketio");
        if (io) {
            io.emit("orderUpdate", { 
                action: "status_changed", 
                orderId: id,
                newStatus: orderStatus,
                data: order
            });
        }

        res.status(200).json({ success: true, message: "Order updated!", data: order });
    } catch (error) {
        next(error);
    }
};

// ---------------------------------------------------------------------
// Update Section Items Ready
// ---------------------------------------------------------------------
// const updateSectionItemsReady = async (req, res, next) => {
//     try {
//         console.log("🟢 Incoming updateSectionItemsReady:", { id: req.params.id, body: req.body });
//         const { section } = req.body; // e.g. "kitchen" or "grill"
//         const orderId = req.params.id;

//         isValidId(orderId, 'Order');

//         const order = await Order.findById(orderId);
//         if (!order) return res.status(404).json({ message: "Order not found" });

//         // 1️⃣ Mark items from this specific section as ready
//         order.items = order.items.map(item =>
//             item.section?.toLowerCase() === section.toLowerCase()
//                 ? { ...item, status: "Ready" }
//                 : item
//         );

//         const allReady = order.items.every(item => {
//             if (!item.section) {
//                 return true;
//             }
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
//                 data: order 
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


// const updateSectionItemsReady = async (req, res, next) => {
//     try {
//         console.log("🟢 Incoming updateSectionItemsReady:", {  body: req.body });
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

const updateSectionItemsReady = async (req, res, next) => {
  try {
    const { section } = req.body;
    const orderId = req.params.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // 1️⃣ Update items for this section
    let sectionUpdated = false;
    order.items.forEach(item => {
      if (item.section?.toLowerCase() === section.toLowerCase()) {
        item.status = "Ready";
        sectionUpdated = true;
      }
    });

    if (!sectionUpdated) {
      return res.status(400).json({ message: `No items found for section: ${section}` });
    }

    // 2️⃣ Check if all items are ready
    const allReady = order.items.every(item => {
      if (!item.section) return true;
      return item.status === "Ready";
    });

    // 3️⃣ Update order status
    order.orderStatus = allReady ? "Ready" : "In Progress";

    await order.save();

    // 🟢 SOCKET.IO: Notify clients
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

    res.status(200).json({
      message: `✅ All ${section} items marked ready. Order status: ${order.orderStatus}`,
      data: order,
    });
  } catch (error) {
    console.error("❌ Error in updateSectionItemsReady:", error);
    next(error);
  }
};

// ---------------------------------------------------------------------
// Update Order (Delivery Boy Reassignment - FIXED FIELD NAME & Logic)
// ---------------------------------------------------------------------
// const updateOrder = async (req, res, next) => {
//     try {
//         const { orderId } = req.params; // Captures the ID from /by-order-id/:orderId
//         const updateData = req.body;
//         let updatedOrder = null;
//         let queryCondition = null;
//         let action = "order_modified";

//         // 1. DETERMINE QUERY TYPE: Mongoose ID vs. Custom ID
        
//         // If the update contains a deliveryBoyId, we MUST query by Mongoose _id, 
//         // and we MUST run the delivery boy validation logic.
//         if (updateData.deliveryBoyId) { 
//             // We assume the user sends the Mongoose _id in the :orderId parameter for this feature.
//             isValidId(orderId, 'Order');
//             queryCondition = { _id: orderId };

//             const order = await Order.findById(orderId);
//             if (!order) throw createHttpError(404, "Order not found");

//             // Enforce Delivery Boy Reassignment Rule
//             if (order.orderStatus !== "In Progress" && order.orderStatus !== "Ready") {
//                 return res.status(403).json({ 
//                     success: false, 
//                     message: `Cannot re-assign delivery boy when order is ${order.orderStatus}. Only allowed in 'In Progress' or 'Ready' status.` 
//                 });
//             }
            
//             // Validate new Delivery Boy ID and active status
//             isValidId(updateData.deliveryBoyId, 'DeliveryBoy');
//             const newBoy = await DeliveryBoy.findById(updateData.deliveryBoyId);
//             if (!newBoy || !newBoy.is_active) {
//                 return res.status(400).json({ success: false, message: 'New assigned delivery boy is not active.' });
//             }
            
//             // Set the update object for reassignment
//             const updateFields = { 
//                 deliveryBoyId: updateData.deliveryBoyId, 
//                 ...(updateData.orderStatus && { orderStatus: updateData.orderStatus }) 
//             };
            
//             // Execute Reassignment Update
//             updatedOrder = await Order.findByIdAndUpdate(
//                 orderId,
//                 updateFields,
//                 { new: true, runValidators: true }
//             ).populate("deliveryBoyId", "name phone"); 
            
//             action = "delivery_boy_changed";
            
//         } else {
//             // 2. FALLBACK TO GENERAL ITEM/FIELD UPDATE (Using Custom ID Query)
            
//             // Re-introduce original validation for items array
//             if (!updateData.items || !Array.isArray(updateData.items)) {
//                 throw createHttpError(400, "Items array is required for general order modifications.");
//             }

//             // Use the original custom query condition
//             queryCondition = { 'orderId.orderId': orderId };
            
//             // Execute General Update
//             updatedOrder = await Order.findOneAndUpdate(
//                 queryCondition,
//                 { $set: updateData },
//                 { new: true, runValidators: true }
//             ).populate("deliveryBoyId", "name phone");
            
//             action = "order_modified";
//         }


//         // 3. POST-UPDATE CHECK
//         if (!updatedOrder) {
//             throw createHttpError(404, "Order not found or custom ID is invalid!");
//         }
        
//         // 4. SOCKET.IO: Emit order modification
//         const io = req.app.get("socketio");
//         if (io) {
//             io.emit("orderUpdate", { 
//                 action: action, 
//                 orderId: updatedOrder._id,
//                 data: updatedOrder
//             });
//         }

//         res.status(200).json({ success: true, data: updatedOrder, message: action === "delivery_boy_changed" ? "Delivery Boy Reassigned!" : "Order updated!" });
//     } catch (error) {
//         console.error('Update error:', error);
//         // Include specific Mongoose validation errors if available
//         next(createHttpError(400, error.message));
//     }
// };




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
        
        // 🟢 SOCKET.IO: Emit order deletion
        const io = req.app.get("socketio");
        if (io) {
            io.emit("orderUpdate", { 
                action: "order_deleted", 
                orderId: id 
            });
        }


        // Success response
        res.status(200).json({ success: true, message: "Order deleted successfully!" });
    } catch (error) {
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

