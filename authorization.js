const jwt= require("jsonwebtoken");
const User= require("../models/User");

const authMiddleware = async(req,res,next)=>{
    const token = req.headers['authorization']?.split(' ')[1];
    if(!token) return res.status(403).json({message:"Bhaiya yrr token hi nahi diye tum to"});

    try{
        const decoded=jwt.verify(token,process.env.SECRET_KEY);
        console.log(decoded)
        const user=await User.findOne({email:decoded.email});
        console.log(user);
        if(!user) return res.status(404).json({message:"User Not Found"});
        req.user=user
        next();

    }catch(error){
        console.log(error);
        return res.status(500).json({message:"Bhaiya kuch gadbadi ho gayi hai "})
    }
}

const authorizeRole = (role) =>{
    return (req,res,next)=>{
        if(req.user.role !== role){
            return res.status(404).json({message:"Unautorized Aceesss , Bhago yha se"});
        }
        next();
    }
}

module.exports={authMiddleware,authorizeRole}