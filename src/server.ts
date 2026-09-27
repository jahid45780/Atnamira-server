

import { Server } from "http";
import mongoose from "mongoose"
import { envVers } from "./app/config/env";
import app from "./app";



let server:Server

const startServer = async ()=>{
    try {
       
        console.log(envVers.NODE_ENV)
        await mongoose.connect(envVers.DB_URL)
        console.log("contend to DB!!");

         
        server = app.listen(envVers.PORT,()=>{
      console.log(`app is listen on the port ${envVers.PORT}`);
        }) 
        
    } catch (error) {
        console.log(error);
    }
}

  (async()=>{
     await startServer()
  })()

 process.on("SIGINT",()=>{
     console.log("SIGINT detected ... server shutting down",);

     if(server){
        server.close(()=>{
             process.exit(1)
        })
        process.exit(1)
     }
})

process.on("unhandledRejection",(err)=>{
     console.log("UnhandledRejection detected ... server shutting down", err);

     if(server){
        server.close(()=>{
             process.exit(1)
        })
        process.exit(1)
     }
})


process.on("uncaughtException",(err)=>{
     console.log("UncaughtException detected ... server shutting down", err);

     if(server){
        server.close(()=>{
             process.exit(1)
        })
        process.exit(1)
     }
})


