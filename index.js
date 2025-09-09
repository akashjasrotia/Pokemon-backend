const express = require('express')
const app = express()
require('./db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const userModel = require('./userModel')

app.use(express.json())
app.use(cookieParser())

const allowedOrigins = [
  "http://localhost:5173",
  "https://pokemon-frontend-gold.vercel.app"
];

app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true)
    if(allowedOrigins.indexOf(origin) === -1){
      return callback(new Error('CORS error'), false)
    }
    return callback(null, true)
  },
  credentials: true
}))


app.get('/isLoggedIn',(req,res)=>{
  const token = req.cookies.token
  if(token) return res.status(200).json({message:'Logged in'})
  res.status(401).json({message:'Not logged in'})
})

app.post('/signup', async (req,res)=>{
  const {username,email,password} = req.body
  const user = await userModel.findOne({email})
  if(user) return res.status(400).json({message:'User already exists'})
  
  const hashed = await bcrypt.hash(password, 10)
  const newUser = new userModel({username,email,password:hashed})
  newUser.save()
    .then(()=> res.status(201).json({message:'User created successfully'}))
    .catch(err=> res.status(500).json({message:'Error creating user',error:err}))
})

app.post('/login', async (req,res)=>{
  const {email,password} = req.body
  const user = await userModel.findOne({email})
  if(!user) return res.status(401).json({message:'Invalid credentials'})

  const match = await bcrypt.compare(password, user.password)
  if(!match) return res.status(401).json({message:'Invalid credentials'})

  const token = jwt.sign({email},'akash')
  res.cookie('token',token,{httpOnly:true})
  res.status(200).json({message:'Login successful', user})
})

app.get('/me', async (req,res)=>{
  const token = req.cookies.token
  if(!token) return res.status(401).json({message:'Unauthorized'})

  try{
    const decoded = jwt.verify(token,'akash')
    const user = await userModel.findOne({email:decoded.email})
    if(!user) return res.status(404).json({message:'User not found'})
    res.status(200).json({user})
  } catch(err){
    res.status(500).json({message:'Error fetching user',error:err})
  }
})

app.post('/catch', async (req,res)=>{
  const token = req.cookies.token
  if(!token) return res.status(401).json({message:'Unauthorized'})
  
  try{
    const decoded = jwt.verify(token,'akash')
    const {pokemon} = req.body
    const user = await userModel.findOneAndUpdate(
      {email:decoded.email},
      {$push:{pokemons:pokemon}},
      {new:true}
    )
    if(!user) return res.status(404).json({message:'User not found'})
    res.status(200).json({message:'Pokemon caught',user})
  } catch(err){
    res.status(500).json({message:'Error catching pokemon',error:err})
  }
})

app.get('/cought', async (req,res)=>{
  const token = req.cookies.token
  if(!token) return res.status(401).json({message:'Unauthorized'})

  try{
    const decoded = jwt.verify(token,'akash')
    const user = await userModel.findOne({email:decoded.email})
    if(!user) return res.status(404).json({message:'User not found'})
    res.status(200).json({cought:user.pokemons})
  } catch(err){
    res.status(500).json({message:'Error fetching cought pokemons',error:err})
  }
})

app.listen(process.env.PORT || 3000, ()=> {
  console.log(`Server running on port ${process.env.PORT || 3000}`)
})

