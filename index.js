const express=require('express');
const cors=require('cors');
const app=express(); 
require('./DB/config');
require('dotenv').config();
const UserModel=require('./DB/User');
const jwt=require('jsonwebtoken');
const bcryptjs=require('bcryptjs');
const secretkey=process.env.JWT_SECRET_KEY;
const transporter=require('./email');
const crypto=require('crypto');
const razorpay=require('./razorpay');
const CartModel=require('./DB/Cart');
const OrderModel=require("./DB/Order");
const {ObjectId}=require('mongodb')

app.use(cors());
app.use(express.json());
const chatfunc = require('./gemini');

app.get('/',(req,resp)=>{
    resp.send('connection set up');
})

app.post('/register',async(req,resp)=>{
    try{
        if(req.body.name && req.body.email && req.body.password){
            const result=new UserModel(req.body);
            const token=  jwt.sign({_id:result._id},secretkey,{expiresIn:"1h"});
            const data=await result.save();
            delete data.password;
            resp.status(200).send({result:data,token});
        }
        else{
            resp.status(400).send({reslt:"All Field is required.."});
        } 
   }
   catch(error){
    if(error.keyPattern){
        resp.status(500).send({err:"User Already Exists."})
    }
    else{
        resp.status(500).send(error);
    }
   }
})

app.post('/login',async(req,resp)=>{
    if(req.body.email && req.body.password){
        const result= await UserModel.findOne({email:req.body.email});
        
        if(result){
            const ismatch=await bcryptjs.compare(req.body.password,result.password);
            const token=jwt.sign({_id:result._id},secretkey,{expiresIn:"1h"});
            if(ismatch){
                delete result.password;
                resp.status(200).send({result,token});
            }
            else{
                resp.status(400).send({err:"User Credential is wrong."})
            }
        }
        else{
            resp.status(400).send({err:"Username is not found."})
        }
        
    }
    else{
        resp.status(400).send({err:"All Field is required."})
    }
})

app.post('/email',async(req,resp)=>{
    try{
        const info = await transporter.sendMail({
            from:`"The FitHub" ${process.env.USER}`,
            to: req.body.email, 
            subject: 'Welcome to The FitHub! 🏋️‍♀️',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome, ${req.body.name}! 🎉</h2>
        <p>Welcome to the <strong>The FitHub</strong> family! We're thrilled to have you join us on your fitness journey. 💪</p>
        
        <h3>Here’s what you can do next:</h3>
        <ul>
          <li><strong>Log in</strong> to your account: <a href="https://yourgym.com/login" target="_blank">Click here</a></li>
          <li>Explore your personalized <strong>fitness plans</strong> and schedule.</li>
          <li>Get ready to crush your goals!</li>
        </ul>
        
        <h3>Special Welcome Offer</h3>
        <p>To kick things off, enjoy a <strong>[offer details, e.g., free trial session, discounted membership]</strong>. 🎉</p>
        <p>Use the code: <strong>WELCOME10</strong> during your next visit!</p>
        
        <h3>We’re Here for You</h3>
        <p>If you have any questions or need help, don’t hesitate to reach out:</p>
        <p>
        📞 Call us: 8765433035,6386021332</p>
        
        <h3>Stay Connected</h3>
        <p>
          🌐 Visit us: <a href="https://yourgym.com" target="_blank">yourgym.com</a><br>
        </p>
        
        <p>Let’s get started on achieving your fitness goals together!</p>
        <p>Warm regards,</p>
        <p><strong>The FitHub Team</strong></p>
      </div>
    `,
          
          });
          resp.status(200).send({info:info});

    }catch(err){
        resp.status(500).send({err:err});
    }
})

app.post('/chatbot',async(req,resp)=>{
    try{
        if(!req.body){
            resp.status(400).send("Please Provide a prompt to begin!!")
        }
        else{
            const {input}=req.body;
            const result=await chatfunc(input);
            resp.status(200).send({result:result});
        }
    }catch(err){
        resp.status(500).send({err:"Something Went Wrong!"});
    }
})

app.post('/cart/:id',async(req,resp)=>{
    
    let data=await CartModel.findOne({userId:req.params.id});
    
   if(data){

      let remarray=[];
     data.cartdata.forEach(element => {
           let obj={productname:element.productname,imgurl:element.imgurl,price:element.price}
           remarray.push(obj);
     });
       
       let arrnew=req.body.cartdata;
       arrnew=arrnew.concat(remarray);
       let sndarray=arrnew.filter(function(key,index){
               return index===arrnew.findIndex(function(obj){
                   return JSON.stringify(key)===JSON.stringify(obj);
               })
           })
          
       req.body.cartdata=sndarray;
     
        const result=await CartModel.updateOne({userId:req.params.id},{$set:req.body});
       resp.status(200).send(result);
   }
   else{
       let result=new CartModel(req.body);
       let data=await result.save();
       resp.status(200).send(data);
   }
})

app.get('/getcart/:id',async(req,resp)=>{
    if(req.params.id){
        const result=await CartModel.findOne({userId:req.params.id});
        if(result){
            resp.status(200).send({cartdata:result.cartdata});
        }
        else{
            resp.status(200).send({reslt:"Not added any Item to your Cart.."})
        }
        
    }
    else{
        resp.status(400).send({reslt:"You are not an authorized user.."})
    }  
})
app.put('/cartdelete/:id' ,async(req,resp)=>{
    if(req.params.id){
        const result=await CartModel.updateOne({userId:req.body.userId},{$pull:{cartdata:{_id:new ObjectId(req.params.id)}}});
        resp.status(200).send(result);
    }
    else{
        resp.status(400).send({reslt:"You are not an authorized user."})
    }
})
app.post('/order/:id',async(req,resp)=>{
    
    let data=await OrderModel.findOne({userId:req.params.id});
    
   if(data){

      let remarray=[];
     data.orderdata.forEach(element => {
           let obj={productname:element.productname,imgurl:element.imgurl,price:element.price,orderId:element.orderId,orderdate:element.orderdate}
           remarray.push(obj);
     });
       
       let arrnew=req.body.orderdata;
       arrnew=arrnew.concat(remarray);
       let sndarray=arrnew.filter(function(key,index){
               return index===arrnew.findIndex(function(obj){
                   return JSON.stringify(key)===JSON.stringify(obj);
               })
           })
          
       req.body.orderdata=sndarray;
     
        const result=await OrderModel.updateOne({userId:req.params.id},{$set:req.body});
       resp.status(200).send(result);
   }
   else{
       let result=new OrderModel(req.body);
       let data=await result.save();
       resp.status(200).send(data);
   }
})

app.get('/getorder/:id',async(req,resp)=>{
    if(req.params.id){
        const result=await OrderModel.findOne({userId:req.params.id});
        if(result){
            resp.status(200).send({orderdata:result.orderdata});
        }
        else{
            resp.status(200).send({reslt:"No Orders Done Yet!!"})
        }
        
    }
    else{
        resp.status(400).send({reslt:"You are not an authorized user.."})
    }  
})

// Razorpay Integration APi.
app.post("/create-order",async(req,resp)=>{
    const { amount, currency } = req.body;

    try {
      const options = {
        amount: amount * 100, 
        currency: currency || "INR",
        receipt: `receipt_${Date.now()}`,
      };
  
      const order = await razorpay.orders.create(options);
      resp.status(200).json({ success: true, order });
    } catch (error) {
      resp.status(500).json({ success: false, message: error.message });
    }
});

app.post("/verify-payment", (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    const generated_signature = crypto
      .createHmac("sha256", key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
  
    if (generated_signature === razorpay_signature) {
      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  });

app.listen(8000,(err)=>{
    if(err){
        console.log(err);
    }
    else{
        console.log("Server is listening on port 8000");
    }
})
