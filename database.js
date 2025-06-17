const mongoose= require("mongoose");

require('dotenv').config();

const connectDB = async () =>{
    try{
     await mongoose.connect(process.env.MONGO_URI,{
        useNewUrlParser:true,
        useUnifiedTopology:true
     })
     console.log("Database is connected successfully");
    }catch(error){
        console.log(error);
        console.log("AN error occured");
    }
}

module.exports=connectDB;