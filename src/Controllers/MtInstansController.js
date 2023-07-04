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
                    console.log('host: '+mt5_host_url+' Host ')
                    const respuesta = (await http.get(`${mt5_host_url}/Search?company=${Acount.broker}`)).data
                    console.log(respuesta)
                    const result = respuesta.find(company => company.company == Acount.broker)
                    console.log(result)
                    
                    const result2 = result.results.find(result => result.name === Acount.servidor).access[0];
                    console.log(result2)
                    
                    const [ host, port ] = result2.split(':');
                    console.log(host, port)

                   
                   
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