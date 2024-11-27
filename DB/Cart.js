const mongoose=require('mongoose');
const CartsSchema=new mongoose.Schema({
    userId:{
        type:String,
        require:true
    },
   cartdata:[
    {
       productname:{
        type:String,
        require:true
       },
       imgurl:{
        type:String,
        require:true
       },
       price:{
        type:String,
        require:true
       }
   }]
})

module.exports=mongoose.model('carts',CartsSchema);