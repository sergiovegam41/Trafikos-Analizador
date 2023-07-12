import { MONGODB_URI,  } from './config.js'
import { MongoClient, ServerApiVersion } from 'mongodb';

export class DBNames {
    static countries = "countries";
    static states = "states";
    static cities = "cities";
    static MtInstans = "MtInstans";
    static MtAcounts = "MtAcounts";
    static session_tokens = "session_tokens";
} 

export const connectDB = async ( onConnect )=>{


    try {

        const Mongoclient = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


        return Mongoclient.connect(async err => {
           
            if(onConnect){
                onConnect(Mongoclient)
            }


            
        })
        
        
    } catch (error) {

        console.log(error)
        
    }

}