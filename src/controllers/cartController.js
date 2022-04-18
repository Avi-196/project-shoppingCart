const cartModel=require("../models/cartModel")
const userModel=require("../models/userModel")
const productModel=require("../models/productModel")

const mongoose=require("mongoose")



const isValid=function(value){
    if(typeof value==="undefined"||typeof value===null)return false
    if(typeof value==='string'&& value.trim().length===0)return false
    return true
}

const isValidObjectId=function(ObjectId){
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

const isValidNumber = function (value) {

    if (typeof value === 'undefined' || value === null) return false
    if (  isNaN(value)    && value.toString().trim().length !== 0) return false
    return true;
  }




const addToCart = async function (req, res) {
    try {

        const userId = req.params.userId
        const requestBody = req.body

        const { cartId, productId, quantity } = requestBody                    //Destructing the requestBody

        // validating the userId ,productId ,quantity
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "userId is invalid" })
        }
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "productId is invalid" })
        }
        if (!isValidNumber(quantity)) {
            return res.status(400).send({ status: false, message: "quantity must be number and present" })
        }
        if (quantity < 0) {
            return res.status(400).send({ status: false, message: "quantity must greater than zero" })
        }

        // authorization
        if (req.userId != userId) {
            return res.status(403).send({ status: false, message: "you are not authorized" })
        }

        // checking the userId and productId exists or not  in database
        const isUserExists = await userModel.findById(userId)
        if (!isUserExists) {
            return res.status(404).send({ status: false, message: "user data not found" })
        }
        const isProductExists = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!isProductExists) {
            return res.status(404).send({ status: false, message: "product data not found" })
        }

        // --------------------------------------If cartId exist in requestBody----------------------------------------

        if (cartId) {

            // validating the cartId
            if (!isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "cartId is invalid" })
            }
            // checking the cartId exists or not in database
            const isCartExists = await cartModel.findById(cartId)
            if (!isCartExists) {
                return res.status(404).send({ status: false, message: "cart data not found" })
            }

            // calculating  the total price   
            //totalPrice = product price(from product database) multiple by total number of quantity(from input)  and add totalPrice(from cart database)
            const totalPrice = isProductExists.price * quantity + isCartExists.totalPrice

            // totalItems = quantity(from input) and add totalItems (from cart database)
            const totalItems = quantity + isCartExists.totalItems


            //    if product already exists in items{cart}
            let arrayOfItems = isCartExists.items

            for (let i = 0; i < arrayOfItems.length; i++) {
                if (arrayOfItems[i].productId == productId) {

                    let finalFilter = {
                        totalItems: totalItems,
                        totalPrice: totalPrice
                    }

                    finalFilter[`items.${i}.quantity`] = quantity + arrayOfItems[i].quantity

                    const productToDeleteFromCart = await cartModel.findOneAndUpdate({ items: { $elemMatch: { productId: arrayOfItems[i].productId } } }, { $set: finalFilter }, { new: true })
                    return res.send({ productToDeleteFromCart })
                }
            }
            //  storing in a variable what we need to update 
            const cartDataToAddProduct = {
                $push: { items: [{ productId: productId, quantity: quantity }] },      //by using $push we will push the productid and quantity in items Array
                totalPrice: totalPrice,
                totalItems: totalItems,
            }

            // updating the new items and totalPrice and tOtalItems
            const addToCart = await cartModel.findOneAndUpdate({ _id: cartId }, cartDataToAddProduct, { new: true })
            if (!addToCart) {
                return res.status(409).send({ status: false, message: "failed to update" })
            }
            return res.status(200).send({ status: true, message: "product add to cart successfully", data: addToCart })

        }
        // ----------------------------------------------------------------------------------------------------------

        // --------------------------If cartId not exist in requestBody it will create the new cart----------------------------------------
      const  isCartAlreadyCreated = await cartModel.findOne({userId:userId})
        if(isCartAlreadyCreated){
           return res.status(400).send({status:false,message:"cart already created please provide cartId"})
        }
        //  storing in a variable what we need to create
        const cartDataToCreate = {
            userId: userId,
            items: [{
                productId: productId,
                quantity: quantity,
            }],
            totalPrice: isProductExists.price * quantity,
            totalItems: quantity,
        }

        // creating the new cart with adding the products
        const cartCreation = await cartModel.create(cartDataToCreate)
        if (!cartCreation) {
            return res.status(409).send({ status: false, message: "failed to create" })

        }
        return res.status(201).send({ status: true, message: "cart created", data: cartCreation })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


const removeProduct=async function(req,res){
    try {
        const requestBody=req.body
        const userId=req.params.userId
        const {productId,cartId,removeProduct}=requestBody
        if(Object.keys(requestBody).length==0){
            return res.status(400).send({status:false,msg:"bad rreq"})
        }
        if(req.userId!==userId){
            return res.status(401).send({status:false,msg:"you are not authorised"})
        }
   
        if(!isValid(userId)){
            return res.status(400).send({status:false,msg:"userId is required"})
        }
        if(!isValidObjectId(userId)){
            return res.status(400).send({status:false,msg:"userId is not valid"})
        }
        if(!isValidObjectId(cartId)){
            return res.status(400).send({status:false,msg:"cartId is not valid"})
        }
        if(!isValidObjectId(productId)){
            return res.status(400).send({status:false,msg:"productId is not valid"})
        }

        if (!(removeProduct === 0 || removeProduct === 1)) {
            return res.status(400).send({ status: false, message: `removeProduct should be 0 or 1 ` })
        }

        const user = await userModel.findById({ _id: userId, isDeleted: false });
        if (!user) {
            return res.status(404).send({ status: false, message: `user does not exit` })
        }
        const product = await productModel.findById({ _id: productId, isDeleted: false });
        if (!product) {
            return res.status(404).send({ status: false, message: `product does not exit` })
        }
        const cart = await cartModel.findById({ _id: cartId, userId: userId })
        if (!cart) {
            return res.status(404).send({ status: false, message: `cart does not exit` })
        }

        let array = cart.items
        for (let i = 0; i < array.length; i++) {
            if (array[i].productId == productId) {
                let totelProductprice = array[i].quantity * product.price
                if (removeProduct === 0) {
                    const updateProductItem = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, totalPrice: cart.totalPrice - totelProductprice, totalItems: cart.totalItems - 1 }, { new: true })
                    return res.status(200).send({ status: true, msg: 'sucessful removeded', data: updateProductItem })
                }
                if (removeProduct === 1) {
                    if (array[i].quantity === 1 && removeProduct === 1) {
                        const removeCart = await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } }, totalPrice: cart.totalPrice - totelProductprice, totalItems: cart.totalItems - 1 }, { new: true })
                        return res.status(200).send({ status: true, msg: 'sucessfully removed product or cart is empty', data: removeCart })
                    }
                    array[i].quantity = array[i].quantity - 1
                    const updateCart = await cartModel.findByIdAndUpdate({ _id: cartId }, { items: array, totalPrice: cart.totalPrice - product.price }, { new: true });
                    return res.status(200).send({ status: true, msg: 'sucessfully decress product', data: updateCart })
                }
            }
        }


        
    } catch (error) {
        return res.status(500).send({msg:error.message})
        
    }
}



const getcartById=async function(req,res){
    try {
        const userId=req.params.userId
         

        if(!isValidObjectId(userId)){
            return res.status(400).send({status:false,msg:"invalid userid"})
        }
        if(req.userId!==userId){
            return res.status(401).send({status:false,msg:"you are not authorized"})
        }

        const userexist=await userModel.findById({_id:userId})
        if(!userexist){
            return res.status(404).send({status:false,msg:"user doesnot exist"})
        }

    const cart=await cartModel.findOne({userId:userId})
    if(!cart){
        return res.status(400).send({status:false,msg:"no cart exist"})
    }
    return res.status(200).send({status:true,msg:"successfully found",data:cart})

        
    } catch (error) {
        return res.status(400).send({status:false,msg:error.message})
        
    }
}



const deletecartById=async function(req,res){
    try {  const userId=req.params.userId

        if(!isValidObjectId(userId)){
            return res.status(400).send({status:false,msg:"userid is not valid"})
        }
          if(req.userId!==userId){
              return res.status(401).send({status:false,msg:"you are not authorized"})
          }

          const userexist=await userModel.findById({_id:userId})
          if(!userexist){
              return res.status(400).send({status:false,msg:"user not exist"})
          }

          const cart=await cartModel.findOne({userId:userId})
          if(!cart){
              return res.status(400).send({status:false,msg:"cart is not avilable"})
          }

          const cartdelete=await cartModel.findByIdAndUpdate({_id:userId},{$set:{items:[],totaItems:0,totalPrice:0}},{new:true})
            return res.status(204).send({status:false,msg:"sucessfully deleted",data:cartdelete})


        
    } catch (error) {
        return res.status(500),send({status:false,msg:error.message})
    }
}



module.exports.addToCart=addToCart
module.exports.getcartById=getcartById
module.exports.deletecartById=deletecartById
module.exports.removeProduct=removeProduct