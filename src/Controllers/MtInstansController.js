import { MtInstans } from '../models/MtInstans.js';
import { DBNames } from './../db.js';
import { ObjectID } from 'mongodb';
import { PROYECT_NAME } from '../config.js'
import http from 'axios';


class MtInstansController {


    static async getInstansByAcountID(MongoClient, AcountID) {

        try {
            // console.log('segundo')
            let AcountsCollection = MongoClient.collection(DBNames.MtAcounts);
            let Acount = await AcountsCollection.findOne({ _id: ObjectID(AcountID) });

            // console.log('segundo')
            if (Acount.type == MtInstans.mt5) {
                let mt5_host_url = Acount.mt5_host_url
                let connectionID = Acount.connectionID
                // console.log('segundo')

                if (Acount.mt5_host_url == null || Acount.mt5_host_url == "") {
                    // console.log('segundo 1')
                    let resp  = null;
                    try {
                        
                         resp = await this.connectMt5Api(MongoClient, Acount)
                    } catch (error) {
                        console.log(error)
                    }
                    // console.log('segundo 1')
                    mt5_host_url = resp.mt5_host_url
                    connectionID = resp.connectionID
                    console.log("[NEW CONNECTION]")

                } else {
                    // console.log('segundo 2')
                    try {
                        const resp = (await http.get(`${mt5_host_url}/CheckConnect?id=${connectionID}`))
                        // console.log('segundo 2tr')
                        console.log("[CONNECTED]")

                    } catch (error) {
                        // console.log('segundo 2ca')
                        let resp = await this.connectMt5Api(MongoClient, Acount)
                        // console.log('segundo 2ca')
                        mt5_host_url = resp.mt5_host_url
                        connectionID = resp.connectionID
                        console.log("[RECONNECTED]")

                    }
                    // console.log('segundo 2')
                }

                // console.log('segundo 3')
                await AcountsCollection.updateOne({ _id: ObjectID(AcountID) }, { $set: { lastTime: new Date(), mt5_host_url, connectionID } });
                return { mt5_host_url, connectionID }
            }

            // console.log('ter')
            return null

            //TODO IMPLEMENT MT4

        } catch (error) {

            console.log(error)
            return null

        }


    }

    static async connectMt5Api(MongoClient, Acount) {
        // console.log('tercero')
        let mt5_host_url = await this.takeMtInstans(MongoClient, MtInstans.mt5)
        // console.log('tercero')
        const { access2 } = (await http.get(`${mt5_host_url}/Search?company=${Acount.broker}`));
        // console.log(`${mt5_host_url}/Search?company=${Acount.broker}`)

        const { access } = (await http.get(`${mt5_host_url}/Search?company=${Acount.broker}`)).data
            .find(company => company.company === Acount.broker)
            .results.find(result => result.name === Acount.servidor);

        const [host, port] = access[0].split(':');
        // const [host, port] = (await http.get(`${mt5_host_url}/Search?company=${Acount.broker}`)).data.find(company => company.company === Acount.broker).results.find(result => result.name === Acount.servidor).access[0].split(':');
        // console.log('tercero')
        const resp = await http.get(`${mt5_host_url}/Connect?user=${Acount.login}&password=${Acount.password}&host=${host}&port=${port}`);
        // console.log('tercero')
        let connectionID = resp.data;
        // console.log('tercero')
        return { mt5_host_url, connectionID }

    }

    static async takeMtInstans(MongoClient, type) {

        let MtInstansCollection = MongoClient.collection(DBNames.MtInstans);
        let instans = await MtInstansCollection.find({ proyect: PROYECT_NAME, type }).toArray()
        const randomHost = instans[Math.floor(Math.random() * instans.length)];
        return randomHost.host

    }

}

export default MtInstansController 