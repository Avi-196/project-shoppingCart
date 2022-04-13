const userModel=require("../models/userModel")
const aws=require("../controllers/awsController")
const bcrypt=require('bcrypt')
const saltRounds=10
const jwt=require("jsonwebtoken")



const isValid=function (value){
    if(typeof value ==="undefined"||typeof value ==="null") return false
    if(typeof value ==='string' &&  value.trim().length ===0) return false
    return true
}

const isValidfiles = function (files) {
    if (files && files.length > 0)
        return true
}

const createUser=async function(req,res){
    try {
        let data=req.body
        let files = req.files;

        let {fname,lname,email,phone,password,address}=data
        if(Object.keys(data).length==0){
          return  res.status(400).send({status:false,msg:"your request is bad"})
        }
       
        if(!isValid(fname)){
            return res.status(400).send({status:false,msg:"fname is required"})
        }
        if(!isValid(lname)){
            return res.status(400).send({status:false,msg:"lname is required"})
        }
        if(!isValid(email)){
            return  res.status(400).send({status:false,msg:"email is required"})
        }
        if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
            return res.status(404).send({ status: false, msg: "Invalid Email" })
            
        }
        if(!isValid(phone)){
            return res.status(400).send({status:false,msg:'phone no is rquired'})
        }
    
     if(!(/^\d{10}$/.test(phone))) {
        res.status(400).send({ status: false, msg: "Invalid Phone Number, it should be of 10 digits" })
        return
    }
    if(!isValid(password)){
          return res.status(400).send({status:false,msg:"password is rquired"})
    }
    if (password.length > 15) {
      return  res.status(400).send({ status: false, msg: "Password should be less than 15 characters"})
        
    }
    if (password.length < 8) {
      return  res.status(400).send({ status: false, msg: "Password should be more than 8 characters"})
        
    }
   if(!isValid(address)){
       return res.status(400).send({status:false,msg:"address is required"})
   }
   if (address) {
    if (address.shipping) {
        if (!isValid(address.shipping.street)) {
            res.status(400).send({ status: false, Message: "Please provide street name in shipping address" })
            return
        }
        if (!isValid(address.shipping.city)) {
            res.status(400).send({ status: false, Message: "Please provide city name in shipping address" })
            return
        }
        if (!isValid(address.shipping.pincode)) {
            res.status(400).send({ status: false, Message: "Please provide pincode in shipping address" })
            return
        }
    }
    if (address.billing) {
        if (!isValid(address.billing.street)) {
            res.status(400).send({ status: false, Message: "Please provide street name in billing address" })
            return
        }
        if (!isValid(address.billing.city)) {
            res.status(400).send({ status: false, Message: "Please provide city name in billing address" })
            return
        }
        if (!isValid(address.billing.pincode)) {
            res.status(400).send({ status: false, Message: "Please provide pincode in billing address" })
            return
        }
    }
}
if (!isValidfiles(files)) {
    res.status(400).send({ status: false, Message: "Please provide profileImage" })
    return
}

    
   let isEmailAlreadyUsed = await userModel.findOne({ email })
   if (isEmailAlreadyUsed) {
     return  res.status(400).send({ status: false, msg: "Email Already Exists" })
       
   }
   let isPhoneAlreadyUsed = await userModel.findOne({ phone })
   if (isPhoneAlreadyUsed) {
      return  res.status(400).send({ status: false, msg: "Phone number Already Exists" })
       
   }

   
   
  profileImage = await aws.uploadFile(files[0]);
 password = await bcrypt.hash(password, saltRounds)
const userdata = {
    fname,lname, profileImage,email,
    phone, password, address
}


   const userCreated=await userModel.create(userdata)
   return res.status(201).send({status:true,msg:"succesfully created",data:userCreated})
       

        
    } catch (error) {
        res.status(500).send({status:false,msg:error.message})
    }
}


const loginUser=async function(req,res){
    try {
        let body=req.body
        let {email,password}=body
        if (!isValid(email)) {
            res.status(400).send({ status: false, msg: "Email is required" })
            return
        }
        if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
            res.status(400).send({ status: false, msg: "email should have valid email address" })
            return
        }
        
        if (!isValid(password)) {
            res.status(400).send({ status: false, msg: "Password is required" })
            return
        }
        let user=await userModel.findOne({email:email})
        if(!user){
            return res.status(400).send({status:false,msg:"please provide email and password"})
        }
        const encryptedPassword = await bcrypt.compare(body.password, user.password)

            if (!encryptedPassword) {
                return res.status(400).send({ status: false, msg: 'password is incorrect' })
            }


        else{
            const userId=user._id
            let token=jwt.sign({userId:userId,
                

            },"project5-group31-shoppingcart",{expiresIn:"60m"})
            res.header("x-api-key",token)
            res.status(201).send({status:true,  msg:"user login sucessfull",data:{userId,token}})

        }
    } catch (error) {
        console.log(error)
        res.status(500).send({msg:error.message})
        
    }
}


const getuserById = async (req, res) => {
    try {
        
        const userId = req.params.userId
        if(req.userId!==userId){
            return res.status(401).send({status:false,msg:"you are not authorized"})
        }

        const profilematch = await userModel.findOne({ _id: userId })
        console.log(profilematch._id)
    

        if (!profilematch) {
            return res.status(404).send({ status: false, message: ' profile  does not found' })
        }
        return res.status(200).send({ status: true, message: 'profile details', data:profilematch })
      
    } catch (error) {
        return res.status(500).send({ success: false, error: error.message });
    }
}


const updateUser = async function (req, res) {

    try {
            
        let data=req.body
        let files = req.files;

        const userId = req.params.userId

        

        if (req.userId!=userId) {
            return res.status(401).send({ status: false, msg: "you are not authorized" })
        }


        const { fname, lname, email, phone, password, address } = data
        const emptyobj = {}

        if (fname) {
            if (!isValid(fname)) {
                res.status(400).send({ status: false, Message: "please provide fname" })
                return
            }
            emptyobj.fname = fname
        }

        if (lname) {
            if (!isValid(lname)) {
                res.status(400).send({ status: false, Message: "please give lname" })
                return
            }
            emptyobj.lname = lname
        }
        
        if(!isValid(email)){
            return res.status(400).send({status:false,msg:"email is required"})
        }
         
        if (email) {
            if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email))) {
                return res.status(400).send({ status: false, msg: 'enter valid email' })
            }

          

            const dubEmail = await userModel.findOne({ email: email });

            if (dubEmail) {
                res.status(400).send({ status: false, message:"email is already exist"})
                return
            }
            emptyobj.email = email
        }
        if(!isValid(phone)){
            return res.status(400).send({status:false,msg:"phone is required"})
        }
        if (phone) {
            if (!(/^\d{10}$/.test(phone))) {
                res.status(400).send({ status: false, message: "phone no should be in 10digits"})
                return
            }
            const dubPhone = await userModel.findOne({ phone: phone });

            if (dubPhone) {
                res.status(400).send({ status: false, message:   "phone is already registered" })
                return
            }
            emptyobj.phone = phone
        }

        if (password) {
            if(!isValid(password)){
                return res.status(400).send({status:false,msg:"password is rquired"})
            }
            if (password.length > 15) {
                return  res.status(400).send({ status: false, msg: "Password should be less than 15 characters"})
                  
              }
              if (password.length < 8) {
                return  res.status(400).send({ status: false, msg: "Password should be more than 8 characters"})
                  
              }

            const encryptedPassword = await bcrypt.hash(password, saltRounds)

            emptyobj.password = encryptedPassword

        }
        

        if (isValidfiles(files)) {
            profileImage = await aws.uploadFile(files[0]);
            emptyobj.profileImage = profileImage

        }

        if (address) {

            if (address.shipping) {

                if (address.shipping.street) {

                    if (!isValid(address.shipping.street)) {
                        res.status(400).send({ status: false, Message: "Please provide street in shipping" })
                        return
                    }
                    emptyobj["address.shipping.street"] = address.shipping.street
                }

                if (address.shipping.city) {
                    if (!isValid(address.shipping.city)) {
                        res.status(400).send({ status: false, Message: "Please provide city in shipping" })
                        return
                    }
                    emptyobj["address.shipping.city"] = address.shipping.city
                }

                if (address.shipping.pincode) {
                    if (!isValid(address.shipping.pincode)) {
                        res.status(400).send({ status: false, Message: "Please provide in shipping" })
                        return
                    }
                    emptyobj["address.shipping.pincode"] = address.shipping.pincode
                }

            }

            if (address.billing) {

                if (address.billing.street) {

                    if (!isValid(address.billing.street)) {
                        res.status(400).send({ status: false, Message: "Please provide street in billing" })
                        return
                    }
                    emptyobj["address.billing.street"] = address.billing.street
                }

                if (address.billing.city) {
                    if (!isValid(address.billing.city)) {
                        res.status(400).send({ status: false, Message: "Please provide city  in billing" })
                        return
                    }

                    emptyobj["address.billing.city"] = address.billing.city
                }

                if (address.billing.pincode) {

                    if (!isValid(address.billing.pincode)) {
                        res.status(400).send({ status: false, Message: "Please provide pincode in billing address" })
                        return
                    }

                    emptyobj["address.billing.pincode"] = address.billing.pincode
                }

            }
        }

        const userupdate = await userModel.findOneAndUpdate({ _id:userId }, emptyobj, { new: true })

        res.status(200).send({ status: true, message: "updated sucessfully", data: userupdate });
    }
    catch (error) {
        res.status(500).send({ status: false, Message: error.message })
    }
}








module.exports.createUser=createUser
module.exports.loginUser=loginUser
module.exports.getuserById=getuserById
module.exports.updateUser=updateUser