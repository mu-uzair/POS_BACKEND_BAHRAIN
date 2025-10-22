// const mongoose = require("mongoose")

// const categorySchema = new mongoose.Schema(
//     {
//         categoryName: {
//             type: String,
//             required: true,
//             unique: true,
           
//         }
//     }
// );
// module.exports = mongoose.model("Category", categorySchema);


const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema(
    {
        categoryName: {
            type: String,
            required: true,
            unique: true,
        },
        imageUrl: {
            type: String,
            default: '',  // Default empty string if no image URL is provided
            validate: {
                validator: function(v) {
                    // Basic URL validation
                    return !v || /^(http|https):\/\/[^ "]+$/.test(v);
                },
                message: props => `${props.value} is not a valid URL!`
            }
        }
    }
);
module.exports = mongoose.model("Category", categorySchema);