const createHttpError = require("http-errors");
const Category = require("../models/categoryModel")

const mongoose = require("mongoose");


const addCategory = async (req, res, next) => {

    try {
        const {categoryName} = req.body;

        if(!categoryName){
            const error = createHttpError(400, 'Please provide Category Name!');
            return next(error);
        }

        const isCategoryPresent = await Category.findOne({ categoryName });

        if(isCategoryPresent){
            const error = createHttpError(400, "Category already exist!");
            return next(error);
        }

        const newCategory = new Category({ categoryName });
        await newCategory.save();
     
        res.status(201).json({success: true, message: "Category  added!",
            data: newCategory });

    } catch (error) {
        return next(error);
        
    }
}

const getCategories = async (req, res, next) => {
    try {
        const categories = await Category.find();

        res.status(200).json({
            success: true,
            data: categories,
        });
    } catch (error) {
        return next(error);
    }
};


const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Validate the category ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            const error = createHttpError(404, "Invalid id!");
            return next(error);
        }

        // Find and delete the category
        const category = await Category.findByIdAndDelete(id);

        // If category not found
        if (!category) {
            const error = createHttpError(404, "Category not found!");
            return next(error);
        }

        // Success response
        res.status(200).json({ success: true, message: "Category deleted successfully!" });
    } catch (error) {
        next(error);
    }
};


const updateCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params; // Assuming route param is :categoryId
        const { categoryName } = req.body;

        console.log("Request Body:", req.body);
        console.log("Category ID:", categoryId);

        // Validate categoryId
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            const error = createHttpError(400, "Invalid Category ID!");
            return next(error);
        }

        // Validate input
        if (!categoryName || categoryName.trim() === "") {
            const error = createHttpError(400, "Category name is required!");
            return next(error);
        }

        // Find the category to update
        const categoryToUpdate = await Category.findById(categoryId);
        if (!categoryToUpdate) {
            const error = createHttpError(404, "Category not found!");
            return next(error);
        }

        // Update category name
        categoryToUpdate.categoryName = categoryName.trim();

        // Save updated category
        await categoryToUpdate.save();

        res.status(200).json({
            success: true,
            message: "Category name updated successfully!",
            data: categoryToUpdate,
        });

    } catch (error) {
        console.error("Error updating category:", error);
        return next(error);
    }
};


module.exports={addCategory, getCategories, deleteCategory, updateCategory};