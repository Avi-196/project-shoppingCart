const productModel=require("../models/productModel")

const aws=require("../controllers/awsController")
const { default: mongoose } = require("mongoose")


const isValid=function(value){
    if(typeof value ==="undefined"||typeof value ==="null")return false
    if(typeof value ==="string" && typeof value.trim().length===0)return false
    return true
}

const isValidfiles = function (files) {
    if (files && files.length > 0)
        return true
}

const isValidObjectId=function(ObjectId){
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

const createproduct=async function(req,res){
       try {
           let data=req.body
           let files=req.files
    const {title,description,price,currencyId,currencyFormat,style,availableSizes } =data 

    if(Object.keys(data).length==0){
        return res.status(400).send({status:false,msg:"your req is bad"})
    }

    if (!isValid(title)) {
        res.status(400).send({ status: false, Message: "title is required" })
        return
    }
    if (!isValid(description)) {
        res.status(400).send({ status: false, Message: "description is required" })
        return
    }
    if (!isValid(price)) {
        res.status(400).send({ status: false, Message: "price is required" })
        return
    }
    if (!isValid(currencyId)) {
        res.status(400).send({ status: false, Message: "currencyId is required"})
        return
    }
 

    if (!isValid(currencyFormat)) {
        res.status(400).send({ status: false, Message: "currencyFormat is required" })
        return
    }
    if (currencyFormat != "₹") {
        res.status(400).send({ status: false, Message: "cureenccy format shouls be rupee" })
        return
    }


    if (!isValid(style)) {
        res.status(400).send({ status: false, Message: "style is required" })
        return
    }
     if(!isValidfiles(files)){
         return res.status(400).send({status:false,msg:"please provide the product image"})
     }
    if(availableSizes){
        
            if (availableSizes.length === 0) {
                return res.status(400).send({ status: false, msg: 'size is needed'})
            }
    }

    const dubTitle=await productModel.findOne({title:title})
    if(dubTitle){
        return res.status(400).send({status:false,msg:"title is already pressent"})
    }

    productImage=await aws.uploadFile(files[0])

    const userproduct={
        title,description,price,currencyId,currencyFormat,productImage,style,availableSizes 
    
    }

       const productCreated=await productModel.create(userproduct)
       return res.status(201).send({status:true,msg:"sucessfully created",data:productCreated})

           
       } catch (error) {
           return res.status(500).send({status:false,msg:error.message})
           
       }
}



const getproductsById=async function(req,res){

    try {
        let productId=req.params.productId
        if(!isValidObjectId(productId)){
            return res.status(400).send({status:false,msg:"product it is not valid"})
        }
        const getproducts=await productModel.findById({_id:productId})
        if(!getproducts){
            return res.status(404).send({status:false,msg:"this product are not avilable"})
        }
        if(getproducts.isDeleted==false){
            return res.status(200).send({status:false,msg:"got data",data:getproducts})
        }
        
    } catch (error) {
        return res.status(500).send({status:false,msg:error.message})
        
    }
}


// const updtaeproductById=async function(req,res){
//     try {
//           let data=req.body
//           let files=req.files
//         const productId = req.params.productId
        
//         const checkProductId = await productModel.findOne({ _id: productId, isDeleted: false })
//      if (!checkProductId) {
//             return res.status(404).send({ status: false, msg: 'please provide valid product id ' })
//         }
//  const { title,description,price,currencyId,currencyFormat,availableSizes,isFreeShipping,style,installments}=data

//         const emptyobj = {}
//         if(title){
//         if (!isValid(title)) {
//             return res.status(400).send({status:false,msg:"title is required"})
//         }
//         const dubTitle=await productModel.findOne({title:title})
//         if(dubTitle){
//             return res.status(400).send({status:false,msg:"title already exist"})
//         }
//         emptyobj.title=title
//     }
      
//        if(description){
//            if(!isValid(description)){
//                return res.status(400).send({status:false,msg:"required descriptio"})

//            }
//        }

//         if (isValid(price)) {
//             updateProductInfo.price = price
//         }

//         if (isValid(currencyId)) {
//             updateProductInfo.currencyId = currencyId
//         }

//         if (isValid(isFreeShipping)) {
//             updateProductInfo.isFreeShipping = isFreeShipping
//         }

//         if (isValid(currencyFormat)) {
//             updateProductInfo.currencyFormat = currencyFormat
//         }

//         if (isValid(style)) {
//             updateProductInfo.style = style
//         }
//         if (availableSizes) {

//             if (availableSizes.length === 0) {
//                 return res.status(400).send({ status: false, msg: 'please provide the product size' })
//             }
          
//             updateProductInfo.$addToSet =availableSizes
//         }
//         if (isValid(installments)) {
//             updateProductInfo.installments = installments
//         }
//         const updatedProduct = await productModel.findOneAndUpdate({ _id: productId }, updateProductInfo, { new: true })

//         return res.status(200).send({ status: true, message: 'Success', data: updatedProduct });

//     } catch (error) {
//         return res.status(500).send({ status: false, message: error.message });
//     }

// }
 



const deleteproductById=async function(req,res){
    try {
        let productId=req.params.productId
        if(!isValidObjectId(productId)){
            return res.status(400).send({status:false,msg:"need valid productid"})
        }
        const productwithId=await productModel.findById({_id:productId})
        if(!productwithId){
            return res.status(404).send({status:false,msg:"not able to found"})
        }
        if(productwithId.isDeleted==true){
            return res.status(400).send({status:false,msg:"product already deleted"})
        }

        const productdelete=await productModel.findByIdAndUpdate({_id:productId},{$set:{isDeleted:true,deletedAt:new Date()}},{new:true})
        return res.status(400).send({status:true,msg:"deleted sucessfully",data:productdelete})
        
    } catch (error) {
        return res.status(500).send({status:false,msg:error.message})
        
    }

}


module.exports.createproduct=createproduct
module.exports.getproductsById=getproductsById
module.exports.deleteproductById=deleteproductById


