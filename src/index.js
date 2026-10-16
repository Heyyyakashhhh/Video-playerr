import dotenv from "dotenv";
import connectDB from "./db/connnection.js";
import {app} from "./app.js";
dotenv.config({
    path: "./.env"
});

connectDB().then(()=>{
    app.listen(process.env.PORT || 5000, ()=>{
        console.log(`\n 🖥 server running at port: ${process.env.PORT || 8000}`);
    })
}).catch((err)=>{
    console.log(`MongoDb connection failed at : \n error: ${err.message}`);
})