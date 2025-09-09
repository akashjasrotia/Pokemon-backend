const express = require('express');
const app = express()
require('./db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cors = require('cors')
const cookieParser = require('cookie-parser')
app.use(cookieParser())
app.use(cors({
    origin:'pokemon-frontend-gold.vercel.app',
    credentials:true
}))
const userModel = require('./userModel')
app.use(express.json())
app.get('/isLoggedIn',(req,res)=>{
    const token = req.cookies.token;
    if(token){
        return res.status(200).json({message:'Logged in'})
    }
    res.status(401).json({message:'Not logged in'})
})
app.post('/signup',(req,res)=>{
    const token = req.cookies.token;
    if(token){
        return res.status(500).json({message:'Already logged in'})
    }
    const {username,email,password} = req.body;
    const user = userModel.findOne({email});
    if(user){
        return res.status(400).json({message:'User already exists'})
    }
    const newUser = new userModel({username,email,password});
    newUser.save().then(()=>{
        res.status(201).json({message:'User created successfully'})
    }).catch((err)=>{
        res.status(500).json({message:'Error creating user',error:err})
    })
})
app.post('/login',async (req,res)=>{
    const token = req.cookies.token;
    if(token){
        return res.status(200).json({message:'Already logged in'})
    }
    try{
        const {email,password} = await req.body;
        const user = await userModel.findOne({email})
        if(!user){
            return res.status(401).json({message:'Invalid credentials'})
        }
        const token = jwt.sign({email},'akash');
        res.cookie('token',token,{httpOnly:true});
        res.status(200).json({message:'Login successful',user})
    }
    catch(err){
        res.status(500).json({message:'Error logging in',error:err})
    }
})
app.get('/me',async (req,res)=>{
    const token = await req.cookies.token;
    if(!token){
        return res.status(401).json({message:'Unauthorized'})
    }
    try{
        const decoded = jwt.verify(token,'akash');
        const email = decoded.email;
        const user = await userModel.findOne({email})
        if(user){
            res.status(200).json({user})
        }
        else{
            res.status(404).json({message:'User not found'})
        }
    }
    catch(err){
        res.status(500).json({message:'Error fetching user',error:err})
    }
})
app.post('/catch',async (req,res)=>{
    const token = await req.cookies.token;
    if(!token){
        return res.status(401).json({message:'Unauthorized'})
    }
    try{
        const decoded =  jwt.verify(token,'akash');
        const email = await decoded.email;
        const {pokemon} = req.body;
        const user = await userModel.findOneAndUpdate({email},{$push:{pokemons:pokemon}},{new:true})
        if(user){
            res.status(200).json({message:'Pokemon caught',user})
        }
        else{
            res.status(404).json({message:'User not found'})
        }
    }
    catch(err){
        res.status(500).json({message:'Error catching pokemon',error:err})
    }
})
app.get('/cought',async (req,res)=>{
    try{
        const token = await req.cookies.token;
        if(!token){
            return res.status(401).json({message:'Unauthorized'})
        }
        const decoded = jwt.verify(token,'akash');
        const email = decoded.email;
        const user = await userModel.findOne({email})
        if(user){
            res.status(200).json({cought:user.pokemons})
        }
        else{
            res.status(404).json({message:'User not found'})
        }
    }
    catch(err){
        res.status(500).json({message:'Error fetching cought pokemons',error:err})
    }
})
app.listen(process.env.PORT,()=>{
    console.log(`connected to port ${process.env.PORT}`)

})

