// require("dotenv").config();
// const express = require("express");
// const connectDB =require("./config/database");

// const config = require("./config/config");
// const globalErrorHandle = require("./middleware/globalErrorHandler");
// const createHttpError = require("http-errors");
// const cookieParser = require("cookie-parser");
// const cors = require("cors")

// const app = express();

// // const PORT = config.port;
// const PORT = process.env.PORT || 8000;;

// connectDB();




// //Middlewares
// app.use(cors({
//     credentials: true,
     
//     origin: ['http://localhost:5173','https://pos-frontend-bahrain.onrender.com']   
      
// }))
// app.use(express.json()); //parse incoming request in json format



// app.use(cookieParser())

// app.use((req, res, next) => {
//     if (req.path === "/favicon.ico" || req.path === "/favicon") {
//         return res.status(204).end(); // No Content response
//     }
//     next();
// });

// // root Endpoint
// app.get("/", (req, res) => {

//     res.json({message : "HEllo from POS Server"})
    

// })


// // Other Endpoints
// app.use("/api/user", require("./routes/userRoute"));
// app.use("/api/order", require("./routes/orderRoute"));
// app.use("/api/table", require("./routes/tableRoutes"));
// app.use("/api/category", require("./routes/categoryRoute"));
// app.use("/api/dish", require("./routes/dishRoute"));

// // For Inventory

// app.use("/api/product", require("./routes/Inventory/productRoute"));
// app.use("/api/vendor", require("./routes/Inventory/vendorRoute"));
// app.use("/api/transactions", require("./routes/Inventory/transactionRoute"));
// app.use("/api/metrics", require("./routes/Inventory/metricsroute"));



// //global error handler
// app.use(globalErrorHandle);

// app.listen(PORT,()=>{

//     console.log(`POS Server listening on port ${PORT}`);
// })


// server.js (or app.js) — full example integrating with your existing app
require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database");
const globalErrorHandle = require("./middleware/globalErrorHandler");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8000;

// DB
connectDB();

// Middlewares
app.use(cors({
  credentials: true,
  origin: [
    "http://localhost:5173",
    "https://pos-frontend-bahrain.onrender.com"
  ],
}));
app.use(express.json());
app.use(cookieParser());

// prevent favicon spam
app.use((req, res, next) => {
  if (req.path === "/favicon.ico" || req.path === "/favicon") return res.status(204).end();
  next();
});

// routes (keep your existing routes)
app.use("/api/user", require("./routes/userRoute"));
app.use("/api/order", require("./routes/orderRoute"));
app.use("/api/table", require("./routes/tableRoutes"));
app.use("/api/category", require("./routes/categoryRoute"));
app.use("/api/dish", require("./routes/dishRoute"));


// ⚡️ NEW DELIVERY & CUSTOMER ROUTES
app.use("/api/deliveryboy", require("./routes/deliveryBoyRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));

// ...inventory routes as before...
app.use("/api/product", require("./routes/Inventory/productRoute"));
app.use("/api/vendor", require("./routes/Inventory/vendorRoute"));
app.use("/api/transactions", require("./routes/Inventory/transactionRoute"));
app.use("/api/metrics", require("./routes/Inventory/metricsroute"));


// global error handler
app.use(globalErrorHandle);

// Create HTTP server and attach socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://pos-frontend-bahrain.onrender.com"
    ],
    methods: ["GET", "POST", "PUT"],
  }
});

// expose io to controllers via app
app.set("socketio", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("disconnect", () => console.log("Socket disconnected:", socket.id));
});

// start server
server.listen(PORT, () => console.log(`POS Server listening on port ${PORT}`));
