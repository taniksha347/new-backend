const slugify=require("slugify")
const mongoose = require("mongoose");
const courseSchema = new mongoose.Schema({
    title:String,
    duration:String,
    description:String,
    category:String,
    discountPercentage:String,
    offerTillDate:String,
    startDate:String,
    endDate:String,
    isFeatured:Boolean,
    banner:String,
    createdBy:String
},{timestamps:true});
courseSchema.pre('save',function(next){
    if(!this.slug){
        this.slug=slugify(this.title);
    }
    next();
})
module.exports=mongoose.model("Course",courseSchema);