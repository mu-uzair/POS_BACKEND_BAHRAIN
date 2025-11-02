// controllers/Inventory/recipeStockController.js
const Dish = require('../../models/dishesModel');
const Product = require('../../models/Inventory/productModel');

const DishRecipe = require('../../models/Inventory/dishRecipeModel');
const RecipeTransaction = require('../../models/Inventory/recipeTransactionModel');
const Transaction = require('../../models/Inventory/transactionModel'); // existing (optional per-product logs)
const createHttpError = require('http-errors');
const mongoose = require('mongoose');

/**
 * Adjust stock by recipe:
 *   - recipeId: DishRecipe _id
 *   - qtyOfDishes: number of dish units to deduct (e.g. 3)
 *   - options: { detailedLogging: boolean, notes: string, createdBy: userId }
 */
const adjustStockByRecipe = async (req, res, next) => {

  console.log("🔧 adjustStockByRecipe called");
  try {
    const { id: recipeId } = req.params;
    const { qtyOfDishes = 1, detailedLogging = false, notes } = req.body;
    const createdBy = req.user?.id || null; // depends on your auth middleware

    if (!recipeId) throw createHttpError(400, 'recipeId required');
    if (!qtyOfDishes || qtyOfDishes <= 0) throw createHttpError(400, 'qtyOfDishes must be > 0');

    // Load recipe with ingredient product refs
    const recipe = await DishRecipe.findById(recipeId).populate('ingredients.productId', 'name unit').populate('dishId', 'dishName');
    if (!recipe) throw createHttpError(404, 'Dish recipe not found');

    // Build per-product deductions
    const productsToAdjust = recipe.ingredients.map(ing => {
      const qty = Number(ing.quantityUsed) * Number(qtyOfDishes);
      return {
        productId: ing.productId._id,
        productName: ing.productId.name,
        unit: ing.productId.unit,
        qtyToDeduct: Number(Number(qty).toFixed(6)) // keep precision
      };
    });

    // Attempt to do atomic updates per product.
    // We will collect results and if ANY fails due to insufficient stock, we will rollback what we modified.
    const modifiedProducts = []; // track successful changes for rollback if any

    for (const p of productsToAdjust) {
      const result = await Product.updateOne(
        {
          _id: p.productId,
          quantity_in_stock: { $gte: p.qtyToDeduct }
        },
        {
          $inc: { quantity_in_stock: -p.qtyToDeduct }
        }
      );

      if (result.matchedCount === 0) {
        // Insufficient stock or product missing — rollback previous changes
        if (modifiedProducts.length > 0) {
          // revert previous partial adjustments
          const revertPromises = modifiedProducts.map(mp =>
            Product.updateOne({ _id: mp.productId }, { $inc: { quantity_in_stock: mp.qtyToDeduct } })
          );
          await Promise.all(revertPromises);
        }
        throw createHttpError(409, `Insufficient stock for product ${p.productName}`);
      }

      modifiedProducts.push(p);
    }
// FIX: Access dishName directly, and if it falls back to the ID object, ensure we toString() the _id
        let dishName = recipe.dishId?.dishName;

        if (!dishName && typeof recipe.dishId === 'object' && recipe.dishId._id) {
            // Fallback to ID string if name is missing but object is populated
            dishName = recipe.dishId._id.toString();
        } else if (!dishName) {
            // Fallback to raw ID string if not populated
            dishName = recipe.dishId;
        }

        const finalRecipeName = `${dishName} - ${recipe.variationName || ''}`.trim();
    // Create recipe-level transaction record
    const recipeTransaction = new RecipeTransaction({
      recipeId: recipe._id,
    //   recipeName: `${recipe.dishId?.dishName || recipe.dishId} - ${recipe.variationName || ''}`.trim(),
      recipeName: finalRecipeName,
      dishId: recipe.dishId,
      variationName: recipe.variationName,
      quantityOfDishes: qtyOfDishes,
      productsAdjusted: productsToAdjust.map(p => ({
        productId: p.productId,
        productName: p.productName,
        qtyChanged: p.qtyToDeduct,
        unit: p.unit
      })),
      type: 'out',
      notes: notes || `Stock out by recipe ${recipe._id}`,
      createdBy
    });
    await recipeTransaction.save();

    // Optionally create individual product transactions for audit (if detailedLogging true)
    if (detailedLogging) {
      const prodTransDocs = modifiedProducts.map(mp => ({
        productId: mp.productId,
        productName: mp.productName,
        vendorName: '', // optional: get vendor if you want
        type: 'out',
        quantity: mp.qtyToDeduct,
        date: new Date(),
        unitCost: undefined,
        notes: `Stock removed by recipe (${recipeTransaction._id})`
      }));
      if (prodTransDocs.length) {
        await Transaction.insertMany(prodTransDocs);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Stock adjusted by recipe successfully',
      data: { recipeTransactionId: recipeTransaction._id }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Rollback recipe transaction (admin-only)
 * - re-add product quantities back to product stock
 * - create rollback record or mark original txn as rolledBack
 */
const rollbackRecipeStock = async (req, res, next) => {
  try {
    const { id: recipeTxnId } = req.params; // recipe transaction id
    const createdBy = req.user?.id || null;

    const txn = await RecipeTransaction.findById(recipeTxnId);
    if (!txn) throw createHttpError(404, 'Recipe transaction not found');

    if (txn.rollbackOf) {
      throw createHttpError(400, 'This transaction is already a rollback or is rollback of another');
    }

    // Re-add all products
    const revertPromises = txn.productsAdjusted.map(p =>
      Product.updateOne({ _id: p.productId }, { $inc: { quantity_in_stock: p.qtyChanged } })
    );
    await Promise.all(revertPromises);

    // Create a rollback recipe transaction record
    const rollbackTxn = new RecipeTransaction({
      recipeId: txn.recipeId,
      recipeName: txn.recipeName,
      dishId: txn.dishId,
      variationName: txn.variationName,
      quantityOfDishes: -txn.quantityOfDishes,
      productsAdjusted: txn.productsAdjusted.map(p => ({
        productId: p.productId,
        productName: p.productName,
        qtyChanged: -p.qtyChanged,
        unit: p.unit
      })),
      type: 'in',
      notes: `Rollback of recipe transaction ${txn._id}`,
      createdBy,
      rollbackOf: txn._id
    });
    await rollbackTxn.save();

    // mark original txn (we could set a flag; here we add a field)
    txn.notes = (txn.notes || '') + ' | Rolled back';
    await txn.save();

    res.status(200).json({
      success: true,
      message: 'Rollback completed',
      data: rollbackTxn
    });
  } catch (err) {
    next(err);
  }
};
// ----------------------------------------------------------------
// CORE INVENTORY HELPER FUNCTIONS (FOR ORDER AUTOMATION)
// ----------------------------------------------------------------

/**
 * Deducts product stock based on the recipes used in a completed order.
 * Creates a RecipeTransaction record tied to the Order ID.
 * NOTE: Uses item.menuItem (dishId) to find the DishRecipe document.
 */
// const deductStockForCompletedOrder = async (order, createdBy) => {
//     const adjustments = new Map(); // Key: productId, Value: totalQtyChange
//     const productsForTransaction = new Map(); // Key: productId, Value: {name, unit}

//     // 1. Calculate the total required stock adjustments
//     for (const item of order.items) {
//         const dishId = item.menuItem; 
//         // Find the recipe using DishRecipe model and the dishId field
//         const recipe = await DishRecipe.findOne({ dishId: dishId }); 
        
//         if (!recipe) {
//             console.warn(`DishRecipe not found for dish ID: ${dishId}. Skipping inventory deduction for this item.`);
//             continue;
//         }

//         // Fetch product details outside the loop for efficiency (or assume populated if desired)
//         // We will fetch them inside the inner loop for simplicity here as done in the previous step
        
//         for (const ingredient of recipe.ingredients) {
//             const productId = ingredient.productId.toString();
            
//             // Using ingredient.quantityUsed * item.quantity (dishes sold)
//             const qtyRequired = ingredient.quantityUsed * item.quantity;
//             const qtyChange = -qtyRequired; // Stock is DEDUCTED, so change is negative

//             // Aggregate adjustments
//             const currentQty = adjustments.get(productId) || 0;
//             adjustments.set(productId, currentQty + qtyChange);
            
//             // Store product details for the transaction record
//             if (!productsForTransaction.has(productId)) {
//                 const product = await Product.findById(productId);
//                 productsForTransaction.set(productId, { name: product?.name, unit: product?.unit });
//             }
//         }
//     }

//     // 2. Apply stock deductions and prepare transaction data
//     const productsAdjusted = [];
//     const stockUpdatePromises = [];
//     const modifiedProducts = [];

//     for (const [productId, qtyChanged] of adjustments.entries()) {
//         const productDetails = productsForTransaction.get(productId);
        
//         // Use an atomic update to deduct stock
//         const updatePromise = Product.updateOne(
//             { 
//                 _id: productId,
//                 // Add check to ensure stock is sufficient before proceeding
//                 quantity_in_stock: { $gte: Math.abs(qtyChanged) } 
//             },
//             { $inc: { quantity_in_stock: qtyChanged } } // qtyChanged is negative
//         ).then(result => {
//             if (result.matchedCount === 0) {
//                  // Throwing an error here prevents the promise chain from resolving successfully
//                  throw createHttpError(409, `Insufficient stock for product ${productDetails.name}. Stock required: ${Math.abs(qtyChanged)}`);
//             }
//             modifiedProducts.push({ productId, qtyChanged });
//             return result;
//         });
//         stockUpdatePromises.push(updatePromise);

//         // Prepare transaction array (product details are now available from productsForTransaction)
//         productsAdjusted.push({
//             productId,
//             productName: productDetails.name,
//             qtyChanged,
//             unit: productDetails.unit 
//         });
//     }

//     try {
//         await Promise.all(stockUpdatePromises);
//     } catch (e) {
//         // If a promise failed (due to stock error above), we must rollback partial changes
//         if (modifiedProducts.length > 0) {
//             const revertPromises = modifiedProducts.map(mp =>
//                 Product.updateOne({ _id: mp.productId }, { $inc: { quantity_in_stock: -mp.qtyChanged } })
//             );
//             await Promise.all(revertPromises);
//         }
//         throw e; // Re-throw the original error to be caught by the Order Controller
//     }

//     // 3. Create a single RecipeTransaction record for the order
//     const recipeTxn = new RecipeTransaction({
//         orderId: order._id.toString(), 
//         recipeName: `Order Fulfillment for Order ${order.orderId}`,
//         quantityOfDishes: order.items.reduce((sum, item) => sum + item.quantity, 0),
//         productsAdjusted: productsAdjusted,
//         type: 'out', // Stock moved OUT
//         notes: `Automated stock deduction for completed order ${order._id}.`,
//         createdBy,
//     });
//     await recipeTxn.save();

//     return recipeTxn;
// };


// correctly working but changing the code for the roll back function
// const deductStockForCompletedOrder = async (order, createdBy) => {
//     console.log("🔧 deductStockForCompletedOrder called");
//     console.log("Order ID:", order._id);
//     console.log("Order Items:", order.items);
    
//     const adjustments = new Map();
//     const productsForTransaction = new Map();
//     const recipeTransactions = []; // Array to store individual dish transactions

//     // 1. Process each item in the order
//     for (const item of order.items) {
//         const dishId = item.menuItem; // This is the actual dishId
//         console.log("🍽️ Processing dish:", dishId, "- Name:", item.name, "- Variation:", item.variationName);
        
//         // Find the recipe using the dishId
//         const recipe = await DishRecipe.findOne({ dishId: dishId }); 
        
//         if (!recipe) {
//             console.warn(`⚠️ DishRecipe not found for dish ID: ${dishId}. Skipping inventory deduction for this item.`);
//             continue;
//         }
        
//         console.log("📋 Recipe found:", recipe._id, "Ingredients:", recipe.ingredients.length);

//         // Track products adjusted for THIS specific dish
//         const dishProductsAdjusted = [];
        
//         for (const ingredient of recipe.ingredients) {
//             const productId = ingredient.productId.toString();
            
//             // Calculate quantity required for this item
//             const qtyRequired = ingredient.quantityUsed * item.quantity;
//             const qtyChange = -qtyRequired; // Negative because stock is deducted

//             // Aggregate adjustments for atomic update
//             const currentQty = adjustments.get(productId) || 0;
//             adjustments.set(productId, currentQty + qtyChange);
            
//             // Store product details
//             if (!productsForTransaction.has(productId)) {
//                 const product = await Product.findById(productId);
//                 console.log(`  ℹ️ Product: ${product?.name}, Current stock: ${product?.quantity_in_stock}`);
//                 productsForTransaction.set(productId, { name: product?.name, unit: product?.unit });
//             }

//             // Track for this dish's transaction
//             const productDetails = productsForTransaction.get(productId);
//             dishProductsAdjusted.push({
//                 productId,
//                 productName: productDetails.name,
//                 qtyChanged: qtyRequired, // Positive value for the record
//                 unit: productDetails.unit
//             });
//         }

//         // Prepare transaction for this specific dish
//         recipeTransactions.push({
//             dishId: dishId,
//             recipeId: recipe._id,
//             recipeName: `${item.name} - ${item.variationName || 'Standard'}`,
//             variationName: item.variationName,
//             quantityOfDishes: item.quantity,
//             productsAdjusted: dishProductsAdjusted
//         });
//     }

//     console.log("📊 Total unique products to adjust:", adjustments.size);
//     console.log("📝 Individual dish transactions to create:", recipeTransactions.length);

//     // 2. Apply stock deductions atomically
//     const modifiedProducts = [];

//     for (const [productId, qtyChanged] of adjustments.entries()) {
//         const productDetails = productsForTransaction.get(productId);
        
//         console.log(`🔄 Deducting ${Math.abs(qtyChanged)} from ${productDetails.name}`);
        
//         // Atomic update with stock validation
//         const result = await Product.updateOne(
//             { 
//                 _id: productId,
//                 quantity_in_stock: { $gte: Math.abs(qtyChanged) } 
//             },
//             { $inc: { quantity_in_stock: qtyChanged } }
//         );
        
//         console.log(`  Result for ${productDetails.name}:`, result);
        
//         if (result.matchedCount === 0) {
//             console.error(`❌ Insufficient stock for ${productDetails.name}`);
            
//             // Rollback all previous changes
//             if (modifiedProducts.length > 0) {
//                 console.log("↩️ Rolling back previous changes...");
//                 const revertPromises = modifiedProducts.map(mp =>
//                     Product.updateOne({ _id: mp.productId }, { $inc: { quantity_in_stock: -mp.qtyChanged } })
//                 );
//                 await Promise.all(revertPromises);
//                 console.log("↩️ Rollback complete");
//             }
            
//             throw createHttpError(409, 
//                 `Insufficient stock for product ${productDetails.name}. Required: ${Math.abs(qtyChanged)}`
//             );
//         }
        
//         modifiedProducts.push({ productId, qtyChanged });
//     }

//     console.log("✅ All stock updates successful");

//     // 3. Create RecipeTransaction records for each dish in the order
//     const savedTransactions = [];
    
//     for (const txnData of recipeTransactions) {
//         const recipeTxn = new RecipeTransaction({
//             orderId: order._id.toString(),
//             dishId: txnData.dishId, // Required field with actual dishId
//             recipeId: txnData.recipeId,
//             recipeName: txnData.recipeName,
//             variationName: txnData.variationName,
//             quantityOfDishes: txnData.quantityOfDishes,
//             productsAdjusted: txnData.productsAdjusted,
//             type: 'out',
//             notes: `Stock deduction for Order ${order.orderId} - ${txnData.recipeName}`,
//             createdBy
//         });
        
//         await recipeTxn.save();
//         savedTransactions.push(recipeTxn);
//         console.log("💾 RecipeTransaction saved:", recipeTxn._id, "for dish:", txnData.recipeName);
//     }

//     console.log(`✅ Created ${savedTransactions.length} transaction record(s)`);
    
//     // Return the first transaction (or you could return all)
//     return savedTransactions[0];
// };


const deductStockForCompletedOrder = async (order, createdBy) => {
    console.log("🔧 deductStockForCompletedOrder called");
    console.log("Order ID:", order._id);
    console.log("Order ID toString:", order._id?.toString());
    console.log("Order Items:", order.items);
    
    // Ensure we have a valid order ID
    if (!order._id) {
        throw createHttpError(400, "Order ID is required for inventory deduction");
    }
    
    const orderIdString = order._id.toString();
    
    const adjustments = new Map();
    const productsForTransaction = new Map();
    const recipeTransactions = []; // Array to store individual dish transactions
    
    console.log("📝 OrderId captured:", orderIdString);

    // 1. Process each item in the order
    for (const item of order.items) {
        const dishId = item.menuItem; // This is the actual dishId
        console.log("🍽️ Processing dish:", dishId, "- Name:", item.name, "- Variation:", item.variationName);
        
        // Find the recipe using the dishId
        const recipe = await DishRecipe.findOne({ dishId: dishId }); 
        
        if (!recipe) {
            console.warn(`⚠️ DishRecipe not found for dish ID: ${dishId}. Skipping inventory deduction for this item.`);
            continue;
        }
        
        console.log("📋 Recipe found:", recipe._id, "Ingredients:", recipe.ingredients.length);

        // Track products adjusted for THIS specific dish
        const dishProductsAdjusted = [];
        
        for (const ingredient of recipe.ingredients) {
            const productId = ingredient.productId.toString();
            
            // Calculate quantity required for this item
            const qtyRequired = ingredient.quantityUsed * item.quantity;
            const qtyChange = -qtyRequired; // Negative because stock is deducted

            // Aggregate adjustments for atomic update
            const currentQty = adjustments.get(productId) || 0;
            adjustments.set(productId, currentQty + qtyChange);
            
            // Store product details
            if (!productsForTransaction.has(productId)) {
                const product = await Product.findById(productId);
                console.log(`  ℹ️ Product: ${product?.name}, Current stock: ${product?.quantity_in_stock}`);
                productsForTransaction.set(productId, { name: product?.name, unit: product?.unit });
            }

            // Track for this dish's transaction
            const productDetails = productsForTransaction.get(productId);
            dishProductsAdjusted.push({
                productId,
                productName: productDetails.name,
                qtyChanged: qtyRequired, // Positive value for the record
                unit: productDetails.unit
            });
        }

        // Prepare transaction for this specific dish
        recipeTransactions.push({
            dishId: dishId,
            recipeId: recipe._id,
            recipeName: `${item.name} - ${item.variationName || 'Standard'}`,
            variationName: item.variationName,
            quantityOfDishes: item.quantity,
            productsAdjusted: dishProductsAdjusted
        });
    }

    console.log("📊 Total unique products to adjust:", adjustments.size);
    console.log("📝 Individual dish transactions to create:", recipeTransactions.length);

    // 2. Apply stock deductions atomically
    const modifiedProducts = [];

    for (const [productId, qtyChanged] of adjustments.entries()) {
        const productDetails = productsForTransaction.get(productId);
        
        console.log(`🔄 Deducting ${Math.abs(qtyChanged)} from ${productDetails.name}`);
        
        // Atomic update with stock validation
        const result = await Product.updateOne(
            { 
                _id: productId,
                quantity_in_stock: { $gte: Math.abs(qtyChanged) } 
            },
            { $inc: { quantity_in_stock: qtyChanged } }
        );
        
        console.log(`  Result for ${productDetails.name}:`, result);
        
        if (result.matchedCount === 0) {
            console.error(`❌ Insufficient stock for ${productDetails.name}`);
            
            // Rollback all previous changes
            if (modifiedProducts.length > 0) {
                console.log("↩️ Rolling back previous changes...");
                const revertPromises = modifiedProducts.map(mp =>
                    Product.updateOne({ _id: mp.productId }, { $inc: { quantity_in_stock: -mp.qtyChanged } })
                );
                await Promise.all(revertPromises);
                console.log("↩️ Rollback complete");
            }
            
            throw createHttpError(409, 
                `Insufficient stock for product ${productDetails.name}. Required: ${Math.abs(qtyChanged)}`
            );
        }
        
        modifiedProducts.push({ productId, qtyChanged });
    }

    console.log("✅ All stock updates successful");

    // 3. Create RecipeTransaction records for each dish in the order
    const savedTransactions = [];
    
    for (const txnData of recipeTransactions) {
        const recipeTxn = new RecipeTransaction({
            orderId: orderIdString, // Use the string variable we created at the top
            dishId: txnData.dishId, // Required field with actual dishId
            recipeId: txnData.recipeId,
            recipeName: txnData.recipeName,
            variationName: txnData.variationName,
            quantityOfDishes: txnData.quantityOfDishes,
            productsAdjusted: txnData.productsAdjusted,
            type: 'out',
            notes: `Stock deduction for Order ${order.orderId || orderIdString} - ${txnData.recipeName}`,
            createdBy
        });
        
        await recipeTxn.save();
        savedTransactions.push(recipeTxn);
        console.log("💾 RecipeTransaction saved:", recipeTxn._id, "for dish:", txnData.recipeName);
        console.log("   orderId stored as:", recipeTxn.orderId, "Type:", typeof recipeTxn.orderId);
    }

    console.log(`✅ Created ${savedTransactions.length} transaction record(s)`);
    
    // Return the first transaction (or you could return all)
    return savedTransactions[0];
};



/**
 * Finds the original deduction transaction for an order and rolls it back.
 * Reverts the inventory and marks the original transaction as rolled back.
 */
// const performInventoryRollback = async (orderId, createdBy) => {
//     // 1. Find the original 'out' transaction linked to this order
//     const originalTxn = await RecipeTransaction.findOne({
//         orderId: orderId,
//         type: 'out', // Only look for deduction transactions
//         rollbackOf: { $exists: false }, 
//         isRolledBack: { $ne: true } 
//     });

//     if (!originalTxn) {
//         throw createHttpError(404, `No completed inventory deduction record found for Order ID ${orderId} to roll back.`);
//     }

//     // 2. Revert inventory (increment stock back)
//     const revertPromises = originalTxn.productsAdjusted.map(p =>
//         // Invert the change: if original qtyChanged was -1, we apply +1 by negating it: -(-1) = +1
//         Product.updateOne({ _id: p.productId }, { $inc: { quantity_in_stock: -p.qtyChanged } })
//     );
//     await Promise.all(revertPromises);

//     // 3. Create the rollback RecipeTransaction record
//     const rollbackTxn = new RecipeTransaction({
//         orderId: orderId, 
//         recipeName: `Rollback: Order ${orderId}`,
//         quantityOfDishes: -originalTxn.quantityOfDishes,
//         productsAdjusted: originalTxn.productsAdjusted.map(p => ({
//             productId: p.productId,
//             productName: p.productName,
//             qtyChanged: -p.qtyChanged, // Invert the quantity for the rollback transaction record (e.g., -1 becomes +1)
//             unit: p.unit
//         })),
//         type: 'in', // Stock is moving back IN to inventory
//         notes: `Automated inventory rollback due to order cancellation/reversal. Original transaction: ${originalTxn._id}`,
//         createdBy,
//         rollbackOf: originalTxn._id // Links the rollback to the original deduction
//     });
//     await rollbackTxn.save();

//     // 4. Mark the ORIGINAL transaction as rolled back
//     originalTxn.isRolledBack = true;
//     originalTxn.notes += ` | Rolled back by ${rollbackTxn._id}`;
//     await originalTxn.save();

//     return rollbackTxn;
// };

/**
 * Finds all original deduction transactions for an order and rolls them back.
 * Reverts the inventory and marks the original transactions as rolled back.
 */
const performInventoryRollback = async (orderId, createdBy) => {
    console.log("🔄 Starting inventory rollback for order:", orderId);
    
    // 1. Find ALL original 'out' transactions linked to this order
    const originalTxns = await RecipeTransaction.find({
        orderId: orderId,
        type: 'out',
        rollbackOf: { $exists: false },
        isRolledBack: { $ne: true }
    });

    if (!originalTxns || originalTxns.length === 0) {
        throw createHttpError(404, 
            `No inventory deduction records found for Order ID ${orderId} to roll back.`
        );
    }

    console.log(`📋 Found ${originalTxns.length} transaction(s) to roll back`);

    const rollbackTransactions = [];

    // 2. Process each original transaction
    for (const originalTxn of originalTxns) {
        console.log(`   Processing transaction: ${originalTxn._id} for dish: ${originalTxn.recipeName}`);
        
        // Revert inventory (increment stock back)
        const revertPromises = originalTxn.productsAdjusted.map(p => {
            console.log(`      ↩️ Returning ${p.qtyChanged} of ${p.productName}`);
            return Product.updateOne(
                { _id: p.productId }, 
                { $inc: { quantity_in_stock: p.qtyChanged } } // Add back the quantity
            );
        });
        await Promise.all(revertPromises);

        // 3. Create the rollback RecipeTransaction record
        const rollbackTxn = new RecipeTransaction({
            orderId: orderId,
            dishId: originalTxn.dishId, // Keep the same dishId
            recipeId: originalTxn.recipeId,
            recipeName: `Rollback: ${originalTxn.recipeName}`,
            variationName: originalTxn.variationName,
            quantityOfDishes: -originalTxn.quantityOfDishes, // Negative to show reversal
            productsAdjusted: originalTxn.productsAdjusted.map(p => ({
                productId: p.productId,
                productName: p.productName,
                qtyChanged: -p.qtyChanged, // Negative to show stock returning
                unit: p.unit
            })),
            type: 'in', // Stock moving back IN
            notes: `Automated rollback for order cancellation. Original txn: ${originalTxn._id}`,
            createdBy,
            rollbackOf: originalTxn._id
        });
        
        await rollbackTxn.save();
        rollbackTransactions.push(rollbackTxn);
        console.log(`   ✅ Rollback transaction created: ${rollbackTxn._id}`);

        // 4. Mark the ORIGINAL transaction as rolled back
        originalTxn.isRolledBack = true;
        originalTxn.notes = (originalTxn.notes || '') + ` | Rolled back by ${rollbackTxn._id}`;
        await originalTxn.save();
    }

    console.log(`✅ Rollback complete. Created ${rollbackTransactions.length} rollback record(s)`);
    
    // Return all rollback transactions (or just the first one)
    return rollbackTransactions;
};

module.exports = {
  adjustStockByRecipe,
  rollbackRecipeStock,
  deductStockForCompletedOrder,
  performInventoryRollback
};

