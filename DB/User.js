const mongoose =require('mongoose')
const bcryptjs=require('bcryptjs');

const UserSchema=new mongoose.Schema({
    name:{
        type:String,
        require:[true,"Name is required"]
    },
    email:{
        type:String,
        require:[true,"Email is required"],
        unique:[true,"Email Already Exists"]
    },
    password:{
        type:String,
        require:[true,"password is required"],
        unique:[true,"password Already Exists"]
    },
});

UserSchema.pre('save',async function(next){
    this.password=await bcryptjs.hash(this.password,10);
    next();
})

module.exports=mongoose.model('prousers',UserSchema);