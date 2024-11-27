const mongoose=require('mongoose');
const OrderSchema=new mongoose.Schema({
    userId:{
        type:String,
        require:true
    },
   orderdata:[
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
       },
       orderId:{
        type:String,
        require:true,
       },
       orderdate:{
        type:String,
        default:new Date().toDateString()
       }
   }]
})

module.exports=mongoose.model('orders',OrderSchema);