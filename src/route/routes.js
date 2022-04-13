const express=require('express');
const router=express.Router();
const userController=require("../controllers/userController")
const productController=require("../controllers/productController")
 const middleWare=require("../middleWare/auth.js")


router.get("/test-me", function (req, res) {
    res.send("My first ever api!")
})


router.post("/register",userController.createUser)
router.post("/login",userController.loginUser)
router.get("/user/:userId/profile",middleWare.auth,userController.getuserById)
router.put("/user/:userId/profile",middleWare.auth,userController.updateUser)



router.post("/products",productController.createproduct)

router.get("/products",productController.getproductByQuery)


router.get("/products/:productId",productController.getproductsById)

router.put("/products/:productId",productController.updtaeproductById)


router.delete("/products/:productId",productController.deleteproductById)



module.exports=router
