require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const cors=require('cors');
const PORT = process.env.PORT || 3000;

connectDB();
app.use(cors());

app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server running on port ${PORT}`);
});
