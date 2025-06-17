const express = require("express");

const connectDB = require("./database");

const cors = require("cors")
const User = require("./models/User");
const sendMail= require('./config/nodemailerConfig')
const bcrypt= require("bcrypt");
const logger= require("./middleware/logger")
const jwt=require("jsonwebtoken")
const errorHandler=require("./middleware/errorHandler");
const Course=require("./models/Coures")
const authtoken=require("./middleware/authtoken")
const {authMiddleware,authorizeRole}= require("./middleware/authorization");
const upload=require("./config/multer");
require('dotenv').config();

const app =express();

connectDB();


app.use(cors({
    origin:"http://localhost:3000/",
    credentials:true

}))
// bcrypt library -> npm install bcrypt 
app.use(express.json())
app.use(errorHandler);
// ye line hmme database me json formate to data parse(bhejne) karne me help kregi 
// database me phla user insert krna

// for hasing any password we will user bcrypt.hash method .
// for matching a normal password with hashed password we will use bcrypt.compare method .
// bcrypt.hash method 
// we will need only two parameters if we have to hash any password.
// 1. Password 2. saltRounds=A certified number at which a particular algorithm will be hitted. -> genSalt(10) 

app.post("/register",logger,async (req,res)=>{
    try{
      const{name,email,password,contact,role}=req.body;
      // for saving this data
      const saltRounds=await bcrypt.genSalt(10);
      const hashedPassword= await bcrypt.hash(password,saltRounds);
      console.log(hashedPassword);
    //   const result=await bcrypt.compare(password,hashedPassword);
    //   console.log("Value of matched password is ",result)
      const otp= Math.floor(1000000+Math.random()*9000000).toString();
      const newUser= new User({name,email,password:hashedPassword,contact,otp,role});
      await newUser.save();
      const subject='Welcome to our Platform 🔥 Your Otp For Verification'
      const text= `Hi ${name} , Thank You for registering at our platform . Your Otp is ${otp}, Please don't share it to anybody else.`

      const html= `
       <h2>Thank You for Registering at our Platform</h2>
       <p style={{color:"red"}}>Your Otp is this : ${otp} </p>
       <p style={{color:"green"}}>Please Use this Otp for verification of your account </p>
      `
      sendMail(email,subject,text,html);
      console.log("Data inserted successfully and mail send properly")
      return res.status(200).json({message:"Data is inserted successfully"});
    }catch(error){
        console.log(error)
        return res.status(500).json({message:"Internal Server Error"})
    }
})

// database se data extract krne ke liye hmm log get method ka use krenge 

app.get("/all",logger,authMiddleware,authorizeRole('Trainer'),async (req,res)=>{
    try{
         // Jab database se sare users ko find krna ho to kaun sa method use krenge - 
         // {id:1,name:Ram,class:3,address:"Hisar"},{id:2,name:Mohan,class:3,address:"Rohtak"}
         // find()
         const users=await User.find();
         return res.json(users);
         
    }catch(error){
        console.log(error);
        return res.status(500).json({message:"An error occurred"});
    }
})
// Router for adding course 
app.post ("/add-course",authMiddleware,authorizeRole('Student'),upload.single("banner"),async(req,res)=>{
    try{
        const {title,duration,description,category,discountPercentage,offerTillDate,startDate,endDate,createdBy}=req.body;
        const banner= req.file.path;
        const newCourse=new Course({
            title,
            duration,
            description,
            category,
            discountPercentage,
            offerTillDate,
            startDate,
            endDate,
            banner,
            createdBy
        });
        await newCourse.save();
        return res.status(201).json({message:"Course is successfully added",newCourse});
    }catch(error){
        return res.status(500).json({message:"An error occured"})
    }
})

// Routes for fetching all course 

app.get("/allcourses",async(req,res)=>{
    try{
        
        // const{search,duration,category}=req.query;
        // let filters={}
        // if(search){
        //     filters.title={$regex:search,$options:"i"}
        // }
        // if(duration){
        //     filters.duration={$regex:duration,$options:"i"}
        // }
        // if(category){
        //     filters.category={$regex:category,$options:"i"}
        // }
        const courses= await Course.find(filters);
       return res.status(200).json({message:"All courses found successfully",courses})
    }catch(error){
        return res.status(500).json({message:"An error occured during fetching course"})
    }
})
app.put("/users/:id",logger,async(req,res)=>{
    try{
          // findByIdAndUpdate -> Sabse phle id ke basis pr find karna uske bad update krna 
          const{name,email,password,contact}=req.body;
          // Jab Postman ki req se koi data uthayenge to hmm req.parms.data(id) ye use krenge 
          const UpdatedUser= await User.findByIdAndUpdate(req.params.id,{name,email,password,contact},{new:true});
          if(!UpdatedUser){
            return res.status(404).json({message:"User Not Found"});
          }
          res.json(UpdatedUser);
    }catch(error){
        return res.status(200).json({message:"An error is occured"});
    }
})

app.delete("/users/:id",logger, async(req,res)=>{
    try{
         const deltedUser = await User.findByIdAndDelete(req.params.id);
         if(!deltedUser){
            return res.status(400).json({message:"User Not found"});
         }
         res.json(deltedUser);
    }catch(error){
        return res.status(500).json({message:"Ann error occured"})
    }
})

app.post("/login", logger, async(req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(403).json({ message: "User does not exist" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password is incorrect" });
        }

        // Generate JWT Token
        const token = jwt.sign({email:email},process.env.SECRET_KEY, { expiresIn: '1h' });

        return res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        next(error);
    }
});
app.post("/verify",logger,async(req,res)=>{
    try{
        const {email,otp} = req.body;
        const findEmail= await User.findOne({email})
        console.log(findEmail.otp)
        if(findEmail.otp!==otp){
        return res.status(404).json({message:"otp is not verified"})
        }
        findEmail.otp=null;
        await findEmail.save();
        console.log('testing...');
        
        return res.status(202).json({message:" your otp is verified"})
    }catch(error){ console.log(error)
        return res.status(500).json({message:"an error occured"})
    }
})


app.patch("/edit-course", async (req, res) => {
    try {
      const { email,change } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(403).json({ message: "id not find" });
      }
      const updateemail = await User.updateOne(
        { email },
        { email: change }
      );
      return res.status(200).json({ message: "successfully update"});
    } catch (error) {
      return res.status(500).json({ message: "error in editing"});
    }
  });


app.listen(5001,()=>{
    console.log("Server is running on localhost:5000")
})




// http://localhost:5000/register-user