import { MtInstans } from '../models/MtInstans.js';
import { DBNames } from './../db.js';
import { ObjectID } from 'mongodb';
import { PROYECT_NAME } from '../config.js'
import http from 'axios';




class MtInstansController {
    
    
    static async getInstansByAcountID(DatabaseClient,AcountID){

        try {
            let AcountsCollection = DatabaseClient.collection(DBNames.MtAcounts);
            let Acount = await AcountsCollection.findOne({_id: ObjectID(AcountID)});
    
            if(Acount.type == MtInstans.mt5){

                let mt5_host_url = Acount.mt5_host_url
                let connectionID = Acount.connectionID
    
                if(Acount.mt5_host_url == null || Acount.mt5_host_url == ""){

                    mt5_host_url = await this.takeMtInstans(DatabaseClient,MtInstans.mt5)
                    const [host, port] = (await http.get(`${mt5_host_url}/Search?company=${Acount.broker}`)).data.find(company => company.company === Acount.broker).results.find(result => result.name === Acount.servidor).access[0].split(':');
                    const resp = await http.get(`${mt5_host_url}/Connect?user=${Acount.login}&password=${Acount.password}&host=${host}&port=${port}`);
                    connectionID = resp.data 
                    console.log("[NEW CONNECT]")
    
                }
    
                await AcountsCollection.updateOne({_id: ObjectID(AcountID)}, { $set: { lastTime: new Date(), mt5_host_url, connectionID} });
                return {mt5_host_url: mt5_host_url, connectionID }
                
            }
    
            return null
            
           //TODO IMPLEMENT MT4

    
        } catch (error) {

            console.log(error)
            return null

        }
       

    }

    static async takeMtInstans( DatabaseClient, type ){
    
        let MtInstansCollection = DatabaseClient.collection(DBNames.MtInstans);
        let instans = await MtInstansCollection.find({proyect:PROYECT_NAME,type}).toArray()
        const randomHost = instans[Math.floor(Math.random() * instans.length)];
        return randomHost.host
        
    }

}

export default MtInstansController 