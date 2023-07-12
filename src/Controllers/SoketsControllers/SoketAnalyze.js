import MtAcountsController from '../MtAcountsController.js';
import MtInstansController from "../MtInstansController.js";
import SessionsController from "../SessionsController.js";
import { DBNames } from "../../db.js";
import { ObjectID } from 'mongodb';


class SoketAnalizador{
    static analize = "analize"

    static async run(io,clientSocket, MongoClient, SQLClient, data){

        let session = await SessionsController.getCurrentSession(MongoClient, {headers:{authorization: data.token}})
        let MTAcounts = await MtAcountsController.getMyAcountByUserID(MongoClient,{headers:{authorization: data.token}}, null, false, session)
        let CurrentAcount = MTAcounts.data[0]
        let CurrentInstans = await MtInstansController.getInstansByAcountID(MongoClient, CurrentAcount._id)

        clientSocket.on("client:"+this.analize+":change_account",async (data)=>{

            let result = MTAcounts.data.find(cuenta => cuenta.login === data.login);
            console.log("[Changue]")
            if(result){
                CurrentAcount = result
                CurrentInstans = await MtInstansController.getInstansByAcountID(MongoClient, CurrentAcount._id)

            }

        })
        
        clientSocket.emit("server:init", { success: true, code:"",msj:"", initData: MTAcounts})

        this.emitData( io,clientSocket,MongoClient, SQLClient, data, CurrentAcount, session, CurrentInstans )

        const intervalId = setInterval(async () => {
        
            this.emitData( io,clientSocket,MongoClient, SQLClient, data, CurrentAcount, session, CurrentInstans )
        
        }, 3000);


        clientSocket.on('disconnect', () => {
            
            console.log('Client disconnected');
            clearInterval(intervalId);

        });

    }

    static async emitData(io,clientSocket,MongoClient,SQLClient,data,Acount, session,instans) {
        // console.log(Acount.login)

        let resp = await MtAcountsController.getAcountByID(
            MongoClient,
            {        
                params:{
                    acount_id: Acount._id 
                },
                headers:{authorization: data.token}
            },
            null,
            SQLClient,
            false,
            Acount,
            session,
            instans
        )


        clientSocket.emit("server:"+this.analize+":data", resp )
        
    }

   

}





export default SoketAnalizador 