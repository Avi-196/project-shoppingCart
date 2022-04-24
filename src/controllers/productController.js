const productModel=require("../models/productModel")

const aws=require("../controllers/awsController")
const mongoose=require("mongoose")



const isValid=function(value){
    if(typeof value ==="undefined"||typeof value ===null)return false
    if(typeof value ==="string" &&  value.trim().length===0)return false
    return true
}
const isValidNumber = function (value) {

    if (typeof value === 'undefined' || value === null) return false
    if (  isNaN(value)    && value.toString().trim().length !== 0) return false
    return true;
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
    let {title,description,price,currencyId,currencyFormat,style,availableSizes } =data 

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
        res.status(400).send({ status: false, Message: "cureenccy format should be rupee" })
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
         availableSizes = availableSizes.map(x => x.trim())

        for (let i = 0; i < availableSizes.length; i++) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes[i]))) {
                return res.status(400).send({ status: false, message: "AvailableSizes contains ['S','XS','M','X','L','XXL','XL'] only" })
            }
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

const getproductByQuery = async function (req, res) {

    try {

        const requestQuery = req.query

        const { size, name, priceGreaterThan, priceLessThan, priceSort } = requestQuery

        const finalFilter = [{ isDeleted: false }]

        if (isValid(name)) {
            finalFilter.push({ title: { $regex: name, $options: "$i" } })
        }
        if (isValid(size)) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size))) {
                return res.status(400).send({ status: false, message: "please enter valid size  " })
            }
            finalFilter.push({ availableSizes: size })
        }

        if (isValidNumber(priceGreaterThan)) {

            finalFilter.push({ price: { $gt: priceGreaterThan } })
        }
        if (isValidNumber(priceLessThan)) {

            finalFilter.push({ price: { $lt: priceLessThan } })
        }

     
        if (isValidNumber(priceSort)) {

            if (priceSort != 1 && priceSort != -1) {
                return res.status(400).send({ status: false, message: "pricesort must to 1 or -1" })
            }
            const productpricessort = await productModel.find({ $and: finalFilter }).sort({ price: priceSort })

            if (Array.isArray(productpricessort) && productpricessort.length === 0) {
                return res.status(404).send({ status: false, message: "data not found" })
            }

            return res.status(200).send({ status: true, message: "products with sorted price", data:productpricessort })
        }

          
        const fillteredProducts = await productModel.find({ $and: finalFilter })
         //for checking array
        if (Array.isArray(fillteredProducts) && fillteredProducts.length === 0) {
            return res.status(404).send({ status: false, message: "data not found" })
        }

        return res.status(200).send({ status: true, message: "products without sorted", data: fillteredProducts })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}



const getproductsById=async function(req,res){

    try {
        let productId=req.params.productId
        if(!isValidObjectId(productId)){
            return res.status(400).send({status:false,msg:"product id is not valid"})
        }
        const getproducts=await productModel.findById({_id:productId})
        if(!getproducts){
            return res.status(404).send({status:false,msg:"this product are not avilable"})
        }
        if(getproducts.isDeleted==false){
            return res.status(200).send({status:true,msg:"got data",data:getproducts})
        }else{
            return res.status(404).send({status:false,msg:"product not found or maybe deleted"})
        }
        
    } catch (error) {
        return res.status(500).send({status:false,msg:error.message})
        
    }
}


const updtaeproductById=async function(req,res){
    try {
          let data=req.body
          let files=req.files
        const productId = req.params.productId
        
        const checkProductId = await productModel.findOne({ _id: productId, isDeleted: false })
     if (!checkProductId) {
            return res.status(404).send({ status: false, msg: 'this product is not avilable or deleted' })
        }
 const { title,description,price,currencyId,currencyFormat,availableSizes,style,installments,isFreeShipping}=data

        const emptyobj = {}
    
        if(isValid(title)){
        const dubTitle=await productModel.findOne({title:title})
        if(dubTitle){
            return res.status(400).send({status:false,msg:"title already exist"})
        }
        emptyobj.title=title
    }
      
       if(isValid(description)){
         
           emptyobj.description=description
       }
        if(isValid(price)){
        
            
            if (price<=0) {
                return res.status(400).send({ status: false, message:"price should be more than 0" })
            }
        emptyobj.price=price
    }
          if(isValid (currencyId)){
       
        emptyobj.currencyId=currencyId
    }
        
       if(isValid(currencyFormat)){
           emptyobj.currencyFormat=currencyFormat

    }
       if(isValid(style)){
      
        emptyobj.style=style

    }
        if (availableSizes) {

            if (availableSizes.length === 0) {
                return res.status(400).send({ status: false, msg: 'please provide the product size' })
            }
          
            emptyobj.availableSizes =availableSizes
        }
        if (isValid(installments)) {
            emptyobj.installments = installments
        }
        if(isValid(isFreeShipping)){
            emptyobj.isFreeShipping=isFreeShipping
        }
        
        if (isValidfiles(files)) {
            productImage = await aws.uploadFile(files[0]);
            emptyobj.productImage = productImage

        }

        const product = await productModel.findOneAndUpdate({ _id: productId },emptyobj, { new: true })
   
        return res.status(200).send({ status: true, message: ' updated Successfully', data: product });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }

}
 



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
        return res.status(200).send({status:true,msg:"deleted sucessfully",data:productdelete})
        
    } catch (error) {
        return res.status(500).send({status:false,msg:error.message})
        
    }

}


module.exports.createproduct=createproduct
module.exports.getproductByQuery=getproductByQuery
module.exports.getproductsById=getproductsById
module.exports.deleteproductById=deleteproductById
module.exports.updtaeproductById=updtaeproductById


