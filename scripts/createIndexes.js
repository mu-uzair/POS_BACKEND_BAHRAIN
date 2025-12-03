const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const createIndexes = async () => {
    await connectDB();
    
    const Order = require('../models/orderModel');
    
    console.log('🔧 Cleaning up old indexes...');
    
    try {
        // Get existing indexes
        const existingIndexes = await Order.collection.getIndexes();
        console.log('📋 Existing Indexes Before Cleanup:');
        console.log(Object.keys(existingIndexes));
        
        // Drop all indexes except _id and orderId (unique)
        const indexesToKeep = ['_id_', 'orderId_1'];
        for (const indexName of Object.keys(existingIndexes)) {
            if (!indexesToKeep.includes(indexName)) {
                console.log(`🗑️  Dropping index: ${indexName}`);
                await Order.collection.dropIndex(indexName);
            }
        }
        
        console.log('\n🔧 Creating new indexes...');
        await Order.syncIndexes();
        console.log('✅ All indexes created successfully!');
        
        // Show final indexes
        const finalIndexes = await Order.collection.getIndexes();
        console.log('\n📋 Final Indexes:');
        console.log(JSON.stringify(finalIndexes, null, 2));
        
        // Show index count
        console.log(`\n📊 Total Indexes: ${Object.keys(finalIndexes).length}`);
        
    } catch (error) {
        console.error('❌ Error managing indexes:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
};

createIndexes();