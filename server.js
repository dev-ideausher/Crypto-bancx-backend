const mongoose = require('mongoose');
const app = require('./app');
const { MONGO_DATABASE_DEV } = require('./config/config');
mongoose.set('strictQuery', true);

// const {MONGO_DATABASE_DEV} = require("./config/config");

//db
mongoose.connect(
    MONGO_DATABASE_DEV,
    {
        useNewUrlParser:true,
        useUnifiedTopology: true
    }
)
.then(() => console.log('DB Connected...'))

const port = process.env.PORT || 8000;
app.listen(port,() =>{
    console.log(`App running on port ${port}...`);
});