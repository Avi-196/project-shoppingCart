const orderModel=require("../models/orderModel")
const mongoose=require("mongoose")

const isValid=function(value){
    if(typeof value==="undefined"||typeof value===null )return false
    if(typeof value==="string"&& value.trim().length===0)return false
    return true
}

const isValidObjectId=function(ObjectId){
    return mongoose.Types.ObjectId.isValid(ObjectId)
}


  const createOrder = async function (req, res) {
    try {
        let requestBody = req.body;
        const userId = req.params.userId

        let { items,totalItems, totalPrice,totalQuantity} = requestBody
       
        if(Object.keys(requestBody).length==0){
            return res.status(400).send({status:false,msg:"bad req"})
        }
    
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message:"userid is not valid" })
        }
        requestBody.userId=userId
           
        if (req.userId!==userId) {
            return res.status(401).send({ status: false, msg: "you are not authorized" })
        }

        if (items.length ==0) {
            return res.status(400).send({ status: false, msg: "empty items" })
        }
        if (!isValid(items)) {
            return res.status(400).send({ status: false, message: "items is required" })
        }
        if (!isValid(totalPrice)) {
            return res.status(400).send({ status: false, message: "totalPrice is required"})
        }
        if (!isValid(totalItems)) {
            return res.status(400).send({ status: false, message: "totalItems is required"})
        }
        if(!isValid(totalQuantity)){
            return res.status(400).send({status:false,msg:"totalQunatity is required"})
        }
         
        const createProduct = await orderModel.create(requestBody);
        res.status(201).send({ status: true, msg: 'sucesfully created order', data: createProduct })

    } catch (error) {
        res.status(500).send({ status: false, Message: error.message })
    }
}



const updateOrder = async function (req, res) {
    try {
        let requestBody = req.body;
        const userId = req.params.userId
       
        const { orderId,status } = requestBody

        
       if(Object.keys(requestBody).length==0){
           return res.status(400).send({status:false,msg:"bad req"})
       }
       if (!isValidObjectId(userId)) {
        return res.status(400).send({ status: false, message:"userId is not valid" })
    }
       
        if (req.userId!==userId) {
            return res.status(400).send({ status: false, msg: "you are not authorized" })
        }

      
        if (!isValid(orderId)) {
            return res.status(400).send({ status:false, message: 'orderId is required' })
        }
        if (!isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "orderId is not valid" })
        }
        const Order = await orderModel.findOne({ _id: orderId, isDeleted: false })
        if (!Order) {
            return res.status(400).send({ status:false, message: "orderid is not correct" })
        } 
        if (!(Order.userId == userId)) {
            return res.status(400).send({ status: false, message:"order does not blongs to upperuserId" })
        } 
     
        if(isValid(status)){
                        if(!(["pending", "completed", "cancelled"].includes(status))){
                            return res.status(400).send({status:false,message:"status is invalid"})
                        }
                    }
       
        let updateOrder = await orderModel.findOneAndUpdate({ _id: orderId }, { status:status }, { new: true }).select({isDeleted:0,deletedAt:0})
        res.status(200).send({ status: true, msg: 'sucesfully updated', data: updateOrder })

    } catch (error) {
        res.status(500).send({ status: false, Message: error.message })
    }
}
   

module.exports.createOrder=createOrder
module.exports.updateOrder=updateOrder